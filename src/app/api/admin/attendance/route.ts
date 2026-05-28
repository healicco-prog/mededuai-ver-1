import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;

        // Fetch records joined with timetable_formats to filter by user_id
        const { data, error } = await supabase
            .from('admin_attendance_records')
            .select('*, timetable_formats!inner(user_id)')
            .eq('timetable_formats.user_id', userId);

        if (error) throw error;

        // Clean up join key
        const cleaned = (data || []).map(({ timetable_formats, ...rest }) => rest);

        return NextResponse.json({ success: true, data: cleaned });
    } catch (error) {
        console.error('Fetch Attendance Records Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch attendance records' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { id, courseId, date, timeFrom, timeTo, topic, faculty, studentAttendance } = body;

        if (!courseId || !date || !timeFrom || !timeTo || !topic || !studentAttendance) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const payload = {
            course_id: courseId,
            date: date,
            time_from: timeFrom,
            time_to: timeTo,
            topic: topic,
            faculty: faculty || '',
            student_attendance: studentAttendance
        };

        let query;
        if (isUuid) {
            query = supabase
                .from('admin_attendance_records')
                .upsert([
                    {
                        id: id,
                        ...payload
                    }
                ]);
        } else {
            query = supabase
                .from('admin_attendance_records')
                .insert([
                    payload
                ]);
        }

        const { data, error } = await query.select().single();
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Attendance Record Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save attendance record' }, { status: 500 });
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
            .from('admin_attendance_records')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Attendance Record Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete attendance record' }, { status: 500 });
    }
}
