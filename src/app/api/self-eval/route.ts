import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { question, marks } = body;

        const markGuidelines: Record<number, string> = {
            2: `This is a 2-mark question (3-4 lines, ~50-80 words). Provide:
- A clear, one-line definition
- 2 key supporting points
- No diagram needed`,
            3: `This is a 3-mark question (half page, ~100-150 words). Provide:
- A definition/introduction
- 3 key points with brief explanations
- Diagram description only if highly relevant`,
            5: `This is a 5-mark question (1 page, ~250-400 words). Provide:
- A clear introduction/definition paragraph
- Main body with organized headings and subpoints
- Diagram description (recommended)
- Brief conclusion`,
            10: `This is a 10-mark question (2-3 pages, ~600-1000 words). Provide:
- A comprehensive introduction
- Well-organized body with multiple headings, subheadings, and detailed explanations
- Diagrams description (strongly recommended)
- Clinical significance / applications
- Conclusion summarizing key points`
        };

        const promptText = `You are an expert medical educator creating a model answer structure for university examinations.

Question: ${question}
Mark Weightage: ${marks} marks

${markGuidelines[marks] || markGuidelines[5]}

Create an ideal answer structure and content that a student should write to score full marks. Include:
1. **Answer Structure** (what sections/headings to include)
2. **Model Answer Content** (the actual answer with proper medical terminology)
3. **Key Points to Remember** (bullet points of must-mention facts)
4. **Common Mistakes to Avoid**

Use proper markdown formatting with headers, bold, italics, and bullet points.
Make the answer medically accurate and aligned with standard university examination expectations.`;

        const text = await generateText(promptText);
        return NextResponse.json({ success: true, answer: text || 'No answer generated.' });
    } catch (error: any) {
        console.warn('Self-Eval API Error:', error.message);
        return NextResponse.json({
            success: true,
            answer: `## Model Answer Structure

### Definition
Provide a clear, concise definition of the condition/concept.

### Key Points
- **Point 1**: Core concept explanation
- **Point 2**: Supporting evidence/mechanism
- **Point 3**: Clinical significance

### Management Structure
- Conservative management
- Medical management  
- Surgical management (if applicable)

### Common Mistakes to Avoid
- Do not skip the definition
- Always mention clinical significance
- Structure your answer with headings

---
*Note: This is a fallback response. The AI service will recover automatically.*`,
            isMock: true
        });
    }
}
