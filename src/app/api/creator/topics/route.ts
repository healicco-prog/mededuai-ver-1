import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, existingTopics, count, instructions } = body;

        const basePrompt = `You are an expert curriculum designer for medical/dental education.
Context: Course = ${course}, Subject = ${subject}.
Existing Topics: ${existingTopics ? existingTopics.join(', ') : 'None'}.
Please generate a list of ${count || 10} new, distinct textbook-level topics that belong to this subject in a standard university curriculum. Do NOT repeat existing topics.`;

        const customPrompt = instructions ? `\n\nAdditionally, please adhere exactly to these specific requirements:\n${instructions}` : '';

        const schemaPrompt = `\n\nReturn ONLY a valid JSON object matching exactly this schema:
{
  "topics": [
    "Topic Name 1",
    "Topic Name 2"
  ]
}`;

        const prompt = basePrompt + customPrompt + schemaPrompt;

        const parsed = await generateJSON(prompt);
        return NextResponse.json({ success: true, data: parsed.topics || [] });
    } catch (error: any) {
        console.error('Topic Generation API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
