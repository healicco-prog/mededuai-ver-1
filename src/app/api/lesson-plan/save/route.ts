import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;

        const body = await req.json();
        const { id, topicTitle, course, subject, planData } = body;

        let query;
        if (id && id.length > 10) {
            query = supabase
                .from('saved_lesson_plans')
                .upsert([
                    {
                        id: id,
                        user_id: userId,
                        topic_title: topicTitle,
                        course: course,
                        subject: subject,
                        plan_data: planData,
                    }
                ]);
        } else {
            query = supabase
                .from('saved_lesson_plans')
                .insert([
                    {
                        user_id: userId,
                        topic_title: topicTitle,
                        course: course,
                        subject: subject,
                        plan_data: planData,
                    }
                ]);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Lesson Plan Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save lesson plan' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
        }

        const { error } = await supabase
            .from('saved_lesson_plans')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Lesson Plan Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete lesson plan' }, { status: 500 });
    }
}
