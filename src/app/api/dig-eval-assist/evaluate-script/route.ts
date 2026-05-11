import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateWithFallback, MODELS } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
}

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const {
            rubricId, rubrics, question, marksAllotted,
            course, subject, answerImages,
            rollNumber, studentName, userId,
        } = body;

        if (!rubrics || !answerImages || answerImages.length === 0) {
            return NextResponse.json({ success: false, error: 'Missing rubrics or answer images' }, { status: 400 });
        }

        const textPrompt = `You are a strict but fair senior ${course} university examiner evaluating a student's HANDWRITTEN answer script for ${subject}.

EVALUATION CONTEXT:
- Course Standard: ${course}
- Subject: ${subject}
- Question: "${question || 'See rubric context'}"
- Maximum Marks: ${marksAllotted}
- Student Roll No: ${rollNumber || 'N/A'}
- Student Name: ${studentName || 'N/A'}

APPROVED MARKING RUBRIC (use this strictly for evaluation):
"""
${rubrics}
"""

INSTRUCTIONS:
1. Carefully read each uploaded image of the handwritten answer script
2. Extract the text/content written by the student as best as you can
3. Compare the student's answer against the marking rubric point by point
4. Award marks based STRICTLY on the rubric criteria — no bias, no leniency
5. If handwriting is unclear, make your best effort to interpret but note it

Provide your evaluation in this EXACT markdown format:

## 📊 Marks Awarded: [X] / ${marksAllotted}

## 📝 Extracted Answer Summary
(Summarize what the student has written based on the handwritten images)

## ✅ Strengths
- (List specific things the student did well, referencing rubric criteria met)

## ⚠️ Areas for Improvement
- (List specific areas where marks were lost, with actionable suggestions)

## 📋 Detailed Mark Breakdown
| Component | Max Marks | Awarded | Remarks |
|-----------|-----------|---------|---------|
| (component from rubric) | (max) | (given) | (brief justification) |

## 💡 Recommendations
(Specific study tips and areas to focus on for better performance)

Be thorough, fair, and constructive. Award marks based strictly on the rubric.`;

        // Use centralized multimodal generation with fallback/retry logic
        const evaluationResult = await generateWithFallback(textPrompt, {
            images: answerImages,
            preferredModels: [MODELS.primary, MODELS.secondary, MODELS.tertiary, MODELS.ultimate],
            disableThinking: true,
        });

        // Extract marks from the response
        const marksMatch = evaluationResult.match(/Marks Awarded:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
        const marksObtained = marksMatch ? parseFloat(marksMatch[1]) : 0;
        const totalMarks = marksMatch ? parseInt(marksMatch[2]) : marksAllotted;
        const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100 * 100) / 100 : 0;

        // Save to Supabase
        let evaluationId = null;
        if (userId) {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('dig_eval_scripts')
                .insert({
                    rubric_id: rubricId || null,
                    user_id: userId,
                    roll_number: rollNumber || '',
                    student_name: studentName || '',
                    marks_obtained: marksObtained,
                    total_marks: totalMarks,
                    percentage,
                    evaluation_result: evaluationResult,
                    course,
                    subject,
                    question,
                })
                .select('id')
                .single();

            if (error) {
                console.warn('Dig Eval Script DB save failed:', error.message);
            } else {
                evaluationId = data?.id;
            }
        }

        return NextResponse.json({
            success: true,
            evaluation: evaluationResult,
            marksObtained,
            totalMarks,
            percentage,
            evaluationId,
        });
    } catch (error: any) {
        console.error('Dig Eval Evaluate Script Error:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Failed to evaluate answer script. Please try again.',
        }, { status: 500 });
    }
}
