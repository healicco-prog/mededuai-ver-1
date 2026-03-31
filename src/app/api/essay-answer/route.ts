import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic, answerType, depth, question, questions, instructions } = body;

        const typeGuides: Record<string, string> = {
            long_answer: `Write a detailed long essay answer (10 marks level). Structure should include:
- **Introduction** (1-2 paragraphs)
- **Main Body** with multiple well-organized sections and subheadings
- **Diagrams description** (describe relevant diagrams/flowcharts in text)
- **Clinical significance** where applicable
- **Conclusion** summarizing key points
Aim for 800-1200 words.`,
            short_answer: `Write a concise short answer (5 marks level). Structure should include:
- Brief introduction (1-2 sentences)
- Key points with brief explanations
- Use bullet points for clarity
- Include important facts and figures
Aim for 300-500 words.`,
            viva_answer: `Write a viva-style answer suitable for oral examination. Structure should include:
- **Opening statement** (how you'd begin your answer)
- **Key points** in logical sequence
- **Follow-up anticipation** (likely follow-up questions with answers)
- Use conversational yet academic tone
- Include mnemonics and key memory aids
Aim for 400-600 words.`
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

        // For multiple questions, generate all answers in one call
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

        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
            });
        } catch (e: any) {
            console.warn("gemini-2.5-flash failed, falling back to gemini-1.5-flash", e.message);
            response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: promptText,
            });
        }

        const text = response.text || 'No answer generated.';

        return NextResponse.json({ success: true, answer: text });
    } catch (error: any) {
        console.warn('Essay Answer Gen API Error:', error.message);
        const fallbackBody = await req.clone().json().catch(() => ({}));
        return NextResponse.json({
            success: true,
            answer: `# Model Answers

## Question 1
${fallbackBody.question || fallbackBody.questions?.[0] || 'N/A'}

### Introduction
This is a mock response. In production, detailed AI-generated model answers will appear here.

### Main Discussion
- **Point 1**: Comprehensive explanation of the first key aspect
- **Point 2**: Detailed analysis of the second key aspect  
- **Point 3**: Clinical correlations and practical applications

### Conclusion
A well-structured summary reiterating the key points discussed above.

---
*Note: This is a mock response. Connect your API key for full functionality.*`,
            isMock: true
        });
    }
}
