import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { course, subject, topic, competency, type, criteria } = body;

        const promptText = `You are an expert medical educator creating an assignment for ${course} students.

Subject: ${subject}
Topic: ${topic}
Competency (if any): ${competency || 'Not specified'}
Assignment Type: ${type}
Specific Criteria: ${criteria || 'None specified'}

Generate a comprehensive, ready-to-use assignment based on the above parameters.
If it is a Case Scenario, provide the clinical presentation, history, examination findings, and questions for the students.
If it is a Role Play, provide instructions for different roles and the scenario setup.
If it is an OSPE/OPSC station, provide the station instructions, materials required, student instructions, and the examiner's checklist.
Include a marking scheme or expected answers if applicable.

Format the output clearly using Markdown headings, bullet points, and bold text for readability. Do NOT include JSON, just provide the markdown content directly.`;

        const text = await generateWithFallback(promptText);

        return NextResponse.json({ success: true, content: text });
    } catch (error: any) {
        console.error('Assignment Generator API Error:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to generate assignment.' }, { status: 500 });
    }
}
