import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSONWithUsage } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { subject, topics, numMcqs } = body;

        const promptText = `Generate EXACTLY ${numMcqs} multiple-choice questions (MCQs) for the subject: "${subject}" based on the following topics/systems: "${topics}". 
        The questions should be generated based on the significance of these topics with regards to Final Summative Examinations related to that paper.
        You MUST generate precisely ${numMcqs} questions. Do not generate more or fewer.
        Return ONLY a raw valid JSON array. Do not return markdown blocks or backticks. Format exactly like this:
        [
          {
            "question": "What is the primary function of...?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Because..."
          }
        ]
        `;

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

        return NextResponse.json({ success: true, mcqs: parsed, geminiTokens });
    } catch (error: any) {
        console.warn('MCQ API Error:', error.message);
        return NextResponse.json({
            success: false,
            error: 'AI generation failed. Please try again or contact support.',
            isMock: true,
            mcqs: [
                {
                    question: 'Mock Question 1: What is the cause of mock disease?',
                    options: ['Virus', 'Bacteria', 'Fungus', 'Parasite'],
                    correctAnswer: 'Virus',
                    explanation: 'Virus is the correct answer because it causes the mock disease.'
                },
                {
                    question: 'Mock Question 2: Which organ is primarily affected?',
                    options: ['Heart', 'Liver', 'Lungs', 'Kidneys'],
                    correctAnswer: 'Liver',
                    explanation: 'The liver is primarily affected in this mock scenario.'
                }
            ]
        });
    }
}


