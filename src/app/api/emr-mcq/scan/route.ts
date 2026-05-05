import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateVisionJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { image, questions } = body; // image is base64 string, questions is array of labels

        if (!image) {
            return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
        }

        // Clean base64 string (remove data:image/png;base64, if present)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `You are a high-precision OMR (Optical Mark Recognition) scanner for medical examinations.
        Your task is to identify the bubbled answers (A, B, C, or D) for the given question labels on the provided OMR sheet image.
        
        The question labels you should look for are: ${questions.join(', ')}.
        
        Note:
        1. Some questions might have sub-parts like "18(i)", "18(ii)".
        2. If a bubble is not clearly marked, return null for that question.
        3. If you see multiple bubbles for one question, return "INVALID".
        4. Match the labels EXACTLY as provided in the list above.
        
        Return ONLY a JSON object mapping each provided question label to its identified answer ("A", "B", "C", "D", "INVALID", or null).
        Example: {"18(i)": "A", "18(ii)": "C", "19": "B"}
        `;

        const result = await generateVisionJSON([
            { text: prompt },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png"
                }
            }
        ]);

        return NextResponse.json({ success: true, results: result });
    } catch (error: any) {
        console.error('EMR Scan Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
