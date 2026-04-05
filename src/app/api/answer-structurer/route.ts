import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { draft } = body;

        const promptText = `You are an expert medical educator specializing in helping medical students write well-structured exam answers.

A medical student has written a rough draft or bullet-point notes for a medical answer. Your job is to:

1. **Restructure** the content into a proper, well-organized medical answer format with:
   - **Definition** (if applicable)
   - **Introduction** paragraph
   - **Etiology / Causes** (if applicable)
   - **Pathogenesis / Mechanism** (if applicable)
   - **Classification / Types** (if applicable)
   - **Clinical Features / Signs & Symptoms** (if applicable)
   - **Diagnosis / Investigations** (if applicable)
   - **Management / Treatment** (if applicable)
   - **Complications / Prognosis** (if applicable)

2. **Enhance** the content by:
   - Adding proper medical terminology
   - Correcting any factual inaccuracies
   - Adding missing important points
   - Improving sentence structure and flow

3. The output should be exam-ready — suitable for writing in a university examination.

Here is the student's rough draft:
---
${draft}
---

Format the output in clean, readable markdown with proper headers, bold text, bullet points, and tables where appropriate.`;

        const text = await generateText(promptText);
        return NextResponse.json({ success: true, structured: text || 'No structured output generated.' });
    } catch (error: any) {
        console.warn('Answer Structurer API Error:', error.message);
        return NextResponse.json({
            success: true,
            structured: `## Structured Medical Answer

### Definition
An underlying condition characterized by the described features.

### Etiology
- **Factor A**: Primary contributing factor
- **Factor B**: Secondary contributing factor

### Pathogenesis
The continuous breakdown of normal mechanisms limits the body's ability to compensate.

### Clinical Features
- Pain (localized / generalized)
- Swelling (acute / chronic)
- Associated systemic features

### Management
1. **Conservative**: Rest, lifestyle modifications
2. **Medical**: Pharmacological interventions
3. **Surgical**: If indicated

---
*Note: This is a fallback response. The AI service will recover automatically.*`,
            isMock: true
        });
    }
}
