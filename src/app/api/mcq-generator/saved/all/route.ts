import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;

        const { data, error } = await supabase
            .from('saved_mcqs_generator')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
             if (error.code === '42P01') {
                 const { data: fallbackData, error: fallbackError } = await supabase
                    .from('saved_mcq_generator')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                 if (fallbackError) throw fallbackError;
                 return NextResponse.json({ success: true, data: fallbackData });
             }
             throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Fetch Saved MCQ Generator Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch saved generated MCQs' }, { status: 500 });
    }
}
