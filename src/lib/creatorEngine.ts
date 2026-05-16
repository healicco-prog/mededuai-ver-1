/**
 * Creator Engine — Core AI generation logic for LMS content.
 * Extracted from /api/creator/route.ts so it can be shared by:
 *   - /api/creator/route.ts          (single-topic, browser-triggered)
 *   - /api/creator/batch-process/route.ts  (server-side background batch)
 */

import { generateWithFallback } from '@/lib/gemini';

// ── Delimiter constants ──
export const DELIM_START = '===SECTION_START:';
export const DELIM_END = '===SECTION_END===';

// ── Threshold: sections requesting this many or more items get their own dedicated API call ──
export const DEDICATED_CALL_THRESHOLD = 3;

// ── "Best Gemini model" chain for Content Creator Intelligence ──
// Pro is tried first for highest content quality. If Pro is overloaded (429/503)
// we fall back to Flash so the batch keeps moving, then return to Pro on the
// next retry. Other callers (rubric eval, answer restructure) keep their own
// flash-first defaults — this chain is creator-specific.
const CREATOR_MODELS = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
];

// Pro + thinking on long creator prompts can run 90-150s. The default 120s
// Gemini call timeout was firing mid-think and the retry-on-timeout path then
// burned all attempts on the same hard limit. 240s comfortably fits Pro and
// the batch-process route still has 60s of headroom under maxDuration=300s.
const CREATOR_GEMINI_TIMEOUT_MS = 240_000;

async function creatorGenerate(prompt: string): Promise<string> {
    return generateWithFallback(prompt, {
        jsonMode: false,
        preferredModels: CREATOR_MODELS,
        disableThinking: true,
        timeoutMs: CREATOR_GEMINI_TIMEOUT_MS,
    });
}

export interface GenerateTopicParams {
    courseName: string;
    subjectName: string;
    sectionName: string;
    topicName: string;
    lmsStructure: any[];
}

export interface GenerateTopicResult {
    success: boolean;
    generatedNotes?: Record<string, string>;
    error?: string;
}

/**
 * Build the prompt fragment for a single LMS structure item.
 */
