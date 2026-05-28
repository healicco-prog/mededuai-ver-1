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
        const { id, title, course, subject, rubricData } = body;

        let query;
        if (id && id.length > 10) {
            query = supabase
                .from('saved_rubrics')
                .upsert([
                    {
                        id: id,
                        user_id: userId,
                        title: title,
                        course: course,
                        subject: subject,
                        rubric_data: rubricData,
                    }
                ]);
        } else {
            query = supabase
                .from('saved_rubrics')
                .insert([
                    {
                        user_id: userId,
                        title: title,
                        course: course,
                        subject: subject,
                        rubric_data: rubricData,
                    }
                ]);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Rubric Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save rubric' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;

        const { error } = await supabase
            .from('saved_rubrics')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Rubric Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete rubric' }, { status: 500 });
    }
}
