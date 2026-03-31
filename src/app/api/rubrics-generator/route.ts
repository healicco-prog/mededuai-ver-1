import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, topic, sessionType, totalMarks } = body;

        let promptText = `You are an expert medical educator.
Create a detailed evaluation rubric for the following assessment.

Subject: ${subject}
Topic: ${topic}
Assessment Type: ${sessionType}
Total Marks: ${totalMarks}

Generate a rubric table with:
1. Assessment Criteria
2. Performance Levels (Excellent, Good, Average, Poor)
3. Marks allocation for each criteria
4. Clear descriptors for each level.

Ensure:
- The total marks combined across all criteria equal exactly ${totalMarks}.
- Criteria are relevant to the assessment type.
- The rubric is suitable for university-level medical education.

Return ONLY a raw valid JSON object. Do not return markdown blocks or backticks. Format exactly matching this structure:
{
  "rubric": [
    {
      "criteria": "Knowledge of topic",
      "excellent": "Comprehensive understanding...",
      "good": "Good understanding...",
      "average": "Basic understanding...",
      "poor": "Poor understanding...",
      "marks": 5
    }
  ]
}
Do NOT wrap in markdown \`\`\`json \`\`\`.`;

        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: promptText,
                config: { responseMimeType: 'application/json' }
            });
        } catch (e: any) {
            console.warn("gemini-1.5-flash failed, catching with gemini-2.5-flash", e.message);
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: { responseMimeType: 'application/json' }
            });
        }

        const text = response.text || '{}';
        const parsed = JSON.parse(text);

        return NextResponse.json({ success: true, rubric: parsed.rubric });
    } catch (error: any) {
        console.warn('Rubrics API Key Error/Exhaustion detected. Falling back to local mock data.', error.message);
        return NextResponse.json({
            success: true,
            rubric: [
                { criteria: 'Clinical Knowledge', excellent: 'Exceptional depth', good: 'Solid understanding', average: 'Basic concepts only', poor: 'Significant gaps', marks: 4 },
                { criteria: 'Communication', excellent: 'Clear, empathetic', good: 'Adequate', average: 'Needs prompting', poor: 'Poor interaction', marks: 3 },
                { criteria: 'Professionalism', excellent: 'Exemplary', good: 'Appropriate', average: 'Minor lapses', poor: 'Unprofessional', marks: 3 },
            ],
            isMock: true
        });
    }
}
