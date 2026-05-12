import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/lms/hierarchy
 * Public endpoint — no auth required.
 * Builds course → subject → section → topic hierarchy directly from lms_content
 * (which has public RLS read access). Only returns topics that have actual content.
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        // Query lms_content directly — it stores denormalized course/subject/section/topic
        // and has public read RLS. We only surface topics with detailed_notes generated.
        const { data: rows, error } = await supabase
            .from('lms_content')
            .select('topic_id, course, subject, section, topic, version, last_generated_at')
            .not('detailed_notes', 'is', null)
            .order('course')
            .order('subject')
            .order('section')
            .order('topic');

        if (error) throw error;

        // Build hierarchy: course → subjects → sections → topics
        type TopicEntry = { id: string; name: string; section: string; version: string | null };
        type SectionMap = Record<string, TopicEntry[]>;
        type SubjectEntry = { id: string; name: string; sections: SectionMap };
        type SubjectMap = Record<string, SubjectEntry>;
        type CourseEntry = { id: string; name: string; subjects: SubjectMap };
        type CourseMap = Record<string, CourseEntry>;

        const coursesMap: CourseMap = {};

        for (const row of (rows || [])) {
            const courseName = row.course || 'Unknown Course';
            const subjectName = row.subject || 'Unknown Subject';
            const sectionName = row.section || subjectName; // fallback to subject name
            const topicName = row.topic || 'Unknown Topic';
            const topicId = row.topic_id || '';

            if (!topicId || !topicName) continue;

            if (!coursesMap[courseName]) {
                coursesMap[courseName] = { id: courseName, name: courseName, subjects: {} };
            }

            const courseEntry = coursesMap[courseName];
            if (!courseEntry.subjects[subjectName]) {
                courseEntry.subjects[subjectName] = { id: subjectName, name: subjectName, sections: {} };
            }

            const subjectEntry = courseEntry.subjects[subjectName];
            if (!subjectEntry.sections[sectionName]) {
                subjectEntry.sections[sectionName] = [];
            }

            // Avoid duplicates
            const alreadyExists = subjectEntry.sections[sectionName].some(t => t.id === topicId);
            if (!alreadyExists) {
                subjectEntry.sections[sectionName].push({
                    id: topicId,
                    name: topicName,
                    section: sectionName,
                    version: row.version || null,
                });
            }
        }

        // Convert to arrays
        const courses = Object.values(coursesMap).map(course => ({
            id: course.id,
            name: course.name,
            subjects: Object.values(course.subjects).map(subject => ({
                id: subject.id,
                name: subject.name,
                sections: Object.entries(subject.sections).map(([secName, topics]) => ({
                    id: secName,
                    name: secName,
                    topics: topics.sort((a, b) => a.name.localeCompare(b.name)),
                })).sort((a, b) => a.name.localeCompare(b.name)),
            })).sort((a, b) => a.name.localeCompare(b.name)),
        })).sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ success: true, courses });
    } catch (error: any) {
        console.error('[LMS Hierarchy] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}
