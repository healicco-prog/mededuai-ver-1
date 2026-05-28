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
        const { subject, examData } = body;

        const { data, error } = await supabase
            .from('saved_mcqs_generator')
            .insert([
                {
                    user_id: userId,
                    subject: subject,
                    exam_data: examData,
                }
            ])
            .select()
            .single();

        if (error) {
            // fallback if the table name is saved_mcq_generator
            if (error.code === '42P01') {
                 const { data: fallbackData, error: fallbackError } = await supabase
                    .from('saved_mcq_generator')
                    .insert([
                        {
                            user_id: userId,
                            subject: subject,
                            exam_data: examData,
                        }
                    ])
                    .select()
                    .single();
                 if (fallbackError) throw fallbackError;
                 return NextResponse.json({ success: true, data: fallbackData });
            }
            throw error;
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Save MCQ Generator Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save generated MCQs' }, { status: 500 });
    }
}
