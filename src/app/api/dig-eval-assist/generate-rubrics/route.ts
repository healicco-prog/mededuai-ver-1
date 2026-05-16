import { checkSecurity, validateInput } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSON, MODELS } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dummyurl.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'dummykey'
    );
}

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { course, subject, question, marksAllotted, userId, questionImages } = body;

        if ((!question && (!questionImages || questionImages.length === 0)) || !marksAllotted || !course || !subject) {
            return NextResponse.json({ success: false, error: 'Missing required fields (Question text or images)' }, { status: 400 });
        }

        const minCriteria = Math.max(3, Math.ceil(marksAllotted / 2));

        const prompt = `You are a senior ${course} university examiner specializing in ${subject}.
Your task is to create a HIGHLY DETAILED marking rubric for evaluating student answer scripts.

CONTEXT:
- Course Standard: ${course}
- Subject: ${subject}
- Question Context: ${question || 'The question is provided in the attached image(s).'}
- Total Marks Allocated: ${marksAllotted}

INSTRUCTIONS:
1. If the question text is provided above, use it. If not, analyze the attached images to identify the question being asked.
2. Create a comprehensive, granular marking scheme that breaks down the total ${marksAllotted} marks into individual components.
3. Each component should have clear descriptors for full marks, partial marks, and zero marks.
4. Include must-mention keywords, expected diagrams (if relevant), and common student errors.

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

        const parsedRubrics = await generateJSON(prompt, {
            images: questionImages,
            preferredModels: [MODELS.primary, MODELS.secondary, MODELS.tertiary, MODELS.ultimate],
            disableThinking: true,
        });

        // Save to Supabase automatically
        let rubricId = null;
        if (userId) {
            const supabase = getSupabase();
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
        const msg = error?.message || 'Unknown error';
        console.error('Dig Eval Generate Rubrics Error:', msg);
        // Surface key-level errors clearly
        const isKeyError = msg.includes('leaked') || msg.includes('API key') || msg.includes('403');
        const isQuota = msg.includes('quota') || msg.includes('429');
        return NextResponse.json({
            success: false,
            error: isKeyError
                ? 'AI service error: The API key is invalid or has been revoked. Please contact admin.'
                : isQuota
                ? 'AI is busy (rate limited). Please wait 30 seconds and try again.'
                : `Failed to generate rubrics: ${msg}`,
        }, { status: 500 });
    }
}

