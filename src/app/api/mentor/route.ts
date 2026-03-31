import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        let chatHistory = "You are MedEduAI Mentor, a highly advanced AI tutor for medical students. Keep your answers concise, accurate, and encouraging. Use simple markdown if needed.\n\n";
        messages.forEach((msg: any) => {
            chatHistory += `${msg.role === 'user' ? 'Student' : 'Mentor'}: ${msg.content}\n`;
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: chatHistory
        });

        return NextResponse.json({ success: true, response: response.text });
    } catch (error: any) {
        console.error("Mentor API Error:", error);
        return NextResponse.json({ success: false, response: "I encountered an error connecting to my knowledge base. Please try again." });
    }
}
