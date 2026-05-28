import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { topic } = body;

        if (!topic) {
            return NextResponse.json({ success: false, error: 'Missing topic' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Get the most recent saved vocabulary for this topic
        const { data, error } = await supabase
            .from('saved_vocabulary')
            .select('*')
            .eq('topic', topic)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found, this is fine
                return NextResponse.json({ success: true, savedRecord: null });
            }
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, savedRecord: data });
    } catch (error: any) {
        console.error('Vocab Fetch API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to fetch from database' }, { status: 500 });
    }
}
