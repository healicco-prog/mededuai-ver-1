import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic } = body;

        let promptText = `Generate 10 key medical vocabulary terms for the topic: ${topic} within ${subject} (${course}).
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

        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: promptText,
                config: { responseMimeType: 'application/json' }
            });
        } catch (e: any) {
            console.warn("gemini-1.5-flash failed, falling back to gemini-2.5-flash", e.message);
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: { responseMimeType: 'application/json' }
            });
        }

        const text = response.text || '[]';
        const parsed = JSON.parse(text);

        return NextResponse.json({ success: true, terms: parsed });
    } catch (error: any) {
        console.warn('Vocab API Key Error/Exhaustion detected. Falling back to local mock data.', error.message);
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
