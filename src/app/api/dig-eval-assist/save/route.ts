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
        const { id, question, marks, evaluationData } = body;

        let query;
        if (id && id.length > 10) {
            query = supabase
                .from('saved_digital_evals')
                .upsert([
                    {
                        id: id,
                        user_id: userId,
                        question: question,
                        marks: marks,
                        evaluation_data: evaluationData
                    }
                ]);
        } else {
            query = supabase
                .from('saved_digital_evals')
                .insert([
                    {
                        user_id: userId,
                        question: question,
                        marks: marks,
                        evaluation_data: evaluationData
                    }
                ]);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save Digital Eval Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save digital evaluation' }, { status: 500 });
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
            .from('saved_digital_evals')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Digital Eval Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete digital evaluation' }, { status: 500 });
    }
}
