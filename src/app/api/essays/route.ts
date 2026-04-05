import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic, paperType, difficulty, questionCount, instructions } = body;

        const promptText = `Act as an expert medical examination setter. Generate an essay question paper.
Course: ${course}
Subject: ${subject}
Topic: ${topic}
Paper Type: ${paperType}
Difficulty: ${difficulty}
Number of Questions: ${questionCount}
Additional Instructions: ${instructions || "None"}

Format your response exactly as valid JSON with two fields:
{
  "questions": "Markdown string containing the formatted question paper",
  "answerKey": "Markdown string containing the detailed answer key"
}`;

        const textRes = await generateWithFallback(promptText, { jsonMode: true });
        const parsed = JSON.parse(textRes);

        return NextResponse.json({ 
            success: true, 
            questions: parsed.questions,
            answerKey: parsed.answerKey
        });
    } catch (error: any) {
        console.warn('Essays API Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
