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

        // Generate a JSON rubric — fast, structured, detailed per-mark breakdown
        const prompt = `You are a ${course} ${subject} examiner. Create a JSON marking rubric.
Question: "${question}" | Total: ${marksAllotted} marks

Return ONLY valid JSON (no markdown, no backticks):
{
  "criteria": [
    { "component": "name", "maxMarks": N, "descriptors": { "full": "what earns full marks", "partial": "what earns partial", "zero": "what gets 0" }, "keywords": ["must-mention terms"] }
  ],
  "totalMarks": ${marksAllotted},
  "idealStructure": ["Section 1", "Section 2"],
  "mustMentionFacts": ["fact1", "fact2"],
  "commonErrors": ["error1"]
}

Rules:
- Sum of all maxMarks MUST equal exactly ${marksAllotted}
- Break down into minimum ${Math.max(3, Math.ceil(marksAllotted / 2))} criteria
- Each criterion should have 1-3 maxMarks
- Be specific to ${course} ${subject} curriculum
- Include diagrams as a criterion if relevant`;

        const rubricsContent = await generateWithFallback(prompt, {
            jsonMode: true,
            preferredModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'],
        });

        // Validate JSON
        let parsedRubrics;
        try {
            parsedRubrics = JSON.parse(rubricsContent);
        } catch {
            // If JSON parse fails, wrap raw content
            parsedRubrics = { raw: rubricsContent, totalMarks: marksAllotted };
        }

        // Save to Supabase automatically
        let rubricId = null;
        if (userId) {
            const { data, error } = await supabase
                .from('answer_rubrics')
                .insert({
                    user_id: userId,
                    course,
                    subject,
                    question,
                    marks_allotted: marksAllotted,
                    rubrics_content: JSON.stringify(parsedRubrics)
                })
                .select('id')
                .single();

            if (error) {
                console.warn('Rubrics DB save failed:', error.message);
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
        console.error('Generate Rubrics Error:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Failed to generate rubrics. Please try again.',
        }, { status: 500 });
    }
}
