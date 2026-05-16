import { checkSecurity, validateInput } from '@/lib/apiSecurity';
import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { generateJSON } from '@/lib/gemini';

export const maxDuration = 60; // allow up to 60s for AI parsing

export async function POST(req: NextRequest) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin', 'deptadmin', 'instadmin', 'teacher'] });
    if (!sec.authorized) return sec.response;

    try {
        const contentType = req.headers.get('content-type') || '';
        let buffer: Buffer;
        let fileName = 'document.pdf';
        let mimeType = 'application/pdf';

        if (contentType.includes('application/json')) {
            const body = await req.json();
            if (!body.base64) {
                return NextResponse.json({ error: 'No document payload provided.' }, { status: 400 });
            }
            fileName = body.fileName || 'document.pdf';
            mimeType = body.mimeType || 'application/pdf';
            const base64Data = body.base64.includes(',') ? body.base64.split(',')[1] : body.base64;
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
            }
            fileName = file.name || 'document.pdf';
            mimeType = file.type || 'application/pdf';
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
        const isWord = mimeType.includes('word') || fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
        const isImage = mimeType.startsWith('image/') || fileName.toLowerCase().match(/\.(jpg|jpeg|png|heic|webp)$/);

        // Allow PDF, Word, Image (Camera capture), or Generic Application types from Android/Google Drive pickers
        if (!isPdf && !isWord && !isImage && !mimeType.includes('application/')) {
            return NextResponse.json({ error: 'Only PDF, Word, or Image files are supported.' }, { status: 400 });
        }

        // Attempt raw text extraction using mammoth if explicitly Word document
        let rawText = '';
        if (isWord) {
            try {
                const result = await mammoth.extractRawText({ buffer });
                rawText = result.value?.trim() || '';
            } catch (_) {
                // Fall back gracefully to multimodal understanding
            }
        }

        // Use Gemini to intelligently parse questions + marks
        const basePrompt = `You are an expert medical exam paper parser.
Below is a university question paper provided either as extracted raw text or as an attached multimodal document/image.
Parse it accurately and extract ALL questions with their allocated marks.

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
}`;

        const prompt = rawText 
            ? `${basePrompt}\n\nRaw question paper text:\n"""\n${rawText.substring(0, 8000)}\n"""`
            : `${basePrompt}\n\nPlease analyze the attached document/image directly to extract all questions and allocated marks accurately.`;

        const mimePrefix = isImage ? mimeType : (isPdf ? 'application/pdf' : 'application/pdf');
        const imagesOpt = rawText ? undefined : [`data:${mimePrefix};base64,${buffer.toString('base64')}`];


        const parsed = await generateJSON<{
            questions: { text: string; marks: number }[];
            totalMarks: number;
            paperTitle: string;
            course: string;
            department: string;
            institution: string;
        }>(prompt, { images: imagesOpt });

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
            rawText: rawText ? rawText.substring(0, 2000) : 'Extracted natively from PDF/Drive Document',
        });

    } catch (error: any) {
        console.error('[upload-qpaper] Error:', error.message);
        return NextResponse.json({ error: `Processing failed: ${error.message}` }, { status: 500 });
    }
}

