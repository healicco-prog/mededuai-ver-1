import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, topic, competency, instruction, wordCount } = body;

        const promptText = `You are an expert medical educator helping a student write a high-quality clinical reflection.
Write a comprehensive reflection on the following:
- Subject: ${subject}
- Topic: ${topic}
${competency ? `- Competency with No: ${competency}` : ''}
${instruction ? `- Special Instructions: ${instruction}` : ''}

The total length of the reflection must be approximately ${wordCount} words. 

You must structure the reflection strictly into the following 6 sections as requested. Return ONLY a valid, raw JSON object. Do not return markdown blocks or backticks. Format exactly like this:
{
  "description": "...",
  "feelings": "...",
  "evaluation": "...",
  "analysis": "...",
  "learningPoints": "...",
  "actionPlan": "..."
}

Guidelines for the sections:
1. Description of the Experience (Concise): Briefly describe what happened, clinical situation, who was involved, where/when.
2. Feelings and Initial Reactions: Explain thoughts and feelings at the time (confidence, uncertainty, emotions).
3. Evaluation of the Experience: Discuss what went well and what did not go well. Teamwork, knowledge gaps.
4. Analysis (Critical Thinking): The most important part. Explain why things happened, link to medical knowledge/guidelines, ethics, strengths/weaknesses.
5. Learning Points: Clearly state what was learned (clinical knowledge, communication, professionalism).
6. Action Plan (Future Improvement): Steps to improve knowledge, skills, behavior, or clinical approach next time.
`;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, reflection: parsed });
    } catch (error: any) {
        console.warn('Reflection API Error:', error.message);
        return NextResponse.json({
            success: true,
            reflection: {
                description: 'Mock Description: During my clinical posting...',
                feelings: 'Mock Feelings: Initially, I felt uncertain...',
                evaluation: 'Mock Evaluation: The interaction improved when...',
                analysis: 'Mock Analysis: I realized that inadequate preparation...',
                learningPoints: 'Mock Learning Points: This experience highlighted...',
                actionPlan: 'Mock Action Plan: I plan to review current guidelines...'
            },
            isMock: true
        });
    }
}
