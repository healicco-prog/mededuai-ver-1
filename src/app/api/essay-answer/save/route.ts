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
        const { title, course, subject, evalData } = body;

        const { data, error } = await supabase
            .from('saved_ems_evals')
            .insert([
                {
                    user_id: userId,
                    title: title,
                    course: course,
                    subject: subject,
                    eval_data: evalData,
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save EMS Eval Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save EMS eval' }, { status: 500 });
    }
}
