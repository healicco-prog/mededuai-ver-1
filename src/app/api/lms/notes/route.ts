import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/lms/notes?topicId=<uuid>
 *   OR  /api/lms/notes?topicId=<uuid>&topicName=<name>&subject=<s>&course=<c>
 *   OR  /api/lms/notes?topicName=<name>&subject=<s>&course=<c>
 *
 * Public endpoint — no auth required.
 *
 * Lookup strategy (in order):
 *   1. By topic_id (uuid)                     – fast path when topic_id is set
 *   2. By topic name + subject + course (ilike) – fallback for rows where topic_id IS NULL
 *      (content generated before topic_id was wired up, or store-based topics)
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const topicId   = searchParams.get('topicId');
    const topicName = searchParams.get('topicName');
    const subject   = searchParams.get('subject');
    const course    = searchParams.get('course');

    if (!topicId && !topicName) {
        return NextResponse.json(
            { success: false, error: 'topicId or topicName is required' },
            { status: 400 }
        );
    }

    const supabase = getSupabaseAdmin();

    // Ordered from richest schema to most minimal.
    // ppt_content intentionally excluded — column does not exist in live DB.
    const COLUMN_SETS = [
        'version, course, subject, section, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, last_generated_at',
        'version, course, subject, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, last_generated_at',
        'version, course, subject, topic, introduction, detailed_notes, summary, flashcards, last_generated_at',
        'introduction, detailed_notes, summary, flashcards',
    ];

    function isMissingCol(err: any): boolean {
        const msg: string = err?.message ?? String(err ?? '');
        const code: string = err?.code ?? '';
        return code === '42703' || msg.includes('column') || msg.includes('does not exist');
    }

    /** Try each column set against a query factory until one succeeds. */
    async function tryFetch(
        buildQuery: (cols: string) => ReturnType<ReturnType<typeof supabase.from>['select']>
    ): Promise<any | null> {
        for (const cols of COLUMN_SETS) {
            try {
                const { data, error } = await buildQuery(cols) as any;
                if (error) {
                    if (isMissingCol(error)) {
                        console.warn(`[LMS Notes] Column error (${cols.slice(0, 40)}) — trying next`);
                        continue;
                    }
                    console.error('[LMS Notes] DB error:', error.message);
                    return null;
                }
                // data may be null (no row) or an object (found) — return as-is
                return data;
            } catch (thrown: any) {
                if (isMissingCol(thrown)) {
                    console.warn(`[LMS Notes] Caught col error — trying next`);
                    continue;
                }
                console.error('[LMS Notes] Unexpected error:', thrown?.message);
                return null;
            }
        }
        return null;
    }

    // ── Strategy 1: lookup by topic_id ──────────────────────────────────────
    if (topicId) {
        const result = await tryFetch((cols) =>
            supabase.from('lms_content').select(cols).eq('topic_id', topicId).maybeSingle() as any
        );
        if (result) {
            return NextResponse.json({ success: true, notes: result });
        }
        // null → no row found by topic_id; fall through to name lookup
    }

    // ── Strategy 2: lookup by topic name + subject + course ─────────────────
    // Handles rows where topic_id IS NULL (generated before topic linking).
    if (topicName && topicName.trim()) {
        const result = await tryFetch((cols) =>
            supabase.from('lms_content')
                .select(cols)
                .ilike('topic', topicName.trim())
                .ilike('subject', subject?.trim() || '%')
                .ilike('course',  course?.trim()  || '%')
                .order('last_generated_at', { ascending: false })
                .limit(1)
                .maybeSingle() as any
        );
        if (result) {
            return NextResponse.json({ success: true, notes: result });
        }
    }

    // Nothing found
    return NextResponse.json({ success: true, notes: null });
}
