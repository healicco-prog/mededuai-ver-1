import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();

        // Since timetable_schedules is joined to timetable_formats which belongs to user_id, 
        // we can filter schedules belonging to formats of the logged-in user.
        const userId = sec.user?.id;

        const { data, error } = await supabase
            .from('timetable_schedules')
            .select('*, timetable_formats!inner(user_id)')
            .eq('timetable_formats.user_id', userId);

        if (error) throw error;

        // Clean up inner join property
        const cleaned = (data || []).map(({ timetable_formats, ...rest }) => rest);

        return NextResponse.json({ success: true, data: cleaned });
    } catch (error) {
        console.error('Fetch Schedules Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { id, formatId, date, topicId, topicName, competencyNo, activity, batch, staffName } = body;

        if (!formatId || !date || !topicName || !staffName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const payload = {
            format_id: formatId,
            date: date,
            topic_id: topicId || null,
            topic_name: topicName,
            competency_no: competencyNo || null,
            activity: activity || 'Lecture',
            batch: batch || 'Full',
            staff_name: staffName
        };

        let query;
        if (isUuid) {
            query = supabase
                .from('timetable_schedules')
                .upsert([
                    {
                        id: id,
                        ...payload
                    }
                ]);
        } else {
            query = supabase
                .from('timetable_schedules')
                .insert([
                    payload
                ]);
        }

        const { data, error } = await query.select().single();
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Schedule Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save schedule' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing id parameter' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('timetable_schedules')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Schedule Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete schedule' }, { status: 500 });
    }
}
