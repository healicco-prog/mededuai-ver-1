import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Using the key provided by the user for Content Creation
const ai = new GoogleGenAI({ apiKey: 'AIzaSyB0ivigB-aeE_zP0DJq1pAOF3RzHS1fS8c' });

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

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite-preview-02-05',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text || '{"topics": []}';
        const parsed = JSON.parse(text);

        return NextResponse.json({ success: true, data: parsed.topics || [] });
    } catch (error: any) {
        console.error('Topic Generation API Error:', error);

        // Fallback to gemini-2.5-flash
        try {
            const body = await req.json();
            const { course, subject, existingTopics, count, instructions } = body;
            const prompt = `You are an expert curriculum designer. Context: Course = ${course}, Subject = ${subject}. Generate ${count || 10} new topics. Existing: ${existingTopics ? existingTopics.join(', ') : 'None'}. Requirements: ${instructions || 'Standard'}. Return ONLY valid JSON: {"topics": ["Topic 1", "Topic 2"]}`;

            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const text = fallbackResponse.text || '{"topics": []}';
            const parsed = JSON.parse(text);
            return NextResponse.json({ success: true, data: parsed.topics || [] });
        } catch (fallbackError: any) {
            return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 });
        }
    }
}
