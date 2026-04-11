import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/creator/topic-notes?topicId=<uuid>
 * Returns the lms_content row for a specific topic.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const topicId = searchParams.get('topicId');

        if (!topicId) {
            return NextResponse.json({ success: false, error: 'topicId is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data: content, error } = await supabase
            .from('lms_content')
            .select('introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards, last_generated_at')
            .eq('topic_id', topicId)
            .maybeSingle();

        if (error) throw error;

        if (!content) {
            return NextResponse.json({ success: true, notes: null });
        }

        return NextResponse.json({ success: true, notes: content });
    } catch (error: any) {
        console.error('[Topic Notes API] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}
