import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { generateJSON } from '@/lib/gemini';

export const maxDuration = 60; // allow up to 60s for AI parsing

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
        ];
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            return NextResponse.json({ error: 'Only Word (.docx / .doc) files are supported.' }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract raw text using mammoth
        const result = await mammoth.extractRawText({ buffer });
        const rawText = result.value?.trim();

        if (!rawText || rawText.length < 20) {
            return NextResponse.json({ error: 'Could not extract readable text from the uploaded file. Please ensure it is a valid Word document.' }, { status: 422 });
        }

        // Use Gemini to intelligently parse questions + marks
        const prompt = `You are an expert medical exam paper parser.
Below is the raw text extracted from a Word document question paper.
Parse it and extract ALL questions with their allocated marks.

Rules:
- Each question may have sub-questions (a, b, c) — treat sub-questions as part of the parent question.
- Total marks for a question = sum of its sub-question marks if present.
- If no marks are explicitly stated, set marks to 0.
- Keep the full question text exactly as written, including sub-questions.
- Separate questions using "---" as the delimiter in the output text.
- Return ONLY a raw valid JSON object, no markdown, no backticks.

Return this exact structure:
{
  "questions": [
    { "text": "Full question 1 text here...", "marks": 10 },
    { "text": "Full question 2 text here...", "marks": 5 }
  ],
  "totalMarks": 100,
  "paperTitle": "Detected paper title if any, else empty string",
  "course": "Detected course name if any, else empty string",
  "department": "Detected department if any, else empty string",
  "institution": "Detected institution name if any, else empty string"
}

Raw question paper text:
"""
${rawText.substring(0, 8000)}
"""`;

        const parsed = await generateJSON<{
            questions: { text: string; marks: number }[];
            totalMarks: number;
            paperTitle: string;
            course: string;
            department: string;
            institution: string;
        }>(prompt);

        if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            return NextResponse.json({ error: 'Could not identify any questions in the document. Please ensure the file contains a properly formatted question paper.' }, { status: 422 });
        }

        return NextResponse.json({
            success: true,
            questions: parsed.questions,
            totalMarks: parsed.totalMarks || 0,
            paperTitle: parsed.paperTitle || '',
            course: parsed.course || '',
            department: parsed.department || '',
            institution: parsed.institution || '',
            rawText: rawText.substring(0, 2000), // preview only
        });

    } catch (error: any) {
        console.error('[upload-qpaper] Error:', error.message);
        return NextResponse.json({ error: `Processing failed: ${error.message}` }, { status: 500 });
    }
}
