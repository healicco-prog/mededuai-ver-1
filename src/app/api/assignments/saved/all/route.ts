import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('saved_assignments')
            .select('*')
            .eq('user_id', sec.user?.id)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ success: true, savedRecords: [] });
            }
            throw error;
        }

        return NextResponse.json({ success: true, savedRecords: data || [] });
    } catch (error: any) {
        console.error('Assignments Fetch API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to fetch saved assignments' }, { status: 500 });
    }
}
