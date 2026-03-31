import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, topics, essayType, numQs } = body;

        let promptText = `Generate ${numQs} high-yield ${essayType} for medical examination. 
Subject Matter: ${subject}
Topics Covered: ${topics}

Return ONLY a raw JSON array of strings containing the questions exactly. No markdown blocks, no \`\`\`. 

If generating Modified Essay Questions (MEQs) or Case-Based Questions, include the short clinical scenario directly attached to the prompt.
If generating Short Answer Questions (SAQs), keep them specific and concise. 
Just return a plain array like:
["Question 1...", "Question 2...", "Question 3..."]`;

        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-1.5-pro',
                contents: promptText,
                config: { responseMimeType: 'application/json' }
            });
        } catch (e: any) {
            console.warn("gemini-1.5-pro failed, falling back to gemini-2.5-flash", e.message);
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: { responseMimeType: 'application/json' }
            });
        }

        const text = response.text || '[]';
        const parsed = JSON.parse(text);

        return NextResponse.json({ success: true, questions: parsed });
    } catch (error: any) {
        console.warn('Essay Generator API Error:', error.message);
        return NextResponse.json({
            success: true,
            questions: [
                "Mock Essay Q 1: Describe the pathophysiology of...",
                "Mock Essay Q 2: Enumerate the clinical features and lines of management for..."
            ],
            isMock: true
        });
    }
}
