import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/lms/hierarchy
 * Public endpoint — no auth required.
 *
 * Builds course → subject → version → section → topic hierarchy from lms_content.
 * Uses per-attempt try/catch so a thrown Supabase error never escapes to the 500 handler.
 * Falls back through: full schema → no section column → topics table join → minimal.
 *
 * Only returns topics that have actual content (detailed_notes IS NOT NULL).
 */
export async function GET() {
    const supabase = getSupabaseAdmin();

    let rows: any[] = [];
    let usedFallback = false;

    // Helper: detect missing-column errors from Supabase/PostgREST
    function isMissingColumn(err: any): boolean {
        const msg: string = err?.message ?? String(err ?? '');
        const code: string = err?.code ?? '';
        return code === '42703' || msg.includes('column') || msg.includes('does not exist');
    }

    // ── ATTEMPT 1: Full schema including section ──
    try {
        const { data, error } = await supabase
            .from('lms_content')
            .select('topic_id, course, subject, section, topic, version, last_generated_at')
            .not('detailed_notes', 'is', null)
            .order('course').order('subject').order('version').order('topic');

        if (!error) {
            rows = data ?? [];
            // Success path — fall through to hierarchy builder
        } else if (isMissingColumn(error)) {
            throw new Error('COLUMN_MISSING'); // handled below
        } else {
            throw error;
        }
    } catch (err: any) {
        if (err?.message !== 'COLUMN_MISSING' && !isMissingColumn(err)) {
            console.error('[LMS Hierarchy] DB error:', err?.message);
            return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
        }

        // ── ATTEMPT 2: Without section column ──
        usedFallback = true;
        console.warn('[LMS Hierarchy] section column missing — trying without it');

        let gotRows = false;
        try {
            const { data, error } = await supabase
                .from('lms_content')
                .select('topic_id, course, subject, topic, version, last_generated_at')
                .not('detailed_notes', 'is', null)
                .order('course').order('subject').order('version').order('topic');

            if (!error && data) {
                // Enrich with section via topics table join
                const topicIds = data.map((r: any) => r.topic_id).filter(Boolean);
                const sectionMap: Record<string, string> = {};

                if (topicIds.length > 0) {
                    try {
                        const { data: topicData } = await supabase
                            .from('topics')
                            .select('id, section')
                            .in('id', topicIds);
                        for (const t of (topicData ?? [])) {
                            if (t.id && t.section) sectionMap[t.id] = t.section;
                        }
                    } catch { /* section from topics optional */ }
                }

                rows = data.map((r: any) => ({
                    ...r,
                    section: sectionMap[r.topic_id] || 'General',
                }));
                gotRows = true;
            } else if (error && isMissingColumn(error)) {
                console.warn('[LMS Hierarchy] core columns also failing — trying minimal');
            } else if (error) {
                throw error;
            }
        } catch (err2: any) {
            if (!isMissingColumn(err2)) {
                console.error('[LMS Hierarchy] DB error (attempt 2):', err2?.message);
                return NextResponse.json({ success: false, error: err2?.message }, { status: 500 });
            }
        }

        // ── ATTEMPT 3: Absolute minimal ──
        if (!gotRows) {
            try {
                const { data, error } = await supabase
                    .from('lms_content')
                    .select('topic_id, course, subject, topic, introduction, detailed_notes')
                    .not('detailed_notes', 'is', null);

                if (!error && data) {
                    rows = data.map((r: any) => ({ ...r, section: 'General', version: new Date().getFullYear().toString() }));
                }
            } catch { /* silent */ }
        }
    }

    // ── Build hierarchy: course → subjects → versions → sections → topics ──
    type TopicEntry  = { id: string; name: string };
    type SectionMap  = Record<string, TopicEntry[]>;
    type VersionEntry = { id: string; name: string; sections: SectionMap };
    type VersionMap  = Record<string, VersionEntry>;
    type SubjectEntry = { id: string; name: string; versions: VersionMap };
    type SubjectMap  = Record<string, SubjectEntry>;
    type CourseEntry = { id: string; name: string; subjects: SubjectMap };
    type CourseMap   = Record<string, CourseEntry>;

    const coursesMap: CourseMap = {};

    for (const row of rows) {
        const courseName  = (row.course   || 'Unknown Course').trim();
        const subjectName = (row.subject  || 'Unknown Subject').trim();
        const versionName = (row.version  || String(new Date().getFullYear())).trim();
        const sectionName = (row.section  || 'General').trim();
        const topicName   = (row.topic    || '').trim();
        const topicId     = row.topic_id  || '';

        if (!topicId || !topicName) continue;

        if (!coursesMap[courseName]) {
            coursesMap[courseName] = { id: courseName, name: courseName, subjects: {} };
        }
        const courseEntry = coursesMap[courseName];

        if (!courseEntry.subjects[subjectName]) {
            courseEntry.subjects[subjectName] = { id: subjectName, name: subjectName, versions: {} };
        }
        const subjectEntry = courseEntry.subjects[subjectName];

        if (!subjectEntry.versions[versionName]) {
            subjectEntry.versions[versionName] = { id: versionName, name: versionName, sections: {} };
        }
        const versionEntry = subjectEntry.versions[versionName];

        if (!versionEntry.sections[sectionName]) {
            versionEntry.sections[sectionName] = [];
        }

        const alreadyExists = versionEntry.sections[sectionName].some(t => t.id === topicId);
        if (!alreadyExists) {
            versionEntry.sections[sectionName].push({ id: topicId, name: topicName });
        }
    }

    // ── Convert maps → sorted arrays ──
    const courses = Object.values(coursesMap).map(course => ({
        id: course.id,
        name: course.name,
        subjects: Object.values(course.subjects).map(subject => ({
            id: subject.id,
            name: subject.name,
            versions: Object.values(subject.versions).map(version => ({
                id: version.id,
                name: version.name,
                sections: Object.entries(version.sections).map(([secName, topics]) => ({
                    id: secName,
                    name: secName,
                    topics: (topics as TopicEntry[]).sort((a, b) => a.name.localeCompare(b.name)),
                })).sort((a, b) => a.name.localeCompare(b.name)),
            })).sort((a, b) => a.name.localeCompare(b.name)),
        })).sort((a, b) => a.name.localeCompare(b.name)),
    })).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
        success: true,
        courses,
        meta: { usedFallback, topicCount: rows.length },
    });
}
