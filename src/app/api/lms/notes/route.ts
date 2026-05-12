import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/lms/notes?topicId=<uuid>
 * Public endpoint — no auth required.
 * Returns all lms_content fields for a topic. lms_content has public RLS read access.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const topicId = searchParams.get('topicId');

        if (!topicId) {
            return NextResponse.json({ success: false, error: 'topicId is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const COLS = 'version, course, subject, section, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, last_generated_at';

        const { data: content, error } = await supabase
            .from('lms_content')
            .select(COLS)
            .eq('topic_id', topicId)
            .maybeSingle();

        if (error) {
            // Graceful fallback: if extended columns are missing, fetch core columns
            if (error.message?.includes('column') || error.message?.includes('does not exist')) {
                const { data: core, error: coreErr } = await supabase
                    .from('lms_content')
                    .select('introduction, detailed_notes, summary, flashcards, last_generated_at')
                    .eq('topic_id', topicId)
                    .maybeSingle();
                if (coreErr) throw coreErr;
                return NextResponse.json({ success: true, notes: core });
            }
            throw error;
        }

        return NextResponse.json({ success: true, notes: content });
    } catch (error: any) {
        console.error('[LMS Notes] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}
