import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSONWithUsage } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { subject, topics, essayType, numQs } = body;

        const promptText = `Generate ${numQs} high-yield ${essayType} for medical examination. 
Subject Matter: ${subject}
Topics Covered: ${topics}

Return ONLY a raw JSON array of strings containing the questions exactly. No markdown blocks, no \`\`\`. 

If generating Modified Essay Questions (MEQs) or Case-Based Questions, include the short clinical scenario directly attached to the prompt.
If generating Short Answer Questions (SAQs), keep them specific and concise. 
Just return a plain array like:
["Question 1...", "Question 2...", "Question 3..."]`;

        const { data: parsed, geminiTokens } = await generateJSONWithUsage(promptText);
        const tokensToDeduct = geminiTokens * 2;

        if (sec.user?.id && tokensToDeduct > 0) {
            const supabaseAdmin = getSupabaseAdmin();
            const { data: sub } = await supabaseAdmin.from('subscriptions').select('ai_tokens_balance').eq('user_id', sec.user.id).single();
            if (sub && typeof sub.ai_tokens_balance === 'number') {
                const newBalance = Math.max(0, sub.ai_tokens_balance - tokensToDeduct);
                await supabaseAdmin.from('subscriptions').update({ ai_tokens_balance: newBalance }).eq('user_id', sec.user.id);
            }
        }

        return NextResponse.json({ success: true, questions: parsed, geminiTokens });
    } catch (error: any) {
        console.warn('Essay Generator API Error:', error.message);
        return NextResponse.json({
            success: false,
            questions: [
                "Mock Essay Q 1: Describe the pathophysiology of...",
                "Mock Essay Q 2: Enumerate the clinical features and lines of management for..."
            ],
            isMock: true
        });
    }
}

