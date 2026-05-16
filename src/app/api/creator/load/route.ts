import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkSecurity } from '@/lib/apiSecurity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/creator/load?courseName=MBBS&subjectName=Pharmacology&sectionName=General Pharmacology
 *
 * Returns all topics for the given course/subject/section with their existing lms_content
 * mapped to the generatedNotes format expected by CreatorManagerClient (l1→introduction, l2→detailed_notes, etc.)
 *
 * Uses TWO query paths and merges results:
 *  PATH 1 – topics table join (original): courseName→course.id→subject.id→topics→lms_content
 *  PATH 2 – direct lms_content query by denormalized text columns (course/subject/section)
 *            This catches content saved via the batch pipeline where topic_id is stored but
 *            the section name or topics table row may differ from the Zustand curriculum.
 */
export async function GET(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin', 'deptadmin', 'instadmin', 'teacher'] });
    if (!sec.authorized) return sec.response;

    try {
        const { searchParams } = new URL(req.url);
        const courseName = searchParams.get('courseName');
        const subjectName = searchParams.get('subjectName');
        const sectionName = searchParams.get('sectionName');

        if (!courseName || !subjectName) {
            return NextResponse.json({ success: false, error: 'courseName and subjectName are required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Merged result: topicName → generatedNotes (l1…l10 keys)
        const lmsMap: Record<string, Record<string, string>> = {};

        // Helper to map a lms_content row into l1…l10 keys
        const mapRow = (content: any): Record<string, string> => {
            const notes: Record<string, string> = {};
            if (content.introduction)        notes['l1'] = content.introduction;
            if (content.detailed_notes)      notes['l2'] = content.detailed_notes;
            if (content.summary)             notes['l3'] = content.summary;
            if (content.marks_10_questions)  notes['l4'] = content.marks_10_questions;
            if (content.marks_5_questions)   notes['l5'] = content.marks_5_questions;
            if (content.marks_3_reasoning)   notes['l6'] = content.marks_3_reasoning;
            if (content.marks_2_case_mcqs)   notes['l7'] = content.marks_2_case_mcqs;
            if (content.marks_1_mcqs)        notes['l8'] = content.marks_1_mcqs;
            if (content.flashcards?.raw)     notes['l9'] = content.flashcards.raw;
            else if (typeof content.flashcards === 'string') notes['l9'] = content.flashcards;
            if (content.ppt_content?.raw)    notes['l10'] = content.ppt_content.raw;
            else if (typeof content.ppt_content === 'string') notes['l10'] = content.ppt_content;
            return notes;
        };

        // ── PATH 1: join via topics table ─────────────────────────────────────
        try {
            const { data: course } = await supabase
                .from('courses')
                .select('id')
                .eq('name', courseName)
                .maybeSingle();

            if (course?.id) {
                const { data: subject } = await supabase
                    .from('subjects')
                    .select('id')
                    .eq('name', subjectName)
                    .eq('course_id', course.id)
                    .maybeSingle();

                if (subject?.id) {
                    let topicsQuery = supabase
                        .from('topics')
                        .select('id, name, section')
                        .eq('subject_id', subject.id);

                    if (sectionName) {
                        topicsQuery = topicsQuery.eq('section', sectionName);
                    }

                    const { data: topics } = await topicsQuery;

                    if (topics && topics.length > 0) {
                        const topicIds = topics.map((t: any) => t.id);

                        // Try full column set, fall back on schema mismatches
                        let lmsContents: any[] | null = null;
                        const { data: lmsFull, error: lmsFullErr } = await supabase
                            .from('lms_content')
                            .select('topic_id, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, ppt_content')
                            .in('topic_id', topicIds);

                        if (lmsFullErr && (lmsFullErr.message?.includes('column') || lmsFullErr.message?.includes('does not exist'))) {
                            console.warn('[Creator Load] marks_* columns missing, fetching core columns only');
                            const { data: lmsCore } = await supabase
                                .from('lms_content')
                                .select('topic_id, introduction, detailed_notes, summary, flashcards, ppt_content')
                                .in('topic_id', topicIds);
                            lmsContents = lmsCore;
                        } else {
                            lmsContents = lmsFull;
                        }

                        for (const topic of topics) {
                            const content = lmsContents?.find((lc: any) => lc.topic_id === topic.id);
                            if (!content) continue;
                            const notes = mapRow(content);
                            if (Object.keys(notes).length > 0) {
                                lmsMap[topic.name] = notes;
                            }
                        }
                    }
                }
            }
        } catch (path1Err: any) {
            console.warn('[Creator Load] PATH 1 (topics join) failed (non-fatal):', path1Err?.message);
        }

        // ── PATH 2: direct query via denormalized text columns ────────────────
        // Catches content saved by the batch/save route which always writes
        // course, subject, section, topic as plain text columns in lms_content.
        // Uses case-insensitive matching to handle minor capitalisation differences.
        try {
            let directQuery = supabase
                .from('lms_content')
                .select('topic_id, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, ppt_content')
                .ilike('course', courseName)
                .ilike('subject', subjectName);

            if (sectionName) {
                directQuery = directQuery.ilike('section', sectionName);
            }

            const { data: directRows, error: directErr } = await directQuery;

            if (!directErr && directRows && directRows.length > 0) {
                for (const row of directRows) {
                    const topicName: string = row.topic || '';
                    if (!topicName) continue;
                    // PATH 1 takes precedence; only fill gaps
                    if (lmsMap[topicName]) continue;

                    const notes = mapRow(row);
                    if (Object.keys(notes).length > 0) {
                        // Attach __topicId so the client can register the topic stub
                        lmsMap[topicName] = { ...notes, __topicId: row.topic_id || '' };
                    }
                }
            }
        } catch (path2Err: any) {
            console.warn('[Creator Load] PATH 2 (direct lms_content) failed (non-fatal):', path2Err?.message);
        }

        return NextResponse.json({ success: true, notes: lmsMap });
    } catch (error: any) {
        console.error('[Creator Load API] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}

