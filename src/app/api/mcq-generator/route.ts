import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, topics, numMcqs } = body;

        let promptText = `Generate EXACTLY ${numMcqs} multiple-choice questions (MCQs) for the subject: "${subject}" based on the following topics/systems: "${topics}". 
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

        return NextResponse.json({ success: true, mcqs: parsed });
    } catch (error: any) {
        console.warn('MCQ API Error detected. Falling back to local mock data.', error.message);
        return NextResponse.json({
            success: true,
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
            ],
            isMock: true
        });
    }
}