export function buildSectionPrompt(item: any, topicName: string): string {
    const count = parseInt(item.value, 10) || 0;
    const titleLower = item.title.toLowerCase();
    const formatStyle = (item.value || '').trim();
    const wordCount = parseInt(item.wordCount, 10) || 0;
    let prompt = '';

    prompt += `--- Section Key: "${item.id}" (${item.title}) ---\n`;
    prompt += `Description: ${item.description}\n`;
    prompt += `Requested Format/Style: ${formatStyle}\n`;
    if (wordCount > 0) {
        prompt += `MANDATORY Word Count: ${wordCount} words (you MUST write approximately ${wordCount} words for this section — not significantly less)\n`;
    }

    if (titleLower.includes('10 mark')) {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} long-essay (10 marks) questions on "${topicName}". YOU MUST NOT STOP UNTIL YOU REACH EXACTLY ${count} QUESTIONS.\n  FORMAT STRICTLY AS:\n`;
            for (let i = 1; i <= count; i++) prompt += `  ${i}. [Full question text suitable for a 10-mark university exam answer]\n`;
            prompt += `  Each question should require a comprehensive answer covering all major aspects of the topic.\n`;
        }
    } else if (titleLower.includes('5 mark')) {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} short-essay (5 marks) questions on "${topicName}". YOU MUST NOT STOP UNTIL YOU REACH EXACTLY ${count} QUESTIONS.\n  FORMAT STRICTLY AS:\n`;
            for (let i = 1; i <= count; i++) prompt += `  ${i}. [Full question text suitable for a 5-mark university exam answer]\n`;
            prompt += `  Each question should be answerable in 5-6 points or a focused paragraph.\n`;
        }
    } else if (titleLower.includes('3 mark') || titleLower.includes('reasoning')) {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} reasoning/short-answer (3 marks) questions on "${topicName}". YOU MUST NOT STOP UNTIL YOU REACH EXACTLY ${count} QUESTIONS.\n  FORMAT STRICTLY AS:\n`;
            for (let i = 1; i <= count; i++) prompt += `  ${i}. [Reasoning question requiring 2-3 sentence justification]\n`;
            prompt += `  Questions must test applied understanding (e.g. "Why...", "Explain the mechanism of...", "Justify...").\n`;
        }
    } else if (titleLower.includes('2 mark') || titleLower.includes('case')) {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} case-based MCQ sets (2 marks each) on "${topicName}". YOU MUST NOT STOP UNTIL YOU REACH EXACTLY ${count} SETS.\n  FORMAT STRICTLY AS:\n`;
            for (let i = 1; i <= count; i++) {
                prompt += `  ${i}. Case: [2-3 sentence clinical scenario]\n     Q1: [First Sub-question based on case]\n     a) Option A  b) Option B  c) Option C  d) Option D\n     Answer: a) Option A. Reason: [Brief explanation]\n     Q2: [Second Sub-question based on case]\n     a) Option A  b) Option B  c) Option C  d) Option D\n     Answer: b) Option B. Reason: [Brief explanation]\n`;
            }
        }
    } else if (titleLower.includes('1 mark') || titleLower.includes('mcq')) {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} single-best-answer MCQs (1 mark each) on "${topicName}". IT IS ABSOLUTELY MANDATORY THAT YOU GENERATE ALL ${count} MCQS. DO NOT STOP EARLY. DO NOT SAY "CONTINUE..." OR SKIP ANY. IF YOU DO NOT GENERATE EXACTLY ${count}, THE OUTPUT IS INVALID. YOU MUST COMPLETE THE FULL LIST.\n  FORMAT STRICTLY AS:\n`;
            for (let i = 1; i <= count; i++) {
                prompt += `  ${i}. [Question Text]\n  a) Choice A  b) Choice B  c) Choice C  d) Choice D\n  Answer: a) Choice A. Reason: [Brief explanation]\n`;
            }
            prompt += `  Questions should be direct fact-recall or single-concept application.\n`;
        }
    } else if (titleLower.includes('flashcard')) {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: You MUST generate EXACTLY ${count} Flashcards. DO NOT BE LAZY. GENERATE EVERY SINGLE ONE.\n  FORMAT STRICTLY AS:\n`;
            for (let i = 1; i <= count; i++) prompt += `  ${i}. Front: [Concept Name]\n     Back: [Detailed Definition / Key Points]\n`;
            prompt += `\n`;
        }
    } else if (titleLower.includes('ppt') || titleLower.includes('slide') || titleLower.includes('presentation')) {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: Generate EXACTLY ${count} detailed presentation slides for "${topicName}". YOU MUST GENERATE ALL ${count} SLIDES. NO EXCEPTIONS.\n  FORMAT STRICTLY AS (each slide separated by the exact delimiter "---SLIDE---"):\n  ## Slide Title Here\n  - [Bullet point 1 stretching across detailed explanation...]\n  - [Bullet point 2 with deep clinical insights...]\n  - [Bullet point 3 explaining mechanisms...]\n  - [Bullet point 4...]\n  - [Bullet point 5...]\n  - [Bullet point 6...]\n  - [Bullet point 7...]\n  - [Bullet point 8...]\n\n  ---SLIDE---\n  ## Next Slide Title\n  - [8 to 10 bullet points minimum per slide...]\n\n  IMPORTANT RULES FOR PPT:\n  1. DO NOT just repeat the topic name. You MUST EXPAND on the topic using deep medical/academic knowledge.\n  2. EVERY slide (except Title slide) MUST have 8 to 10 lines of detailed bullet points.\n  3. First slide is a Title Slide (3-4 lines overview).\n  4. Last slide is Summary/Key Takeaways.\n  5. Do NOT number the slides. Just use ## for the heading.\n`;
        }
    } else if (item.type === 'number') {
        if (count === 0) {
            prompt += `  Return exactly: 'None requested.'\n`;
        } else {
            prompt += `  CRITICAL INSTRUCTION: Provide EXACTLY ${count} items as a numbered list. DO NOT GENERATE FEWER UNLESS THE TOPIC IS IMPOSSIBLE.\n`;
        }
    } else {
        // ── TEXT FORMAT SECTIONS ──
        prompt += `  WRITING FORMAT INSTRUCTION: `;
        if (formatStyle) {
            const styleLower = formatStyle.toLowerCase();
            if (styleLower.includes('essay')) {
                prompt += `Write this section in ESSAY FORMAT — continuous, well-structured paragraphs with proper academic prose. Do NOT use bullet points or numbered lists. Use flowing narrative paragraphs with clear topic sentences, supporting details, and transitions.\n`;
            } else if (styleLower.includes('bullet') || styleLower.includes('point')) {
                prompt += `Write this section using BULLET POINTS — organized, exam-oriented bullet points with clear hierarchical structure. Use bold headings for sub-topics and concise yet informative bullets.\n`;
            } else if (styleLower.includes('concise') || styleLower.includes('revision') || styleLower.includes('summary')) {
                prompt += `Write this section as a CONCISE REVISION SUMMARY — focused, high-yield revision points. Keep it tight and exam-ready with key facts, mnemonics, and quick-recall points.\n`;
            } else {
                prompt += `Write this section following this specific format: "${formatStyle}". Adhere strictly to this formatting instruction.\n`;
            }
        } else {
            prompt += `Provide well-formatted markdown content (using **bold**, bullet points, headings as appropriate).\n`;
        }
        if (wordCount > 0) {
            prompt += `  MANDATORY WORD COUNT: You MUST write approximately ${wordCount} words for this section. This is NOT optional. Your output must be close to ${wordCount} words (within ±10%). If the section seems short, expand with more clinical details, examples, and explanations until you reach ${wordCount} words. DO NOT write significantly less than ${wordCount} words.\n`;
        }
    }

    prompt += `Output for this section between: ${DELIM_START} ${item.id} === and ${DELIM_END}\n\n`;
    return prompt;
}

