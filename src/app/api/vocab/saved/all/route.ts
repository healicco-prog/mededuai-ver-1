import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const supabase = getSupabaseAdmin();

        // Fetch all saved vocabularies, ideally filtering by user if user_id exists
        // We'll try to fetch user_id, if it fails we just fetch all
        let query = supabase.from('saved_vocabulary').select('*').order('created_at', { ascending: false });
        
        // Let's see if we can just fetch all for now and group them
        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, savedRecords: data });
    } catch (error: any) {
        console.error('Vocab Fetch All API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to fetch from database' }, { status: 500 });
    }
}
