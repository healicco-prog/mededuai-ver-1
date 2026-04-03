import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic, count } = body;

        const promptText = `You are an expert medical educator for ${course} students.

Subject: ${subject}
Topic: ${topic}

Generate exactly ${count} previously commonly asked essay questions on this topic that are frequently asked in university examinations.

Requirements:
- Questions should be based on real university exam patterns
- Include a mix of "describe", "explain", "discuss", "enumerate and explain", "write short notes on" type questions
- Each question should be clear, specific, and examination-worthy
- Questions should cover different aspects and subtopics within the given topic
- Include both long essay (10 marks) and short essay (5 marks) type questions

IMPORTANT: Return ONLY a valid JSON array of objects, with no extra text, markdown, or explanation.
Each object must have exactly these fields:
- "id": a number starting from 1
- "question": the essay question text
- "type": either "long" (10 marks) or "short" (5 marks)
- "frequency": either "Very Common", "Common", or "Occasionally Asked"

Example format:
[{"id":1,"question":"Describe the anatomy of brachial plexus with its clinical significance.","type":"long","frequency":"Very Common"}]`;

        const text = await generateWithFallback(promptText);

        // Clean up the response - remove markdown code blocks if present
        let cleanText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        
        let questions;
        try {
            questions = JSON.parse(cleanText);
        } catch {
            const match = cleanText.match(/\[[\s\S]*\]/);
            if (match) {
                questions = JSON.parse(match[0]);
            } else {
                questions = [];
            }
        }

        return NextResponse.json({ success: true, questions });
    } catch (error: any) {
        console.warn('Essay Questions API Error:', error.message);
        return NextResponse.json({
            success: true,
            questions: Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                question: `Sample question ${i + 1} on the topic. This is a placeholder - connect your API key for real questions.`,
                type: i < 3 ? 'long' : 'short',
                frequency: i === 0 ? 'Very Common' : i < 3 ? 'Common' : 'Occasionally Asked'
            })),
            isMock: true
        });
    }
}
