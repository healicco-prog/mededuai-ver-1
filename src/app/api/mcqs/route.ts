import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic, difficulty, count } = body;

        const promptText = `Generate EXACTLY ${count} multiple-choice questions (MCQs) for the course "${course}", subject: "${subject}" based on the topic: "${topic}". 
        Difficulty Level: ${difficulty}.
        The questions should be generated based on the significance of these topics with regards to Final Summative Examinations related to that paper.
        You MUST generate precisely ${count} questions. Do not generate more or fewer.
        Return ONLY a raw valid JSON array. Do not return markdown blocks or backticks. Format exactly like this:
        [
          {
            "question": "What is the primary function of...?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Because..."
          }
        ]
        Make sure the correctAnswer is an integer index (0-3) representing the correct option in the options array.
        `;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, mcqs: parsed });
    } catch (error: any) {
        console.warn('MCQ API Error:', error.message);
        return NextResponse.json({
            success: true,
            mcqs: [
                {
                    question: 'Mock Question 1: What is the cause of mock disease?',
                    options: ['Virus', 'Bacteria', 'Fungus', 'Parasite'],
                    correctAnswer: 0,
                    explanation: 'Virus is the correct answer because it causes the mock disease.'
                },
                {
                    question: 'Mock Question 2: Which organ is primarily affected?',
                    options: ['Heart', 'Liver', 'Lungs', 'Kidneys'],
                    correctAnswer: 1,
                    explanation: 'The liver is primarily affected in this mock scenario.'
                }
            ],
            isMock: true
        });
    }
}
