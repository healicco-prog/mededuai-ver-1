import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { subject, topic, competency, content } = body;

        if (!subject || !topic || !content) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('saved_reflections')
            .insert([
                {
                    user_id: sec.user?.id,
                    subject,
                    topic,
                    competency,
                    content
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Database save error:', error);
            if (error.code === '42P01') {
                return NextResponse.json({ success: false, error: 'Table "saved_reflections" does not exist. Please run migrations.' }, { status: 500 });
            }
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, savedRecord: data });
    } catch (error: any) {
        console.error('Reflection Save API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to save to database' }, { status: 500 });
    }
}
