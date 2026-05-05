import { NextRequest, NextResponse } from 'next/server';
import { getAI, MODELS } from '@/lib/gemini';

export const runtime = 'nodejs'; // Use nodejs for larger image processing
export const maxDuration = 60; // 60 seconds

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File;
        const answerKeyJson = formData.get('answerKey') as string;
        const questionsJson = formData.get('questions') as string;

        if (!imageFile) {
            return NextResponse.json({ success: false, error: 'No image uploaded' }, { status: 400 });
        }

        const answerKey = JSON.parse(answerKeyJson || '{}');
        const questionsList = JSON.parse(questionsJson || '[]');

        // Convert file to base64
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const base64Image = buffer.toString('base64');

        const ai = getAI();
        const model = ai.getGenerativeModel({ model: MODELS.primary });

        const prompt = `
Analyze the attached OMR (Optical Mark Recognition) answer sheet. 
Extract the marked answers for each question label.

IMPORTANT LABELS TO LOOK FOR:
${questionsList.map((q: any) => q.label).join(', ')}

DIRECTIONS:
1. Identify the filled bubble (A, B, C, or D) for each question label listed above.
2. If a bubble is partially filled, use your best judgment.
3. If no bubble is filled, return null for that question.
4. If multiple bubbles are filled, return "MULTIPLE".
5. Return the results EXCLUSIVELY as a JSON object where the keys are the question labels and the values are the detected marks ("A", "B", "C", "D", "MULTIPLE", or null).

Return format:
{
  "26(I)": "A",
  "26(II)": "C",
  ...
}
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: imageFile.type
                }
            }
        ]);

        const response = result.response;
        let text = response.text().trim();
        
        // Clean up markdown code blocks if present
        if (text.startsWith('```')) {
            text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        }

        try {
            const extractedAnswers = JSON.parse(text);
            return NextResponse.json({ success: true, extractedAnswers });
        } catch (e) {
            console.error('Failed to parse AI response:', text);
            return NextResponse.json({ success: false, error: 'AI failed to produce valid JSON', raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error('OMR Scan Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
