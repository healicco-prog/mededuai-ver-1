import { NextResponse } from 'next/server';
import { getAI } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { rubricId, rubrics, question, marksAllotted, course, subject, answerImages, userId } = body;

        if (!rubrics || !answerImages || answerImages.length === 0) {
            return NextResponse.json({ success: false, error: 'Missing rubrics or answer images' }, { status: 400 });
        }

        // Build multimodal content with images
        const imageParts = answerImages.map((img: string) => {
            // img is expected as a base64 data URL: "data:image/jpeg;base64,..."
            const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
                return {
                    inlineData: {
                        mimeType: match[1],
                        data: match[2],
                    },
                };
            }
            return null;
        }).filter(Boolean);

        const textPrompt = `You are a strict but fair medical examiner evaluating a student's HANDWRITTEN answer script.

EVALUATION CONTEXT:
- Course: ${course}
- Subject: ${subject}
- Question: "${question}"
- Maximum Marks: ${marksAllotted}

APPROVED MARKING RUBRIC:
"""
${rubrics}
"""

INSTRUCTIONS:
1. Carefully read each uploaded image of the handwritten answer script
2. Extract the text/content written by the student
3. Compare the student's answer against the marking rubric point by point
4. Award marks based strictly on the rubric criteria

Provide your evaluation in this EXACT format:

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

Be thorough, fair, and constructive. If handwriting is unclear, mention it but try your best to interpret.`;

        // Use Gemini multimodal API
        const ai = getAI();
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
        let evaluationResult = '';
        let lastError: Error | null = null;

        for (const model of models) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: textPrompt },
                                ...imageParts,
                            ],
                        },
                    ],
                });
                evaluationResult = response.text || '';
                break;
            } catch (e: any) {
                console.warn(`Model ${model} failed for answer eval:`, e.message);
                lastError = e;
            }
        }

        if (!evaluationResult) {
            throw lastError || new Error('All models failed for answer evaluation');
        }

        // Extract marks from the response
        const marksMatch = evaluationResult.match(/Marks Awarded:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
        const marksObtained = marksMatch ? parseFloat(marksMatch[1]) : 0;
        const totalMarks = marksMatch ? parseInt(marksMatch[2]) : marksAllotted;
        const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100 * 100) / 100 : 0;

        // Extract strengths and improvements
        const strengthsMatch = evaluationResult.match(/## ✅ Strengths\n([\s\S]*?)(?=\n## )/);
        const improvementsMatch = evaluationResult.match(/## ⚠️ Areas for Improvement\n([\s\S]*?)(?=\n## )/);
        const strengths = strengthsMatch ? strengthsMatch[1].trim() : '';
        const improvements = improvementsMatch ? improvementsMatch[1].trim() : '';

        // Save to Supabase
        let evaluationId = null;
        if (userId) {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('answer_evaluations')
                .insert({
                    rubric_id: rubricId || null,
                    user_id: userId,
                    marks_obtained: marksObtained,
                    total_marks: totalMarks,
                    percentage,
                    evaluation_result: evaluationResult,
                    strengths,
                    improvements,
                })
                .select('id')
                .single();

            if (error) {
                console.warn('Evaluation DB save failed:', error.message);
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
        console.error('Evaluate Answer Error:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Failed to evaluate answer. Please try again.',
        }, { status: 500 });
    }
}
