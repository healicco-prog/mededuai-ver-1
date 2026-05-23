import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateWithUsage } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    let action = '';
    try {
        const body = await req.json();
        const { course, subject, topic, instruction, history = [] } = body;
        action = body.action || '';

        let promptText = "";

        if (action === 'analyze') {
            promptText = `You are a medical examiner evaluating a medical student's viva voce performance.\nContext:\n- Course: ${course}\n- Subject: ${subject}\n- Topic: ${topic}\n- Instruction Type: ${instruction}\n\nHere is the transcript of the simulation:\n${history.map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Examiner'}: ${msg.content}`).join('\n')}\n\nAnalyze the student's performance. Focus on knowledge, structuring of answers, and medical terminology. Give a detailed analysis and actionable steps to improve. Provide well-formatted markdown output.`;
        } else {
            promptText = `You are a medical examiner conducting a viva voce for a medical student.\nContext:\n- Course: ${course}\n- Subject: ${subject}\n- Topic: ${topic}\n- Evaluation Focus: ${instruction}\n\nYour task is to act as the examiner. Ask questions one by one based on the given context and topic.\nAsk only ONE question at a time. Do not answer for the student. If the student answers, acknowledge and ask the next question or probe deeper depending on the evaluation focus. Occasionally you may ask if they want you to test deeper knowledge or move on. Keep your responses concise (1-3 sentences) like a real oral examiner.\n\nHere is the current conversation transcript:\n${history.map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Examiner'}: ${msg.content}`).join('\n')}\n\nBased on this transcript, generate your next utterance as the Examiner.`;
        }

        const { text, usageMetadata } = await generateWithUsage(promptText);
        const geminiTokens = usageMetadata?.totalTokenCount || 0;
        const tokensToDeduct = geminiTokens * 2;

        if (sec.user?.id && tokensToDeduct > 0) {
            const supabaseAdmin = getSupabaseAdmin();
            const { data: sub } = await supabaseAdmin.from('subscriptions').select('ai_tokens_balance').eq('user_id', sec.user.id).single();
            if (sub && typeof sub.ai_tokens_balance === 'number') {
                const newBalance = Math.max(0, sub.ai_tokens_balance - tokensToDeduct);
                await supabaseAdmin.from('subscriptions').update({ ai_tokens_balance: newBalance }).eq('user_id', sec.user.id);
            }
        }

        return NextResponse.json({ success: true, response: text || (action === 'analyze' ? 'Good performance. Keep studying.' : 'Can you elaborate on that?'), geminiTokens });
    } catch (error: any) {
        console.warn('Viva API Error:', error.message);
        const isAnalyze = action === 'analyze'; // Safe fallback
        return NextResponse.json({
            success: false,
            response: isAnalyze
                ? '**Analysis (Mock):** \nYou did well structurally but need more focus on exact terminology. Review the standard Pathology Robbins sections.'
                : 'That is interesting. What else do you know about this topic?',
            isMock: true
        });
    }
}

