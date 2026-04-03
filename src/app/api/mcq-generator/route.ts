import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, topics, numMcqs } = body;

        const promptText = `Generate EXACTLY ${numMcqs} multiple-choice questions (MCQs) for the subject: "${subject}" based on the following topics/systems: "${topics}". 
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
