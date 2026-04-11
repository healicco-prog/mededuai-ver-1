import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

interface SavePayload {
    courseName: string;
    subjectName: string;
    sectionName: string;
    topicName: string;
    generatedNotes: Record<string, string>;
}

/**
 * Resolve or create a record by name. Returns the UUID of the found/created row.
 */
async function resolveOrCreate(
    supabase: ReturnType<typeof getSupabaseAdmin>,
    table: string,
    matchFields: Record<string, string>,
    insertFields: Record<string, string>
): Promise<string> {
    // Try to find existing
    let query = supabase.from(table).select('id').limit(1);
    for (const [key, value] of Object.entries(matchFields)) {
        query = (query as any).eq(key, value);
    }
    const { data: existing } = await query.maybeSingle();
    if (existing?.id) return existing.id;

    // Create new
    const { data: created, error } = await supabase
        .from(table)
        .insert(insertFields)
        .select('id')
        .single();

    if (error || !created?.id) {
        throw new Error(`Failed to insert into ${table}: ${error?.message}`);
    }
    return created.id;
}

/**
 * Parse plain-text assessment questions (e.g. numbered list) into
 * individual question strings. Returns an array of trimmed strings.
 */
function parseQuestions(rawText: string): string[] {
    if (!rawText || rawText.trim() === '' || rawText === 'None requested.') return [];
    // Split on numbered list pattern "1. " / "2. " etc.
    return rawText
        .split(/\n(?=\d+\.\s)/)
        .map(q => q.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 10);
}

export async function POST(req: Request) {
    try {
        const body: SavePayload = await req.json();
        const { courseName, subjectName, sectionName, topicName, generatedNotes } = body;

        if (!courseName || !subjectName || !topicName || !generatedNotes) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // ── Step 1: Resolve Course ──
        const courseId = await resolveOrCreate(
            supabase,
            'courses',
            { name: courseName },
            { name: courseName }
        );

        // ── Step 2: Resolve Subject ──
        const subjectId = await resolveOrCreate(
            supabase,
            'subjects',
            { name: subjectName, course_id: courseId },
            { name: subjectName, course_id: courseId }
        );

        // ── Step 3: Resolve Topic ──
        // Topics are now resolved by name + subject_id. We also store the section name.
        // First try to find by name+subject_id
        const { data: existingTopic } = await supabase
            .from('topics')
            .select('id')
            .eq('name', topicName)
            .eq('subject_id', subjectId)
            .maybeSingle();

        let topicId: string;
        if (existingTopic?.id) {
            topicId = existingTopic.id;
            // Update section if it exists
            if (sectionName) {
                await supabase.from('topics').update({ section: sectionName }).eq('id', topicId);
            }
        } else {
            const { data: newTopic, error: topicErr } = await supabase
                .from('topics')
                .insert({ name: topicName, subject_id: subjectId, section: sectionName || 'General' })
                .select('id')
                .single();
            if (topicErr || !newTopic?.id) {
                throw new Error(`Failed to create topic: ${topicErr?.message}`);
            }
            topicId = newTopic.id;
        }

        // ── Step 4: Upsert LMS Content ──
        const lmsPayload: Record<string, any> = {
            topic_id: topicId,
            last_generated_at: new Date().toISOString(),
        };

        // Map generic LMS structure IDs to lms_content columns
        if (generatedNotes['l1']) lmsPayload['introduction'] = generatedNotes['l1'];
        if (generatedNotes['l2']) lmsPayload['detailed_notes'] = generatedNotes['l2'];
        if (generatedNotes['l3']) lmsPayload['summary'] = generatedNotes['l3'];
        // ── New question columns (l4–l8) ──
        if (generatedNotes['l4'] && generatedNotes['l4'] !== 'None requested.') lmsPayload['marks_10_questions'] = generatedNotes['l4'];
        if (generatedNotes['l5'] && generatedNotes['l5'] !== 'None requested.') lmsPayload['marks_5_questions'] = generatedNotes['l5'];
        if (generatedNotes['l6'] && generatedNotes['l6'] !== 'None requested.') lmsPayload['marks_3_reasoning'] = generatedNotes['l6'];
        if (generatedNotes['l7'] && generatedNotes['l7'] !== 'None requested.') lmsPayload['marks_2_case_mcqs'] = generatedNotes['l7'];
        if (generatedNotes['l8'] && generatedNotes['l8'] !== 'None requested.') lmsPayload['marks_1_mcqs'] = generatedNotes['l8'];
        if (generatedNotes['l9'] && generatedNotes['l9'] !== 'None requested.') {
            lmsPayload['flashcards'] = { raw: generatedNotes['l9'] };
        }
        if (generatedNotes['l10'] && generatedNotes['l10'] !== 'None requested.') {
            lmsPayload['ppt_content'] = { raw: generatedNotes['l10'] };
        }

        // Check if lms_content exists for this topic
        const { data: existingLms } = await supabase
            .from('lms_content')
            .select('id')
            .eq('topic_id', topicId)
            .maybeSingle();

        if (existingLms?.id) {
            await supabase.from('lms_content').update(lmsPayload).eq('id', existingLms.id);
        } else {
            await supabase.from('lms_content').insert(lmsPayload);
        }

        // ── Step 5: Insert Assessment Questions ──
        // Format: {key: generated text, marks: integer, type: string}
        const assessmentSources = [
            { key: 'l4', marks: 10, type: 'essay' },
            { key: 'l5', marks: 5, type: 'essay' },
            { key: 'l6', marks: 3, type: 'reasoning' },
            { key: 'l7', marks: 2, type: 'case-based' },
            { key: 'l8', marks: 1, type: 'mcq' },
        ];

        const assessmentsToInsert: any[] = [];
        for (const src of assessmentSources) {
            const raw = generatedNotes[src.key];
            if (!raw) continue;
            const questions = parseQuestions(raw);
            for (const q of questions) {
                if (!q) continue;
                // For MCQs, try to extract answer
                let questionText = q;
                let correct_answer: string | null = null;

                if (src.type === 'mcq') {
                    const answerMatch = q.match(/Answer:\s*(.+)/i);
                    if (answerMatch) {
                        correct_answer = answerMatch[1].trim();
                        questionText = q.replace(/Answer:\s*.+/i, '').trim();
                    }
                }

                assessmentsToInsert.push({
                    topic_id: topicId,
                    marks: src.marks,
                    question_text: questionText,
                    question_type: src.type,
                    ...(correct_answer ? { correct_answer } : {}),
                });
            }
        }

        if (assessmentsToInsert.length > 0) {
            // Delete old questions for this topic before inserting new ones to avoid duplicates
            await supabase.from('assessments').delete().eq('topic_id', topicId);
            await supabase.from('assessments').insert(assessmentsToInsert);
        }

        return NextResponse.json({
            success: true,
            topicId,
            courseId,
            subjectId,
            savedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[Creator Save API] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
    }
}
