import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic } = body;

        const promptText = `Generate 10 key medical vocabulary terms for the topic: ${topic} within ${subject} (${course}).
        Return ONLY a raw valid JSON array. Do not return markdown blocks or backticks. Format exactly like this:
        [
          {
            "term": "Etiology",
            "meaning": "The cause or set of causes for a disease.",
            "example": "The etiology is unknown.",
            "regional": "कारण (Hindi)"
          }
        ]
        `;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, terms: parsed });
    } catch (error: any) {
        console.warn('Vocab API Error:', error.message);
        return NextResponse.json({
            success: true,
            terms: [
                { term: 'Mock Etiology', meaning: 'The cause of a disease.', example: 'The mock etiology is unknown.', regional: 'कारण (Hindi)' },
                { term: 'Mock Pathogenesis', meaning: 'Development of a disease.', example: 'Mock pathogenesis works.', regional: 'रोगजनन (Hindi)' }
            ],
            isMock: true
        });
    }
}
