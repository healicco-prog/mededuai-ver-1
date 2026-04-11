import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';
import { verifyAuthAndRole } from '@/lib/authMiddleware';

export async function POST(req: Request) {
    const { user, role } = await verifyAuthAndRole(req);
    if (!user || user.role !== 'authenticated' || !role) {
        return NextResponse.json({ success: false, error: 'Unauthorized. Please check your credentials.' }, { status: 401 });
    }
    
    if (role === 'student') {
        return NextResponse.json({ success: false, error: 'Forbidden. Students cannot use the Curriculum Builder.' }, { status: 403 });
    }

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
            const count = parseInt(item.value, 10) || 0;
            const titleLower = item.title.toLowerCase();

            promptInstructions += `- Key "${item.id}" (${item.title}): ${item.description} - Requested count/format: ${item.value}\n`;

            if (titleLower.includes('10 mark')) {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} long-essay (10 marks) questions on "${topicName}".\n  FORMAT STRICTLY AS:\n  1. [Full question text suitable for a 10-mark university exam answer]\n  2. ...\n  Each question should require a comprehensive answer covering all major aspects of the topic.\n`;
                }
            } else if (titleLower.includes('5 mark')) {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} short-essay (5 marks) questions on "${topicName}".\n  FORMAT STRICTLY AS:\n  1. [Full question text suitable for a 5-mark university exam answer]\n  2. ...\n  Each question should be answerable in 5-6 points or a focused paragraph.\n`;
                }
            } else if (titleLower.includes('3 mark') || titleLower.includes('reasoning')) {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} reasoning/short-answer (3 marks) questions on "${topicName}".\n  FORMAT STRICTLY AS:\n  1. [Reasoning question requiring 2-3 sentence justification]\n  2. ...\n  Questions must test applied understanding (e.g. "Why...", "Explain the mechanism of...", "Justify...").\n`;
                }
            } else if (titleLower.includes('2 mark') || titleLower.includes('case')) {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} case-based MCQ sets (2 marks each) on "${topicName}".\n  FORMAT STRICTLY AS:\n  1. Case: [2-3 sentence clinical scenario related to ${topicName}]\n     Q1: [First Sub-question based on case]\n     a) Option A  b) Option B  c) Option C  d) Option D\n     Answer: a) Option A. Reason: [Brief explanation]\n     Q2: [Second Sub-question based on case]\n     a) Option A  b) Option B  c) Option C  d) Option D\n     Answer: b) Option B. Reason: [Brief explanation]\n  2. ...\n`;
                }
            } else if (titleLower.includes('1 mark') || titleLower.includes('mcq')) {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} single-best-answer MCQs (1 mark each) on "${topicName}".\n  FORMAT STRICTLY AS:\n  1. Question Text\n  a) Choice A  b) Choice B  c) Choice C  d) Choice D\n  Answer: a) Choice A. Reason: [Brief explanation]\n  2. ...\n  Questions should be direct fact-recall or single-concept application.\n`;
                }
            } else if (titleLower.includes('flashcard')) {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  CRITICAL INSTRUCTION: You MUST generate EXACTLY ${count} Flashcards.\n  FORMAT STRICTLY AS:\n  Front: [Concept Name]\n  Back: [Detailed Definition / Key Points]\n\n`;
                }
            } else if (titleLower.includes('ppt') || titleLower.includes('slide') || titleLower.includes('presentation')) {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} detailed presentation slides for "${topicName}".\n  FORMAT STRICTLY AS (each slide separated by the exact delimiter "---SLIDE---"):\n  ## Slide Title Here\n  - [Bullet point 1 stretching across detailed explanation...]\n  - [Bullet point 2 with deep clinical insights...]\n  - [Bullet point 3 explaining mechanisms...]\n  - [Bullet point 4...]\n  - [Bullet point 5...]\n  - [Bullet point 6...]\n  - [Bullet point 7...]\n  - [Bullet point 8...]\n\n  ---SLIDE---\n  ## Next Slide Title\n  - [8 to 10 bullet points minimum per slide...]\n\n  IMPORTANT RULES FOR PPT:\n  1. DO NOT just repeat the topic name. You MUST EXPAND on the topic using deep medical/academic knowledge.\n  2. EVERY slide (except Title slide) MUST have 8 to 10 lines of detailed bullet points.\n  3. First slide is a Title Slide (3-4 lines overview).\n  4. Last slide is Summary/Key Takeaways.\n  5. Do NOT number the slides. Just use ## for the heading.\n`;
                }
            } else if (item.type === 'number') {
                if (count === 0) {
                    promptInstructions += `  Return exactly: 'None requested.'\n`;
                } else {
                    promptInstructions += `  NOTE: Provide EXACTLY ${count} items as a numbered list.\n`;
                }
            } else {
                const wordNote = item.wordCount ? ` Aim for approximately ${item.wordCount} words in total.` : '';
                promptInstructions += `  NOTE: Provide well formatted markdown (using **bold**, bullet points, etc. as appropriate).${wordNote}\n`;
            }
        }

        promptInstructions += `\nReturn ONLY a robust, accurate valid JSON object containing exactly the keys defined above and with the values as strings.`;

        const parsed = await generateJSON(promptInstructions);
        return NextResponse.json({ success: true, generatedNotes: parsed });

    } catch (error: any) {
        // Always log the real error so it appears in Cloud Run logs
        console.error('[Creator API] AI generation failed:', {
            message: error?.message,
            status: error?.status,
            code: error?.code,
            stack: error?.stack?.split('\n').slice(0, 5).join(' | '),
        });

        return NextResponse.json({ 
            success: false, 
            error: error?.message || 'Live Gemini generation failed. Please check your API Quota or API Key.', 
            isMock: false 
        });
    }
}