/**
 * Parse delimited sections from raw Gemini output into a key→content map.
 */
export function parseDelimitedSections(rawText: string, items: any[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const item of items) {
        const startMarker = `${DELIM_START} ${item.id} ===`;
        const startIdx = rawText.indexOf(startMarker);
        if (startIdx !== -1) {
            const contentStart = startIdx + startMarker.length;
            const endIdx = rawText.indexOf(DELIM_END, contentStart);
            if (endIdx !== -1) {
                result[item.id] = rawText.substring(contentStart, endIdx).trim();
            } else {
                const nextStart = rawText.indexOf(DELIM_START, contentStart);
                result[item.id] = rawText.substring(contentStart, nextStart !== -1 ? nextStart : undefined).trim();
            }
        } else {
            console.warn(`[Creator Engine] Section "${item.id}" not found in AI output`);
            result[item.id] = '';
        }
    }
    return result;
}

/**
 * Count how many numbered items exist in a section's text.
 */
export function countNumberedItems(text: string): number {
    if (!text || text.trim() === '' || text === 'None requested.') return 0;
    const matches = text.match(/(?:^|\n)\s*\d+\.\s/g);
    return matches ? matches.length : 0;
}

/**
 * Determine if a section is a "numbered/countable" type.
 */
export function isCountableSection(item: any): boolean {
    const t = item.title.toLowerCase();
    return t.includes('mark') || t.includes('mcq') || t.includes('flashcard') || t.includes('case') || t.includes('reasoning') || t.includes('ppt') || t.includes('slide');
}

/**
 * Get the requested count from an LMS structure item.
 */
export function getRequestedCount(item: any): number {
    return parseInt(item.value, 10) || 0;
}

/**
 * Core topic content generation.
 * Handles chunked generation, count validation, and top-up rounds.
 * Does NOT perform auth checks — that is the route's responsibility.
 */
