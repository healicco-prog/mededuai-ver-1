import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSONWithUsage } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { uni, course, subject } = body;

        const promptText = `You are an expert medical educator who is very familiar with ${uni} university exam patterns for ${course} students in the subject: ${subject}.

Generate a model question paper SET based on the commonly asked and high-probability questions in this university.

Return ONLY a raw valid JSON object. Do not return markdown blocks or backticks. Format exactly like this:
{
  "mockPaperTitle": "${uni} - ${subject} Model Examination Paper",
  "q10": [
    "1. Describe the anatomy of... with clinical correlates. (10 marks)",
    "2. Write in detail about... (10 marks)"
  ],
  "q5": [
    "1. Write short notes on... (5 marks)",
    "2. Differentiate between... (5 marks)",
    "3. Enumerate the types of... (5 marks)",
    "4. Describe the mechanism of... (5 marks)",
    "5. Write a note on... with clinical significance. (5 marks)"
  ],
  "q2": [
    "1. Define... (2 marks)",
    "2. Name four types of... (2 marks)",
    "3. List the functions of... (2 marks)",
    "4. Give two differences between... (2 marks)",
    "5. What is the significance of... (2 marks)"
  ]
}

Generate exactly:
- 2 long essay questions (10 marks each)
- 5 short essay questions (5 marks each)  
- 5 short answer questions (2 marks each)

Make the questions realistic, commonly asked, and aligned with ${uni} exam patterns.`;

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

        return NextResponse.json({ success: true, paper: parsed, geminiTokens });
    } catch (error: any) {
        console.warn('Important Questions API Error:', error.message);
        return NextResponse.json({
            success: false,
            paper: {
                mockPaperTitle: 'Model Examination Paper',
                q10: [
                    '1. Describe the anatomy of the Brachial Plexus with clinical correlates. (10 marks)',
                    '2. Detail the structure and functions of the Kidney with a neat labelled diagram. (10 marks)'
                ],
                q5: [
                    '1. Internal capsule — blood supply and clinical significance. (5 marks)',
                    '2. Types of Cartilage — classification and examples. (5 marks)',
                    '3. Differences between small and large intestine. (5 marks)',
                    '4. Enumerate the branches of the facial nerve. (5 marks)',
                    '5. Write a short note on the Circle of Willis. (5 marks)'
                ],
                q2: [
                    '1. Define anatomical snuff box and its boundaries. (2 marks)',
                    '2. Name four muscles of mastication. (2 marks)',
                    '3. List the contents of the carotid sheath. (2 marks)',
                    '4. Differentiate between exocrine and endocrine glands. (2 marks)',
                    '5. What is the clinical significance of McBurney\'s point? (2 marks)'
                ]
            },
            isMock: true
        });
    }
}

