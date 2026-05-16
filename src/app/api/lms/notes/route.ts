import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/lms/notes?topicId=<uuid>
 * Public endpoint — no auth required.
 *
 * Returns all lms_content fields for a topic.
 * Uses a progressive fallback strategy to handle schema variations.
 * NOTE: ppt_content column does not exist in this DB — excluded from all attempts.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
        return NextResponse.json({ success: false, error: 'topicId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Ordered from most complete to least. ppt_content is intentionally excluded
    // (column does not exist in the live schema).
    // Each attempt has its own try/catch so a thrown Supabase error never propagates.
    const COLUMN_SETS = [
        // Full schema with section column
        'version, course, subject, section, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, last_generated_at',
        // Without section (if section column absent)
        'version, course, subject, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, last_generated_at',
        // Without marks columns (older schema)
        'version, course, subject, topic, introduction, detailed_notes, summary, flashcards, last_generated_at',
        // Absolute minimal
        'introduction, detailed_notes, summary, flashcards',
    ];

    for (const cols of COLUMN_SETS) {
        try {
            const { data, error } = await supabase
                .from('lms_content')
                .select(cols)
                .eq('topic_id', topicId)
                .maybeSingle();

            if (error) {
                // Check if it's a missing-column error (pg code 42703)
                const msg = error.message ?? '';
                const code = (error as any).code ?? '';
                const isColumnMissing =
                    code === '42703' ||
                    msg.includes('column') ||
                    msg.includes('does not exist');

                if (isColumnMissing) {
                    console.warn(`[LMS Notes] Fallback: column error for cols "${cols.slice(0, 40)}..." — trying next set`);
                    continue; // try next column set
                }

                // Non-column error — return gracefully
                console.error('[LMS Notes] DB error:', msg);
                return NextResponse.json({ success: false, error: msg }, { status: 500 });
            }

            // Success (data may be null if topic not found)
            return NextResponse.json({ success: true, notes: data ?? null });

        } catch (thrown: any) {
            const msg: string = thrown?.message ?? String(thrown);
            const code: string = thrown?.code ?? '';
            const isColumnMissing =
                code === '42703' ||
                msg.includes('column') ||
                msg.includes('does not exist');

            if (isColumnMissing) {
                console.warn(`[LMS Notes] Caught column error: ${msg} — trying next set`);
                continue;
            }

            console.error('[LMS Notes] Unexpected error:', msg);
            return NextResponse.json({ success: false, error: msg }, { status: 500 });
        }
    }

    // All attempts exhausted — no matching row or no columns accessible
    console.warn(`[LMS Notes] All column sets exhausted for topicId=${topicId}`);
    return NextResponse.json({ success: true, notes: null });
}

