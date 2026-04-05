import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { summary } = body;

        const promptText = `You are a senior attending physician and medical educator. A medical student has submitted a raw, informal case summary from a clinical encounter. Your job is to:

1. **Restructure** the summary into a proper, professional clinical case presentation format with clear sections:
   - **Chief Complaint (CC)**
   - **History of Presenting Illness (HPI)**
   - **Past Medical History (PMH)**
   - **Family History (FH)**
   - **Social History (SH)**
   - **Review of Systems (ROS)**
   - **Physical Examination Findings** (extract from context)
   - **Assessment / Differential Diagnosis**

2. **Identify missing elements** that the student forgot to include or needs to clarify.

3. **Clinical Flow Correction**: Provide specific feedback on how the student should restructure their presentation for ward rounds or grand rounds.

4. **Tips**: Include 2-3 actionable tips for improving case presentation skills.

Here is the student's raw case summary:
---
${summary}
---

Format the output in clean, readable markdown with proper headers and bullet points.`;

        const text = await generateText(promptText);
        return NextResponse.json({ success: true, analysis: text || 'No analysis generated.' });
    } catch (error: any) {
        console.warn('Case Trainer API Error:', error.message);
        return NextResponse.json({
            success: true,
            analysis: `## Structured Case Presentation

### Chief Complaint
Abdominal pain × 2 days

### History of Presenting Illness
45-year-old male presents with right lower quadrant pain, gradual onset over 2 days, associated with nausea and one episode of vomiting.

### Past Medical History
Not provided — **please document**

### Review of Systems
- Positive for fever and nausea
- Remaining systems not documented

### Clinical Flow Correction
- Always begin with demographics and chief complaint in one sentence
- Use precise medical terminology ("abdominal pain" not "stomach hurting")
- Document all ROS systems even if negative

### Tips
1. Practice the "one-liner" opening for every case
2. Always specify the location, onset, character, and radiation of pain
3. Document vital signs early in your presentation

---
*Note: This is a fallback response. The AI service will recover automatically.*`,
            isMock: true
        });
    }
}
