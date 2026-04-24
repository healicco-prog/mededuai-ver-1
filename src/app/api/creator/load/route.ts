import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/creator/load?courseName=MBBS&subjectName=Pharmacology&sectionName=General Pharmacology
 *
 * Returns all topics for the given course/subject/section with their existing lms_content
 * mapped to the generatedNotes format expected by CreatorManagerClient (l1→introduction, l2→detailed_notes, etc.)
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const courseName = searchParams.get('courseName');
        const subjectName = searchParams.get('subjectName');
        const sectionName = searchParams.get('sectionName');

        if (!courseName || !subjectName) {
            return NextResponse.json({ success: false, error: 'courseName and subjectName are required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Resolve course
        const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('name', courseName)
            .maybeSingle();

        if (!course?.id) {
            return NextResponse.json({ success: true, notes: {} });
        }

        // Resolve subject
        const { data: subject } = await supabase
            .from('subjects')
            .select('id')
            .eq('name', subjectName)
            .eq('course_id', course.id)
            .maybeSingle();

        if (!subject?.id) {
            return NextResponse.json({ success: true, notes: {} });
        }

        // Fetch topics (filter by section if provided)
        let topicsQuery = supabase
            .from('topics')
            .select('id, name, section')
            .eq('subject_id', subject.id);

        if (sectionName) {
            topicsQuery = topicsQuery.eq('section', sectionName);
        }

        const { data: topics } = await topicsQuery;

        if (!topics || topics.length === 0) {
            return NextResponse.json({ success: true, notes: {} });
        }

        const topicIds = topics.map(t => t.id);

        // Fetch all lms_content for these topics (try full columns, fall back to core for old schema)
        let lmsContents: any[] | null = null;
        const { data: lmsFull, error: lmsFullErr } = await supabase
            .from('lms_content')
            .select('topic_id, version, course, subject, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_questions, marks_2_questions, marks_1_questions, flashcards, ppt_content')
            .in('topic_id', topicIds);

        if (lmsFullErr && (lmsFullErr.message?.includes('column') || lmsFullErr.message?.includes('does not exist'))) {
            // Try without new columns (partially migrated schema)
            console.warn('[Creator Load] Some columns missing, trying reduced column set');
            const { data: lmsMid, error: lmsMidErr } = await supabase
                .from('lms_content')
                .select('topic_id, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_questions, marks_2_questions, marks_1_questions, flashcards, ppt_content')
                .in('topic_id', topicIds);
            if (lmsMidErr && (lmsMidErr.message?.includes('column') || lmsMidErr.message?.includes('does not exist'))) {
                // Old schema fallback
                console.warn('[Creator Load] marks_* columns missing, fetching core columns only');
                const { data: lmsCore } = await supabase
                    .from('lms_content')
                    .select('topic_id, introduction, detailed_notes, summary, flashcards, ppt_content')
                    .in('topic_id', topicIds);
                lmsContents = lmsCore;
            } else {
                lmsContents = lmsMid;
            }
        } else {
            lmsContents = lmsFull;
        }

        // Build a map: topicName → generatedNotes (l1…l10 keys)
        const lmsMap: Record<string, Record<string, string>> = {};

        for (const topic of topics) {
            const content = lmsContents?.find(lc => lc.topic_id === topic.id);
            if (!content) continue;

            const notes: Record<string, string> = {};
            if (content.introduction) notes['l1'] = content.introduction;
            if (content.detailed_notes) notes['l2'] = content.detailed_notes;
            if (content.summary) notes['l3'] = content.summary;
            // ── Question columns (standardized names) ──
            if (content.marks_10_questions) notes['l4'] = content.marks_10_questions;
            if (content.marks_5_questions) notes['l5'] = content.marks_5_questions;
            if (content.marks_3_questions) notes['l6'] = content.marks_3_questions;
            if (content.marks_2_questions) notes['l7'] = content.marks_2_questions;
            if (content.marks_1_questions) notes['l8'] = content.marks_1_questions;
            if (content.flashcards?.raw) notes['l9'] = content.flashcards.raw;
            else if (typeof content.flashcards === 'string') notes['l9'] = content.flashcards;
            if (content.ppt_content?.raw) notes['l10'] = content.ppt_content.raw;
            else if (typeof content.ppt_content === 'string') notes['l10'] = content.ppt_content;

            if (Object.keys(notes).length > 0) {
                lmsMap[topic.name] = notes;
            }
        }

        return NextResponse.json({ success: true, notes: lmsMap });
    } catch (error: any) {
        console.error('[Creator Load API] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}
