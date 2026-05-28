import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { id, course, subject, topic, style, depth, content } = body;

        if (!course || !subject || !topic || !content) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        let query;
        if (id && id.length > 10) {
            query = supabase
                .from('saved_notes')
                .upsert([
                    {
                        id,
                        user_id: sec.user?.id,
                        course,
                        subject,
                        topic,
                        style,
                        depth,
                        content
                    }
                ]);
        } else {
            query = supabase
                .from('saved_notes')
                .insert([
                    {
                        user_id: sec.user?.id,
                        course,
                        subject,
                        topic,
                        style,
                        depth,
                        content
                    }
                ]);
        }

        const { data, error } = await query.select().single();

        if (error) {
            console.error('Database save error:', error);
            if (error.code === '42P01') {
                return NextResponse.json({ success: false, error: 'Table "saved_notes" does not exist. Please run migrations.' }, { status: 500 });
            }
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true, savedRecord: data });
    } catch (error: any) {
        console.error('Notes Save API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to save to database' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('saved_notes')
            .delete()
            .eq('id', id)
            .eq('user_id', sec.user?.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Notes Delete API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to delete record' }, { status: 500 });
    }
}
