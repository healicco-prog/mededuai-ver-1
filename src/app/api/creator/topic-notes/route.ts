import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkSecurity } from '@/lib/apiSecurity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/creator/topic-notes?topicId=<uuid>
 * Returns the lms_content row for a specific topic.
 */
export async function GET(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin', 'deptadmin', 'instadmin', 'teacher'] });
    if (!sec.authorized) return sec.response;

    try {
        const { searchParams } = new URL(req.url);
        const topicId = searchParams.get('topicId');

        if (!topicId) {
            return NextResponse.json({ success: false, error: 'topicId is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Full column set matching current lms_content schema
        // Falls back gracefully if schema has not been migrated yet
        let content: any = null;
        const FULL_COLS = 'version, course, subject, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, last_generated_at';
        const CORE_COLS = 'introduction, detailed_notes, summary, flashcards, last_generated_at';

        const { data: fullContent, error: fullErr } = await supabase
            .from('lms_content')
            .select(FULL_COLS)
            .eq('topic_id', topicId)
            .maybeSingle();

        if (fullErr && (fullErr.message?.includes('column') || fullErr.message?.includes('does not exist'))) {
            // Schema not yet migrated — fetch only core columns
            console.warn('[Topic Notes API] Extended columns missing, fetching core columns only');
            const { data: coreContent, error: coreErr } = await supabase
                .from('lms_content')
                .select(CORE_COLS)
                .eq('topic_id', topicId)
                .maybeSingle();
            if (coreErr) throw coreErr;
            content = coreContent;
        } else if (fullErr) {
            throw fullErr;
        } else {
            content = fullContent;
        }

        if (!content) {
            return NextResponse.json({ success: true, notes: null });
        }

        return NextResponse.json({ success: true, notes: content });
    } catch (error: any) {
        console.error('[Topic Notes API] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}

