import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';
import { verifyAuth } from '@/lib/authMiddleware';

export async function POST(req: Request) {
    const user = await verifyAuth(req);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { course, subject, topic, style, depth, instructions } = body;

        const styleGuides: Record<string, string> = {
            comprehensive: `Create comprehensive, textbook-style notes. Include:
- Detailed introduction and overview
- Complete explanation of all key concepts with examples
- Important definitions and terminology
- Clinical correlations where applicable
- Summary of key points at the end`,
            concise: `Create concise bullet-point notes focused on quick revision. Include:
- Key facts only - no unnecessary elaboration
- Important definitions in bold
- High-yield points for exams
- Mnemonics where helpful
- Quick-reference tables where applicable`,
            cornell: `Create notes using the Cornell Method format:
## CUE COLUMN (Key Questions/Terms)
List key questions and terms on the left side

## NOTES COLUMN (Detailed Notes)
Detailed notes and explanations on the right side

## SUMMARY
A brief summary of the entire topic at the bottom`,
            mind_map: `Create notes in a hierarchical mind-map text format:
# CENTRAL TOPIC
## Main Branch 1
  ### Sub-branch 1.1
    - Detail point
    - Detail point
  ### Sub-branch 1.2
## Main Branch 2
  ### Sub-branch 2.1
Use indentation to show relationships between concepts.`
        };

        const promptText = `You are an expert medical educator. Generate ${depth}-level study notes on the following:

Course: ${course}
Subject: ${subject}
Topic: ${topic}

${styleGuides[style] || styleGuides.comprehensive}

${instructions ? `Additional instructions: ${instructions}` : ''}

Use proper markdown formatting with headers, bold, italics, bullet points, and tables where appropriate.
Make the notes medically accurate, well-structured, and suitable for ${course} students.`;

        const text = await generateText(promptText);
        return NextResponse.json({ success: true, notes: text || 'No content generated.' });
    } catch (error: any) {
        console.warn('Notes Creator API Error:', error.message);
        return NextResponse.json({
            success: true,
            notes: `# Study Notes

## Introduction
AI-generated notes are temporarily unavailable. Please try again shortly.

## Key Concepts
The AI service will reconnect automatically.

---
*Note: This is a fallback response.*`,
            isMock: true
        });
    }
}
