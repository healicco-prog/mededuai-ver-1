import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { course, subject, topic, terms } = body;

        if (!course || !subject || !topic || !terms || !Array.isArray(terms)) {
            return NextResponse.json({ success: false, error: 'Missing required fields or invalid terms format' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('saved_vocabulary')
            .insert([
                {
                    course,
                    subject,
                    topic,
                    terms,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Database save error:', error);
            // Attempt to check if table exists
            if (error.code === '42P01') {
                return NextResponse.json({ success: false, error: 'Table "saved_vocabulary" does not exist. Please run migrations.' }, { status: 500 });
            }
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, savedRecord: data });
    } catch (error: any) {
        console.error('Vocab Save API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to save to database' }, { status: 500 });
    }
}
