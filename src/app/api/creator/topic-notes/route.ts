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

        // Try full column set first; fall back gracefully for older schemas
        let content: any = null;
        const { data: fullContent, error: fullErr } = await supabase
            .from('lms_content')
            .select('version, course, subject, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_questions, marks_2_questions, marks_1_questions, flashcards, ppt_content, last_generated_at')
            .eq('topic_id', topicId)
            .maybeSingle();

        if (fullErr && (fullErr.message?.includes('column') || fullErr.message?.includes('does not exist'))) {
            // Try without version/course/subject/topic meta columns
            console.warn('[Topic Notes API] Some columns missing, trying reduced column set');
            const { data: midContent, error: midErr } = await supabase
                .from('lms_content')
                .select('introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_questions, marks_2_questions, marks_1_questions, flashcards, ppt_content, last_generated_at')
                .eq('topic_id', topicId)
                .maybeSingle();
            if (midErr && (midErr.message?.includes('column') || midErr.message?.includes('does not exist'))) {
                // Old schema — fetch only original core columns
                console.warn('[Topic Notes API] marks_* columns missing, fetching core columns only');
                const { data: coreContent, error: coreErr } = await supabase
                    .from('lms_content')
                    .select('introduction, detailed_notes, summary, flashcards, ppt_content, last_generated_at')
                    .eq('topic_id', topicId)
                    .maybeSingle();
                if (coreErr) throw coreErr;
                content = coreContent;
            } else if (midErr) {
                throw midErr;
            } else {
                content = midContent;
            }
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
