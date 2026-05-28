import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const supabase = getSupabaseAdmin();

        let query = supabase.from('saved_essays').select('*').eq('user_id', sec.user?.id).order('created_at', { ascending: false });
        
        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, savedRecords: data });
    } catch (error: any) {
        console.error('Essays Fetch All API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to fetch from database' }, { status: 500 });
    }
}