export async function generateTopicContent(params: GenerateTopicParams): Promise<GenerateTopicResult> {
    const { courseName, subjectName, sectionName, topicName, lmsStructure } = params;

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

    // ── Classify sections into chunks ──
    const textSections: any[] = [];
    const dedicatedSections: any[] = [];
    const groupedNumberedSections: any[] = [];

    for (const item of lmsStructure) {
        const count = getRequestedCount(item);
        if (!isCountableSection(item)) {
            textSections.push(item);
        } else if (count >= DEDICATED_CALL_THRESHOLD) {
            dedicatedSections.push(item);
        } else {
            groupedNumberedSections.push(item);
        }
    }

    console.log(`[Creator Engine] Chunked generation for "${topicName}": ${textSections.length} text, ${dedicatedSections.length} dedicated, ${groupedNumberedSections.length} grouped`);

    const generatedNotes: Record<string, string> = {};
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const structureSummary = lmsStructure.map((item: any) => {
        const wc = parseInt(item.wordCount, 10) || 0;
        if (item.type === 'text') {
            return `• ${item.title}: Format="${item.value || 'markdown'}"${wc > 0 ? `, MUST be ~${wc} words` : ''}`;
        } else {
            const ct = parseInt(item.value, 10) || 0;
            return `• ${item.title}: EXACTLY ${ct} items required`;
        }
    }).join('\n');

    const contextPreamble =
        `You are an expert academic content creation engine designed to produce world-class, accurate, and structured LMS Notes.\n\n` +
        courseDirective +
        `\nContext:\n- Course: ${courseName}\n- Subject: ${subjectName}\n- Section: ${sectionName}\n- Target Topic for these notes: ${topicName}\n\n` +
        `═══ LMS STRUCTURE REQUIREMENTS (set by admin — you MUST follow these EXACTLY) ═══\n${structureSummary}\n═══════════════════════════════════════════════════════════════════════════════\n\n` +
        `CRITICAL RULES:\n` +
        `1. For TEXT sections: Follow the exact writing format specified. If a word count is specified, you MUST write approximately that many words.\n` +
        `2. For NUMBERED sections: Generate the EXACT quantity requested. Not fewer. Not "etc." or "continue...". Complete every single item.\n` +
        `3. DO NOT skip sections or leave them empty.\n\n` +
        `CRITICAL OUTPUT FORMAT INSTRUCTIONS:\n` +
        `You MUST output your response using the following delimited format. For EACH section, output content wrapped between the exact delimiters.\n` +
        `DO NOT use JSON. DO NOT wrap in code blocks. Use ONLY the delimiter format.\n\n` +
        `Example format:\n` +
        `${DELIM_START} example_key ===\nYour generated content for this section goes here...\n${DELIM_END}\n\n`;

    const generateChunk = async (items: any[], chunkLabel: string): Promise<Record<string, string>> => {
        if (items.length === 0) return {};
        let prompt = contextPreamble;
        prompt += `Generate the following sections:\n\n`;
        for (const item of items) {
            prompt += buildSectionPrompt(item, topicName);
        }
        prompt += `\nREMEMBER: Use the EXACT delimiter format. Each section MUST start with "${DELIM_START} <key> ===" and end with "${DELIM_END}".\n`;
        prompt += `IMPORTANT: You MUST generate ALL content for ALL sections listed above. Do NOT skip any section. Do NOT truncate. Complete EVERY section fully before outputting the next.\n`;
        prompt += `IMPORTANT: Respect the WRITING FORMAT for each section. If a word count is specified, you MUST reach that word count. If a quantity is specified, you MUST generate that exact number of items.`;
        console.log(`[Creator Engine] [${chunkLabel}] Generating ${items.length} section(s) for "${topicName}"…`);
        const rawText = await creatorGenerate(prompt);
        console.log(`[Creator Engine] [${chunkLabel}] Raw output length: ${rawText.length} chars`);
        return parseDelimitedSections(rawText, items);
    };

    const generateWithCountValidation = async (item: any, chunkLabel: string): Promise<void> => {
        const count = getRequestedCount(item);
        if (count === 0) {
            generatedNotes[item.id] = 'None requested.';
            return;
        }
        const result = await generateChunk([item], chunkLabel);
        generatedNotes[item.id] = result[item.id] || '';

        const MAX_TOPUP_ROUNDS = 3;
        for (let round = 1; round <= MAX_TOPUP_ROUNDS; round++) {
            const currentContent = generatedNotes[item.id];
            const actualCount = countNumberedItems(currentContent);
            if (actualCount >= count) {
                console.log(`[Creator Engine] [Count OK] "${item.title}": ${actualCount}/${count} items ✓`);
                break;
            }
            if (actualCount === 0 && currentContent.length > 20) {
                console.log(`[Creator Engine] [Count Check] "${item.title}" has non-numbered content (${currentContent.length} chars), accepting as-is.`);
                break;
            }
            const missingCount = count - actualCount;
            console.warn(`[Creator Engine] [Count Check] "${item.title}" round ${round}: got ${actualCount}/${count}. Generating ${missingCount} more…`);
            await sleep(1500);
            const topUpPrompt = contextPreamble +
                `You have already generated ${actualCount} items for the section "${item.title}" on "${topicName}".\n` +
                `You need to generate ${missingCount} MORE items (numbered from ${actualCount + 1} to ${count}).\n` +
                `These must be DIFFERENT from the ones already generated. Do NOT repeat any previous items.\n\n` +
                buildSectionPrompt({ ...item, value: String(missingCount) }, topicName) +
                `\nCRITICAL: Start numbering from ${actualCount + 1}. Generate EXACTLY ${missingCount} additional items. This is round ${round} of top-up — you MUST complete all ${missingCount} items this time.\n` +
                `REMEMBER: Use the EXACT delimiter format.`;
            try {
                const topUpRaw = await creatorGenerate(topUpPrompt);
                const topUpParsed = parseDelimitedSections(topUpRaw, [item]);
                const topUpContent = topUpParsed[item.id] || '';
                if (topUpContent.length > 10) {
                    generatedNotes[item.id] = currentContent + '\n\n' + topUpContent;
                    const finalCount = countNumberedItems(generatedNotes[item.id]);
                    console.log(`[Creator Engine] [Count Check] After top-up round ${round}: ${finalCount}/${count} items for "${item.title}"`);
                }
            } catch (topUpErr: any) {
                console.warn(`[Creator Engine] [Count Check] Top-up round ${round} failed for "${item.title}":`, topUpErr.message);
            }
        }
    };

    // ── STEP 1: Text sections ──
    if (textSections.length > 0) {
        const textResults = await generateChunk(textSections, 'Text');
        Object.assign(generatedNotes, textResults);
    }

    // ── STEP 2: Dedicated sections ──
    for (const item of dedicatedSections) {
        await sleep(2000);
        await generateWithCountValidation(item, `Dedicated:${item.title}(${getRequestedCount(item)})`);
    }

    // ── STEP 3: Grouped low-count sections ──
    if (groupedNumberedSections.length > 0) {
        if (textSections.length > 0 || dedicatedSections.length > 0) await sleep(2000);
        const groupedResults = await generateChunk(groupedNumberedSections, 'Grouped');
        Object.assign(generatedNotes, groupedResults);
        for (const item of groupedNumberedSections) {
            const count = getRequestedCount(item);
            if (count === 0) continue;
            const content = generatedNotes[item.id] || '';
            const actualCount = countNumberedItems(content);
            if (actualCount < Math.ceil(count * 0.8)) {
                console.warn(`[Creator Engine] [Count Check] Grouped "${item.title}" got ${actualCount}/${count}. Regenerating with validation…`);
                await sleep(1500);
                await generateWithCountValidation(item, `Regen:${item.title}(${count})`);
            }
        }
    }

    // ── Fill missing sections ──
    for (const item of lmsStructure) {
        if (!(item.id in generatedNotes)) {
            generatedNotes[item.id] = '';
        }
    }

    const hasContent = Object.values(generatedNotes).some(v => v.length > 10);
    if (!hasContent) {
        return { success: false, error: 'AI generated content but it could not be parsed into sections. Please try again.' };
    }

    const sectionSummary = lmsStructure.map(item => {
        const content = generatedNotes[item.id] || '';
        const count = getRequestedCount(item);
        const actual = isCountableSection(item) ? countNumberedItems(content) : null;
        return `${item.title}: ${content.length}ch${actual !== null ? ` (${actual}/${count} items)` : ''}`;
    }).join(', ');
    console.log(`[Creator Engine] ✅ "${topicName}" complete — ${sectionSummary}`);

    return { success: true, generatedNotes };
}

