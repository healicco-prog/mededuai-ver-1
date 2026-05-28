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
            .from('saved_timetables')
            .select('*, timetable_formats!inner(user_id)')
            .eq('timetable_formats.user_id', userId)
            .order('saved_at', { ascending: false });

        if (error) throw error;

        // Clean up join key
        const cleaned = (data || []).map(({ timetable_formats, ...rest }) => rest);

        return NextResponse.json({ success: true, data: cleaned });
    } catch (error) {
        console.error('Fetch Timetable Snapshots Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch timetable snapshots' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { formatId, month, instituteName, course, department, classCount } = body;

        if (!formatId || !month || !instituteName || !course || !department) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Check if there is already a saved timetable for this format and month
        const { data: existing } = await supabase
            .from('saved_timetables')
            .select('id')
            .eq('format_id', formatId)
            .eq('month', month)
            .maybeSingle();

        let query;
        if (existing?.id) {
            query = supabase
                .from('saved_timetables')
                .update({
                    institute_name: instituteName,
                    course: course,
                    department: department,
                    class_count: classCount || 0,
                    saved_at: new Date().toISOString()
                })
                .eq('id', existing.id);
        } else {
            query = supabase
                .from('saved_timetables')
                .insert([
                    {
                        format_id: formatId,
                        month: month,
                        institute_name: instituteName,
                        course: course,
                        department: department,
                        class_count: classCount || 0
                    }
                ]);
        }

        const { data, error } = await query.select().single();
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Timetable Snapshot Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save timetable snapshot' }, { status: 500 });
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
            .from('saved_timetables')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Timetable Snapshot Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete timetable snapshot' }, { status: 500 });
    }
}
