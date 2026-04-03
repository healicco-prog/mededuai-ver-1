import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        let chatHistory = "You are MedEduAI Mentor, a highly advanced AI tutor for medical students. Keep your answers concise, accurate, and encouraging. Use simple markdown if needed.\n\n";
        messages.forEach((msg: any) => {
            chatHistory += `${msg.role === 'user' ? 'Student' : 'Mentor'}: ${msg.content}\n`;
        });

        const text = await generateText(chatHistory);
        return NextResponse.json({ success: true, response: text });
    } catch (error: any) {
        console.error("Mentor API Error:", error);
        
        // Return a helpful mock response when API keys fail instead of an error message
        return NextResponse.json({ 
            success: true, 
            response: "**AI Mentor (Mock Mode):** I am currently running in fallback mode because my connection to the Gemini knowledge base was interrupted (API Key quota/error).\n\nHowever, I am still tracking your progress. What else would you like to discuss?",
            isMock: true
        });
    }
}
