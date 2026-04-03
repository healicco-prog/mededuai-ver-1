import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    let body;
    let topicName = "Unknown Topic";
    let lmsStructure: any[] = [];

    try {
        body = await req.json();
        const { courseName, subjectName, sectionName } = body;
        topicName = body.topicName || topicName;
        lmsStructure = body.lmsStructure || [];

        // ── Course-specific prompt customization ──
        let courseDirective = '';
        const courseUpper = (courseName || '').toUpperCase().trim();
        
        if (courseUpper.includes('MBBS')) {
            courseDirective = `
COURSE SPECIALIZATION — MBBS (Bachelor of Medicine & Bachelor of Surgery):
You are generating notes for MBBS medical students. Your content must be:
• **Comprehensive and deeply detailed** — provide thorough, exam-oriented explanations covering anatomy, physiology, pathology, pharmacology, biochemistry, microbiology, and clinical correlations as relevant to the topic.
• **Based on the standard of top Indian medical colleges** such as AIIMS New Delhi, CMC Vellore, JIPMER, Armed Forces Medical College (AFMC Pune), Maulana Azad Medical College, and Grant Medical College.
• **Aligned with best online medical resources** — incorporate the depth and accuracy seen in trusted references like Gray's Anatomy, Robbins Pathology, Guyton's Physiology, K.D. Tripathi Pharmacology, Harper's Biochemistry, and Ananthanarayanan Microbiology.
• **Include clinical pearls, mnemonics, high-yield exam points**, applied anatomy, and clinical case correlations where relevant.
• **Use a rigorous, university-exam-oriented approach** — content should prepare students for professional MBBS university exams, NEET-PG, USMLE-style reasoning, and clinical viva.
`;
        } else if (courseUpper.includes('BDS')) {
            courseDirective = `
COURSE SPECIALIZATION — BDS (Bachelor of Dental Surgery):
You are generating notes for BDS dental students. Your content must be:
• **Focused on dental relevance** — emphasize oral anatomy, dental histology, dental materials, prosthodontics, orthodontics, oral pathology, oral medicine, conservative dentistry, periodontics, and clinical dental applications as relevant.
• **Based on the standard of top Indian dental colleges** such as Maulana Azad Institute of Dental Sciences (MAIDS Delhi), Government Dental College Mumbai, Manipal College of Dental Sciences, SDM Dharwad, and Saveetha Dental College.
• **Aligned with best dental resources** — incorporate depth from B.D. Chaurasia (dental anatomy), Shafer's Oral Pathology, Orban's Oral Histology, Grossman's Endodontics, T.P. Lahiri Orthodontics, and Sturdevant's Conservative Dentistry.
• **Highlight dental-specific applications** — relate general medical topics to their dental implications.
• **Include BDS exam-oriented points** — prepare students for BDS university exams and MDS entrance (NEET-MDS).
`;
        } else if (courseUpper.includes('NURSING') || courseUpper.includes('BSC')) {
            courseDirective = `
COURSE SPECIALIZATION — BSc Nursing:
You are generating notes for BSc Nursing students. Your content must be:
• **Focused on nursing practice and patient care** — emphasize nursing procedures, patient assessment, care plans, health education, community health, maternal & child health nursing, medical-surgical nursing, and psychiatric nursing as relevant.
• **Based on the standard of top Indian nursing colleges** such as RAK College of Nursing (Delhi), CMC Vellore Nursing, AIIMS College of Nursing, NIMHANS Nursing, Manipal College of Nursing, and Armed Forces Nursing Service.
• **Aligned with best nursing resources** — incorporate content standards from Brunner & Suddarth's Medical-Surgical Nursing, Park's Community Medicine, D.C. Dutta's Obstetrics, B.T. Basavanthappa's Nursing textbooks, and INC guidelines.
• **Emphasize nursing-specific competencies** — nursing process (assessment, diagnosis, planning, implementation, evaluation), health promotion, drug administration & dosage calculations, ethical and legal aspects.
• **Include nursing exam-oriented content** — prepare students for BSc Nursing university exams and competitive examinations.
`;
        }

        let schemaObject: Record<string, any> = {};
        let promptInstructions = `You are an expert academic content creation engine designed to produce world-class, accurate, and structured LMS Notes.\n\n`;
        promptInstructions += courseDirective;
        promptInstructions += `\nContext:\n- Course: ${courseName}\n- Subject: ${subjectName}\n- Section: ${sectionName}\n- Target Topic for these notes: ${topicName}\n\n`;
        promptInstructions += `You strictly must follow the requested JSON format below. Each key corresponds to a section of the LMS Notes Structure. For each key, generate content exactly fulfilling the description requested:\n\n`;

        for (const item of lmsStructure) {
            schemaObject[item.id] = `(string) Generated content for ${item.title}`;
            promptInstructions += `- Key "${item.id}" (${item.title}): ${item.description} - Default format: ${item.value}\n`;

            if (item.title.toLowerCase().includes('mcq')) {
                promptInstructions += `  CRITICAL INSTRUCTION: You MUST generate EXACTLY ${item.value || 5} Multiple Choice Questions.\n  FORMAT STRICTLY AS: \n  1. Question Text\n  a) Choice 1 b) Choice 2 c) Choice 3 d) Choice 4\n  Answer: a) Choice 1\n\n  Repeat this exact format for all questions.\n`;
            } else if (item.title.toLowerCase().includes('flashcard')) {
                promptInstructions += `  CRITICAL INSTRUCTION: You MUST generate EXACTLY ${item.value || 5} Flashcards.\n  FORMAT STRICTLY AS:\n  Front: [Concept Name]\n  Back: [Detailed Definition]\n\n`;
            } else if (item.type === 'number') {
                promptInstructions += `  NOTE: Provide EXACTLY the number of items requested (${item.value}). If 0, just return 'None requested.'.\n`;
            } else {
                const wordNote = item.wordCount ? ` Aim for approximately ${item.wordCount} words in total.` : '';
                promptInstructions += `  NOTE: Provide well formatted markdown (using **bold**, bullet points, etc. as appropriate).${wordNote}\n`;
            }
        }

        promptInstructions += `\nReturn ONLY a robust, accurate valid JSON object containing exactly the keys defined above and with the values as strings.`;

        const parsed = await generateJSON(promptInstructions);
        return NextResponse.json({ success: true, generatedNotes: parsed });
    } catch (error: any) {
        console.warn('Creator API Error:', error.message);

        // Generate structured mock data dynamically matching their schema
        const mockedNotes: Record<string, string> = {};
        for (const item of lmsStructure) {
            if (item.type === 'text') {
                mockedNotes[item.id] = `**[Generated ${item.title}]**\n\nThis is a highly structured, auto-generated placeholder for the topic: **${topicName}**.\n\n* ${item.description}\n* Automatically configured to match your requested format: '${item.value}'\n\n*(Note: Live Gemini generation was bypassed due to API Key Quota/Revocation).*`;
            } else if (item.title.toLowerCase().includes('mcq')) {
                const count = parseInt(item.value, 10) || 5;
                if (count === 0) {
                    mockedNotes[item.id] = 'None requested.';
                } else {
                    mockedNotes[item.id] = Array.from({ length: 5 }).map((_, i) =>
                        `${i + 1}. Which of the following is an accurate statement regarding ${topicName} (Mock Question ${i + 1})?\n` +
                        `a) This is the correct mock answer b) This is a distractor c) Another wrong choice d) None of the above\n` +
                        `Answer: a`
                    ).join('\n\n');
                }
            } else if (item.title.toLowerCase().includes('flashcard')) {
                const count = parseInt(item.value, 10) || 5;
                if (count === 0) {
                    mockedNotes[item.id] = 'None requested.';
                } else {
                    mockedNotes[item.id] = Array.from({ length: 5 }).map((_, i) =>
                        `Front: What is the primary characteristic of ${topicName} (Card ${i + 1})?\n` +
                        `Back: The primary characteristic involves essential mock physiology principles.`
                    ).join('\n\n');
                }
            } else if (item.type === 'number') {
                const count = parseInt(item.value, 10) || 0;
                if (count === 0) {
                    mockedNotes[item.id] = 'None requested.';
                } else {
                    mockedNotes[item.id] = Array.from({ length: count }).map((_, i) => `${i + 1}. [Practice ${item.title}] regarding ${topicName}?`).join('\n\n');
                }
            }
        }

        return NextResponse.json({ success: true, generatedNotes: mockedNotes, isMock: true });
    }
}
