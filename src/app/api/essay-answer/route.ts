import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateWithUsage } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { course, subject, topic, answerType, depth, question, questions, instructions } = body;

        const typeGuides: Record<string, string> = {
            long_answer: `Write a detailed essay answer specifically designed for 10 marks. Structure should include:
- **Introduction** (1-2 paragraphs)
- **Main Body** with multiple well-organized sections and subheadings
- **Diagrams description** (describe relevant diagrams/flowcharts in text)
- **Clinical significance** where applicable
- **Conclusion** summarizing key points
The answer MUST be comprehensive enough to score exactly 10 marks in a university medical exam.`,
            short_answer: `Write a concise short essay answer specifically designed for 5 marks. Structure should include:
- Brief introduction (1-2 sentences)
- Key points with brief explanations
- Use bullet points for clarity
- Include important facts and figures
The answer MUST be structured to score exactly 5 marks in a university medical exam.`,
            viva_answer: `Write a reasoning/short answer specifically designed for 3 marks. Structure should include:
- **Direct Justification** (clear, 1-2 sentence core reasoning)
- **Key Mechanism/Points** logically sequenced
- Use a concise, academic tone
The answer MUST be focused enough to score exactly 3 marks in a university medical exam.`
        };

        // Support both single question and multiple questions
        const questionsList: string[] = questions || (question ? [question] : []);
        
        if (questionsList.length === 0) {
            return NextResponse.json({ success: false, error: 'No questions provided' });
        }

        const depthInstruction = depth === 'Basic' ? 'Keep explanations simple and foundational.'
            : depth === 'Standard' ? 'Cover standard textbook-level depth.'
            : depth === 'Detailed' ? 'Include advanced details, recent advances, and comprehensive coverage.'
            : depth === 'Expert' ? 'Include expert-level analysis, research references, latest guidelines, and critical evaluation.'
            : '';

        const questionsFormatted = questionsList.map((q: string, i: number) => `**Question ${i + 1}:** ${q}`).join('\n\n');

        const promptText = `You are an expert medical educator preparing model answers for ${course} students.

Subject: ${subject}
Topic Context: ${topic}

${questionsFormatted}

For EACH question above, provide a complete model answer.

${typeGuides[answerType] || typeGuides.long_answer}

Answer Depth Level: ${depth}
${depthInstruction}

${instructions ? `Additional instructions: ${instructions}` : ''}

FORMAT INSTRUCTIONS:
- Clearly separate each answer with a horizontal rule (---) 
- Start each answer with the question number and question text as a heading
- Use proper markdown formatting with headers, bold, italics, bullet points, and tables
- Make every answer medically accurate, well-structured, and examination-worthy`;

        const { text, usageMetadata } = await generateWithUsage(promptText);
        const geminiTokens = usageMetadata?.totalTokenCount || 0;
        const tokensToDeduct = geminiTokens * 2;

        if (sec.user?.id && tokensToDeduct > 0) {
            const supabaseAdmin = getSupabaseAdmin();
            const { data: sub } = await supabaseAdmin.from('subscriptions').select('ai_tokens_balance').eq('user_id', sec.user.id).single();
            if (sub && typeof sub.ai_tokens_balance === 'number') {
                const newBalance = Math.max(0, sub.ai_tokens_balance - tokensToDeduct);
                await supabaseAdmin.from('subscriptions').update({ ai_tokens_balance: newBalance }).eq('user_id', sec.user.id);
            }
        }

        return NextResponse.json({ success: true, answer: text || 'No answer generated.', geminiTokens });
    } catch (error: any) {
        console.warn('Essay Answer Gen API Error:', error.message);
        return NextResponse.json({
            success: false,
            answer: `# Model Answers

## Question 1
(AI generation temporarily unavailable)

### Introduction
This is a fallback response. The AI service is temporarily unavailable.

### Main Discussion
- **Point 1**: Please try again shortly
- **Point 2**: The AI models will reconnect automatically

### Conclusion
Please retry your request.

---
*Note: This is a fallback response. The AI service will recover automatically.*`,
            isMock: true
        });
    }
}

