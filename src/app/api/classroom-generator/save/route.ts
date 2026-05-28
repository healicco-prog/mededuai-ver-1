import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const userId = sec.user?.id;

        const body = await req.json();
        const { id, name, course, classroomData } = body;

        let query;
        const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const payload = {
            user_id: userId,
            institute_name: name,
            institute_logo_url: classroomData?.instituteLogoUrl || null,
            course: course,
            department: classroomData?.department || classroomData?.year || '',
            weekly_slots: classroomData?.weeklySlots || [],
            faculty_members: classroomData?.facultyMembers || [],
            topics_pool: classroomData?.topicsPool || [],
            students_list: classroomData?.studentsList || []
        };

        if (isUuid) {
            query = supabase
                .from('timetable_formats')
                .upsert([
                    {
                        id: id,
                        ...payload
                    }
                ]);
        } else {
            query = supabase
                .from('timetable_formats')
                .insert([
                    payload
                ]);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Classroom/Format Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save classroom/format' }, { status: 500 });
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
        const userId = sec.user?.id;

        const { error } = await supabase
            .from('timetable_formats')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Classroom/Format Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete classroom/format' }, { status: 500 });
    }
}
