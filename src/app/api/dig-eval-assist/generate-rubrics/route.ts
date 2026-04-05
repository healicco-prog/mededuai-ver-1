import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, question, marksAllotted, userId } = body;

        if (!question || !marksAllotted || !course || !subject) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const minCriteria = Math.max(3, Math.ceil(marksAllotted / 2));

        const prompt = `You are a senior ${course} university examiner specializing in ${subject}.
Your task is to create a HIGHLY DETAILED marking rubric for evaluating handwritten answer scripts.

CONTEXT:
- Course Standard: ${course} (university examination level)
- Subject: ${subject}
- Question: "${question}"
- Total Marks Allocated: ${marksAllotted}

INSTRUCTIONS:
Create a comprehensive, granular marking scheme that breaks down the total ${marksAllotted} marks into individual components.
Each component should have clear descriptors for full marks, partial marks, and zero marks.
Include must-mention keywords, expected diagrams (if relevant), and common student errors.

Return ONLY raw valid JSON (no markdown, no backticks, no extra text):
{
  "criteria": [
    {
      "component": "Component Name",
      "maxMarks": 2,
      "descriptors": {
        "full": "Detailed description of what earns FULL marks for this component",
        "partial": "What earns PARTIAL marks (50-75% of component marks)",
        "minimal": "What earns MINIMAL marks (25-50% of component marks)",
        "zero": "What earns ZERO marks"
      },
      "keywords": ["essential term 1", "essential term 2"],
      "diagramRequired": false,
      "diagramDescription": ""
    }
  ],
  "totalMarks": ${marksAllotted},
  "idealAnswerStructure": ["Section 1: ...", "Section 2: ..."],
  "mustMentionFacts": ["critical fact 1", "critical fact 2"],
  "commonErrors": ["typical student mistake 1", "typical student mistake 2"],
  "gradingNotes": "Any special instructions for the evaluator"
}

STRICT RULES:
- The SUM of ALL maxMarks MUST equal EXACTLY ${marksAllotted}
- Create at MINIMUM ${minCriteria} criteria components
- Each criterion should have 1-${Math.min(5, Math.ceil(marksAllotted / 3))} maxMarks
- Be precise and specific to ${course} ${subject} curriculum and examination standards
- Include diagrams as a separate scored criterion if the topic warrants it
- Keywords must be medical/clinical terms that a student MUST use
- Common errors should reflect real examination patterns`;

        const rubricsContent = await generateWithFallback(prompt, {
            jsonMode: true,
            preferredModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'],
        });

        let parsedRubrics;
        try {
            parsedRubrics = JSON.parse(rubricsContent);
        } catch {
            parsedRubrics = { raw: rubricsContent, totalMarks: marksAllotted };
        }

        // Save to Supabase automatically
        let rubricId = null;
        if (userId) {
            const { data, error } = await supabase
                .from('dig_eval_rubrics')
                .insert({
                    user_id: userId,
                    course,
                    subject,
                    question,
                    marks_allotted: marksAllotted,
                    rubrics_content: JSON.stringify(parsedRubrics),
                })
                .select('id')
                .single();

            if (error) {
                console.warn('Dig Eval Rubrics DB save failed:', error.message);
            } else {
                rubricId = data?.id;
            }
        }

        return NextResponse.json({
            success: true,
            rubrics: JSON.stringify(parsedRubrics),
            rubricId,
        });
    } catch (error: any) {
        console.error('Dig Eval Generate Rubrics Error:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Failed to generate rubrics. Please try again.',
        }, { status: 500 });
    }
}
