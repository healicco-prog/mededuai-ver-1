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
            .from('saved_emr_evals')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Fetch EMR Saved All Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch EMR evaluations' }, { status: 500 });
    }
}
