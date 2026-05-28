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
            .from('saved_emr_evals')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Fetch EMR Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch EMR evaluations' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const sec = await checkSecurity(req);
        if (!sec.authorized) return sec.response;

        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { id, examName, course, department, instituteName, date, questions, answerKey, students, maxMarks } = body;

        if (!id || !examName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const payload = {
            id,
            user_id: sec.user?.id,
            exam_name: examName,
            student_name: students?.[0]?.name || 'N/A',
            emr_data: {
                id,
                examName,
                course,
                department,
                instituteName,
                date,
                questions,
                answerKey,
                students,
                maxMarks
            }
        };

        const { data, error } = await supabase
            .from('saved_emr_evals')
            .upsert([payload])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save EMR Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save EMR evaluation' }, { status: 500 });
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
            .from('saved_emr_evals')
            .delete()
            .eq('id', id)
            .eq('user_id', sec.user?.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete EMR Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete EMR evaluation' }, { status: 500 });
    }
}
