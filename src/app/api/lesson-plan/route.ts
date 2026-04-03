import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { course, subject, topic } = body;

        const promptText = `Generate a highly structured academic MBBS Lesson Plan for the topic: ${topic} within ${subject} (${course}).
        Return ONLY a raw valid JSON object. Do not return markdown blocks or backticks. Format exactly matching this structure:
        {
          "learningObjectives": ["objective 1", "objective 2", "objective 3", "objective 4"],
          "priorKnowledge": ["knowledge 1", "knowledge 2", "knowledge 3"],
          "teachingAids": { "selected": ["PowerPoint Presentation", "Videos / Animations"], "other": "" },
          "teachingPlan": [
            { "time": "0-10 min", "teacherActivity": "Introduction", "studentActivity": "Listening", "teachingMethod": "Lecture", "teachingAid": "PPT" },
            { "time": "10-40 min", "teacherActivity": "Core concept discussion", "studentActivity": "Notes taking / Interaction", "teachingMethod": "Interactive Lecture", "teachingAid": "Models/Charts" },
            { "time": "40-50 min", "teacherActivity": "Case study review", "studentActivity": "Group discussion", "teachingMethod": "Small Group Discussion", "teachingAid": "Case Scenarios" },
            { "time": "50-60 min", "teacherActivity": "Summary and Q&A", "studentActivity": "Asking questions", "teachingMethod": "Q&A", "teachingAid": "Whiteboard" }
          ],
          "formativeAssessment": { 
              "questions": ["Q1", "Q2", "Q3", "Q4"], 
              "methods": ["Oral questions", "MCQs"] 
          },
          "summary": ["key point 1", "key point 2", "key point 3"],
          "takeHomeMessage": "One concise core message",
          "suggestedReading": ["Textbook reference 1", "Textbook reference 2"]
        }
        Fill the content intelligently and rigorously for medical education.`;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, plan: parsed });
    } catch (error: any) {
        console.warn('Lesson Plan API Error:', error.message);
        return NextResponse.json({
            success: true,
            plan: {
                learningObjectives: ["Define the topic", "Understand the mechanisms", "Apply to clinical scenarios", "Identify key structures"],
                priorKnowledge: ["Basic anatomy", "Basic physiology", "General terminology"],
                teachingAids: { selected: ["PowerPoint Presentation"], other: "" },
                teachingPlan: [{ time: "60 mins", teacherActivity: "Lecture", studentActivity: "Listen", teachingMethod: "Lecture", teachingAid: "PPT" }],
                formativeAssessment: { questions: ["What is it?", "How does it work?", "What are the limits?", "Give an example"], methods: ["Oral questions"] },
                summary: ["Point 1", "Point 2", "Point 3"],
                takeHomeMessage: "Always remember the basics.",
                suggestedReading: ["Robbins Pathology", "Guyton Physiology"]
            },
            isMock: true
        });
    }
}
