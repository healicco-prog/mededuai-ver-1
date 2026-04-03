import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic, instruction, history, action } = body;

        let promptText = "";

        if (action === 'analyze') {
            promptText = `You are a medical examiner evaluating a medical student's viva voce performance.\nContext:\n- Course: ${course}\n- Subject: ${subject}\n- Topic: ${topic}\n- Instruction Type: ${instruction}\n\nHere is the transcript of the simulation:\n${history.map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Examiner'}: ${msg.content}`).join('\n')}\n\nAnalyze the student's performance. Focus on knowledge, structuring of answers, and medical terminology. Give a detailed analysis and actionable steps to improve. Provide well-formatted markdown output.`;
        } else {
            promptText = `You are a medical examiner conducting a viva voce for a medical student.\nContext:\n- Course: ${course}\n- Subject: ${subject}\n- Topic: ${topic}\n- Evaluation Focus: ${instruction}\n\nYour task is to act as the examiner. Ask questions one by one based on the given context and topic.\nAsk only ONE question at a time. Do not answer for the student. If the student answers, acknowledge and ask the next question or probe deeper depending on the evaluation focus. Occasionally you may ask if they want you to test deeper knowledge or move on. Keep your responses concise (1-3 sentences) like a real oral examiner.\n\nHere is the current conversation transcript:\n${history.map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Examiner'}: ${msg.content}`).join('\n')}\n\nBased on this transcript, generate your next utterance as the Examiner.`;
        }

        const text = await generateText(promptText);
        return NextResponse.json({ success: true, response: text || (action === 'analyze' ? 'Good performance. Keep studying.' : 'Can you elaborate on that?') });
    } catch (error: any) {
        console.warn('Viva API Error:', error.message);
        const isAnalyze = false; // Safe fallback
        return NextResponse.json({
            success: true,
            response: isAnalyze
                ? '**Analysis (Mock):** \nYou did well structurally but need more focus on exact terminology. Review the standard Pathology Robbins sections.'
                : 'That is interesting. What else do you know about this topic?',
            isMock: true
        });
    }
}
