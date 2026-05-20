import { checkSecurity, validateInput } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { course, subject, topic, numTerms = 10 } = body;
        
        const count = Math.min(Math.max(Number(numTerms) || 10, 1), 50);

        const promptText = `Generate ${count} key medical vocabulary terms for the topic: ${topic} within ${subject} (${course}).
        Categorize the terms appropriately (e.g., Anatomy, Pathology, Pharmacology, General).
        Return ONLY a raw valid JSON array. Do not return markdown blocks or backticks. Format exactly like this:
        [
          {
            "term": "Etiology",
            "category": "General Pathology",
            "meaning": "The cause or set of causes for a disease.",
            "example": "The etiology of the patient's symptoms is currently unknown.",
            "regional": "कारण (Hindi)"
          }
        ]
        `;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, terms: parsed });
    } catch (error: any) {
        console.warn('Vocab API Error:', error.message);
        return NextResponse.json({
            success: false,
            terms: [
                { term: 'Mock Etiology', category: 'General', meaning: 'The cause of a disease.', example: 'The mock etiology is unknown.', regional: 'कारण (Hindi)' },
                { term: 'Mock Pathogenesis', category: 'Pathology', meaning: 'Development of a disease.', example: 'Mock pathogenesis works.', regional: 'रोगजनन (Hindi)' }
            ],
            isMock: true
        });
    }
}

