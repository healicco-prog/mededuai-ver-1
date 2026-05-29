import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSONWithUsage } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    let language = 'Hindi';
    try {
        const body = await req.json();
        language = body.language || 'Hindi';
        const { course, subject, topic, numTerms = 10, level = 'Basic' } = body;
        
        const count = Math.min(Math.max(Number(numTerms) || 10, 1), 50);

        const promptText = `Generate ${count} key medical vocabulary terms for the topic: ${topic} within ${subject} (${course}) at a ${level} difficulty level.
        Categorize the terms appropriately (e.g., Anatomy, Pathology, Pharmacology, General).
        Return ONLY a raw valid JSON array. Do not return markdown blocks or backticks. Format exactly like this:
        [
          {
            "term": "Etiology",
            "category": "General Pathology",
            "meaning": "The cause or set of causes for a disease.",
            "example": "The etiology of the patient's symptoms is currently unknown.",
            "regional": "Word in ${language} (${language})"
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

        return NextResponse.json({ success: true, terms: parsed, geminiTokens });
    } catch (error: any) {
        console.warn('Vocab API Error:', error.message);
        return NextResponse.json({
            success: false,
            terms: [
                { term: 'Mock Etiology', category: 'General', meaning: 'The cause of a disease.', example: 'The mock etiology is unknown.', regional: `Mock (${language})` },
                { term: 'Mock Pathogenesis', category: 'Pathology', meaning: 'Development of a disease.', example: 'Mock pathogenesis works.', regional: `Mock 2 (${language})` }
            ],
            isMock: true
        });
    }
}

