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
            .from('timetable_formats')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map database fields to front-end JSON format expected by Classroom Generator & Timetable MS
        const mappedData = (data || []).map(item => ({
            id: item.id,
            name: item.institute_name,
            course: item.course,
            classroom_data: {
                id: item.id,
                instituteName: item.institute_name,
                instituteLogoUrl: item.institute_logo_url,
                course: item.course,
                department: item.department,
                weeklySlots: item.weekly_slots || [],
                facultyMembers: item.faculty_members || [],
                topicsPool: item.topics_pool || [],
                studentsList: item.students_list || [],
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }
        }));

        return NextResponse.json({ success: true, data: mappedData });
    } catch (error) {
        console.error('Fetch Saved Classrooms Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch saved classrooms' }, { status: 500 });
    }
}
