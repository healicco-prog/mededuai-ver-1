import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

export async function POST(req: Request) {
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

        const text = response.text || 'No content generated.';

        return NextResponse.json({ success: true, notes: text });
    } catch (error: any) {
        console.warn('Notes Creator API Error:', error.message);
        return NextResponse.json({
            success: true,
            notes: `# ${(await req.clone().json().catch(() => ({}))).topic || 'Topic'} - Study Notes

## Introduction
This is a mock response. In production, AI-generated comprehensive notes will appear here covering all aspects of the topic.

## Key Concepts
- **Concept 1**: Detailed explanation with clinical correlation
- **Concept 2**: Important definitions and terminology
- **Concept 3**: Pathophysiology and mechanisms

## Summary
Key takeaways and high-yield points for examination preparation.

---
*Note: This is a mock response. Connect your API key for full functionality.*`,
            isMock: true
        });
    }
}
