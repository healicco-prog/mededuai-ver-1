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
            .from('timetable_holidays')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Fetch Holidays Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch holidays' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;
        const body = await req.json();
        const { date, details } = body;

        if (!date || !details) {
            return NextResponse.json({ success: false, error: 'Missing date or details' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('timetable_holidays')
            .upsert([
                {
                    user_id: userId,
                    date: date,
                    details: details
                }
            ], { onConflict: 'user_id,date' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Holiday Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save holiday' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ success: false, error: 'Missing date parameter' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;

        const { error } = await supabase
            .from('timetable_holidays')
            .delete()
            .eq('user_id', userId)
            .eq('date', date);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Holiday Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete holiday' }, { status: 500 });
    }
}
