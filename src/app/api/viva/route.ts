import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

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

        let response;
        try {
            response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: promptText,
            });
        } catch (e: any) {
            console.warn("gemini-1.5-flash failed, falling back to gemini-2.5-flash", e.message);
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
            });
        }

        const text = response.text || (action === 'analyze' ? 'Good performance. Keep studying.' : 'Can you elaborate on that?');

        return NextResponse.json({ success: true, response: text });
    } catch (error: any) {
        console.warn('Viva API Key Error/Exhaustion detected. Falling back to local mock data.', error.message);

        const body = await req.json().catch(() => ({}));
        const isAnalyze = body?.action === 'analyze';

        return NextResponse.json({
            success: true,
            response: isAnalyze
                ? '**Analysis (Mock):** \nYou did well structurally but need more focus on exact terminology. Review the standard Pathology Robbins sections.'
                : 'That is interesting. What else do you know about this topic?',
            isMock: true
        });
    }
}
