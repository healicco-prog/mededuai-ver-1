import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, department, topics, frames, totalMarks } = body;

        let promptInstructions = `You are an expert medical university examiner. You need to create a question paper blueprint based on the National Medical Commission (NMC) guidelines, standard textbooks (like Gray's Anatomy, Guyton, Robbins, KD Tripathi, etc.), and standard clinical resources.\n\n`;
        promptInstructions += `Context:\n- Course: ${course}\n- Department: ${department}\n- Topics/Systems to be assessed: ${topics}\n- Total Marks: ${totalMarks}\n\n`;
        promptInstructions += `You strictly must follow the requested JSON format below. Return a valid JSON object where the keys are the frame IDs, and the values are the generated question text as strings.\n`;
        promptInstructions += `Generate highly accurate, academically rigorous, and relevant questions for the following requirements:\n\n`;

        for (const frame of frames) {
            promptInstructions += `- Frame ID "${frame.id}": Create a question of type "${frame.type}" for ${frame.marks} Marks. It is a ${frame.mainOrSub} question. `;
            if (frame.subdivided) {
                promptInstructions += `Make sure to subdivide the question appropriately to total ${frame.marks} marks. `;
            }
            if (frame.type.includes('2 Marks MCQ (Case scenario based, with 2 sub questions)')) {
                promptInstructions += `\n  CRITICAL INSTRUCTION: Generate a realistic clinical case scenario followed by exactly TWO sub-questions. Each sub-question must be an MCQ worth 1 mark, with 4 options each. \n  FORMAT STRICTLY AS: \n  Case Scenario Text\n\n  i) Sub-question 1 Text\n  a) Choice 1 b) Choice 2 c) Choice 3 d) Choice 4\n\n  ii) Sub-question 2 Text\n  a) Choice 1 b) Choice 2 c) Choice 3 d) Choice 4\n\n  CRITICAL RULE: DO NOT INCLUDE THE ANSWER IN THE OUTPUT.\n`;
            } else if (frame.type.toLowerCase().includes('mcq')) {
                promptInstructions += `\n  CRITICAL INSTRUCTION: Generate EXACTLY 1 Multiple Choice Question.\n  FORMAT STRICTLY AS: \n  Question Text\n  a) Choice 1 b) Choice 2 c) Choice 3 d) Choice 4\n  CRITICAL RULE: DO NOT INCLUDE THE ANSWER IN THE OUTPUT.\n`;
                if (frame.type.toLowerCase().includes('case') || frame.type.toLowerCase().includes('scenario')) {
                    promptInstructions += `  Ensure the MCQ is based on a realistic clinical case scenario.\n`;
                }
            } else if (frame.type.toLowerCase().includes('case') || frame.type.toLowerCase().includes('problem')) {
                promptInstructions += `\n  Provide a clinical vignette/case study followed by the specific questions to be answered.\n`;
            } else {
                promptInstructions += `\n  Provide a clear, direct, and well-structured question.\n`;
            }
        }

        promptInstructions += `\nCRITICAL JSON SCHEMA REQUIREMENT: You must return ONLY a raw, valid JSON object. Do not wrap it in markdown blockquotes. Every value must be a single correctly escaped string. The keys must exactly match the Frame IDs provided.\n`;

        const parsed = await generateJSON(promptInstructions);
        return NextResponse.json({ success: true, generatedQuestions: parsed });
    } catch (error: any) {
        console.warn('Q-Paper API Error:', error.message);

        const body = await req.json().catch(() => ({ frames: [], topics: 'Unknown' }));
        const mockedQuestions: Record<string, string> = {};

        for (const frame of body.frames || []) {
            let content = "";
            const isMCQ = frame.type.toLowerCase().includes('mcq');

            if (isMCQ) {
                if (frame.type.includes('2 Marks MCQ')) {
                    content = `**Case Scenario:** A patient presents with symptoms related to ${body.topics}.\n\ni) What is the most likely diagnosis?\nA) Option 1 B) Option 2 C) Option 3 D) Option 4\n\nii) What is the next best step?\nA) Option 1 B) Option 2 C) Option 3 D) Option 4`;
                } else {
                    content = `Based on ${body.topics}, which of the following is correct?\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4`;
                }
            } else if (frame.type.toLowerCase().includes('case')) {
                content = `**Case Study:** A 45-year old presents with symptoms related to ${body.topics}. Explain the pathophysiology and management. [${frame.marks} Marks]`;
            } else {
                content = `Discuss the principles of ${body.topics} in detail relevant to ${frame.type}. [${frame.marks} Marks]`;
            }

            mockedQuestions[frame.id] = content + `\n\n*(Note: Live Gemini generation was bypassed due to API Key Quota).*`;
        }

        return NextResponse.json({ success: true, generatedQuestions: mockedQuestions, isMock: true });
    }
}
