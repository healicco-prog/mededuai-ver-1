import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { subject, topic, sessionType, totalMarks } = body;

        const promptText = `You are an expert medical educator.
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
}`;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, rubric: parsed.rubric });
    } catch (error: any) {
        console.warn('Rubrics API Error:', error.message);
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
