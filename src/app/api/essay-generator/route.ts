import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
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

        const parsed = await generateJSON(promptText);
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
