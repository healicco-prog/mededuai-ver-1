import { GoogleGenAI } from '@google/genai';

// ─────────────────────────────────────────────────────────────
// MedEduAI – Centralized Gemini AI Configuration
// ─────────────────────────────────────────────────────────────

const resolvedKey = process.env.GEMINI_API_KEY;

if (!resolvedKey) {
    console.error('GEMINI_API_KEY environment variable is not set. AI features will use mock fallbacks.');
}

// Lazy-initialize the client so the build doesn't crash when the key
// is only provided at runtime (e.g. Cloud Run env vars).
let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
    if (!_ai) {
        const key = process.env.GEMINI_API_KEY || resolvedKey;
        if (!key) throw new Error('GEMINI_API_KEY is not set');
        _ai = new GoogleGenAI({ apiKey: key });
    }
    return _ai;
}

// Model hierarchy – ordered by preference (confirmed working on mededuai-prod)
const MODELS = {
    primary: 'gemini-2.5-flash',       // Primary: confirmed working
    secondary: 'gemini-1.5-flash',     // Fallback
    tertiary: 'gemini-2.0-flash',      // Secondary fallback
} as const;

/**
 * Smart Gemini content generation with automatic model fallback.
 * Tries models in order until one succeeds.
 * 
 * @param prompt - The prompt text to send
 * @param options - Optional config (json mode, model preference)
 * @returns The generated text content
 */
export async function generateWithFallback(
    prompt: string,
    options?: {
        jsonMode?: boolean;
        preferredModels?: string[];
    }
): Promise<string> {
    const models = options?.preferredModels || [MODELS.primary, MODELS.secondary, MODELS.tertiary];
    const config = options?.jsonMode ? { responseMimeType: 'application/json' as const } : undefined;

    let lastError: Error | null = null;

    for (const model of models) {
        try {
            const response = await getAI().models.generateContent({
                model,
                contents: prompt,
                ...(config ? { config } : {}),
            });
            return response.text || (options?.jsonMode ? '{}' : '');
        } catch (e: any) {
            console.warn(`[MedEduAI AI] Model ${model} failed:`, e.message);
            lastError = e;
        }
    }

    throw lastError || new Error('All AI models failed');
}

/**
 * Generate structured JSON content with automatic parsing.
 */
export async function generateJSON<T = any>(
    prompt: string,
    preferredModels?: string[]
): Promise<T> {
    const text = await generateWithFallback(prompt, {
        jsonMode: true,
        preferredModels,
    });
    return JSON.parse(text);
}

/**
 * Generate plain text/markdown content.
 */
export async function generateText(
    prompt: string,
    preferredModels?: string[]
): Promise<string> {
    return generateWithFallback(prompt, {
        jsonMode: false,
        preferredModels,
    });
}

// ── Re-export the models and AI instance for advanced usage ──
export { getAI, MODELS };

// ── Existing LMS functions (updated to use centralized helper) ──

/**
 * LMS Content Generator Prompt Template
 */
export async function generateLMSBundle(topicName: string, courseScope: string) {
    const prompt = `You are an expert medical educator preparing materials for university exams.
Generate structured, highly accurate notes for the topic "${topicName}" within the context of "${courseScope}".
Format exactly as a valid JSON object without markdown wrapping or any other text.
Follow this schema EXACTLY:
{
  "introduction": "Bullet points focused on exam relevance.",
  "detailedNotes": "Essay format covering definition, etiology, pathogenesis, clinical features, management, and complications.",
  "summary": "Concise 3-line revision or visual schema placeholder.",
  "flashcards": [ {"front": "Q", "back": "A"} ],
  "questions10": ["10 mark essay Q1", "Q2"],
  "questions5": ["5 mark short Q1", "Q2"],
  "questions3": ["3 mark reasoning Q1", "Q2"]
}`;

    return generateJSON(prompt);
}

/**
 * AI Rubric Evaluator
 */
export async function evaluateStudentScript(
    studentAnswer: string,
    rubric: any,
    maxMarks: number
) {
    const prompt = `You are a strict medical examiner.
Evaluate the student answer against the provided rubric. 
Maximum possible marks: ${maxMarks}.

Student Answer:
"""
${studentAnswer}
"""

Approved Rubric:
"""
${JSON.stringify(rubric, null, 2)}
"""

Reply exclusively with this JSON structure:
{
  "marksAllocated": (number),
  "justification": "(explain why marks were given/deducted)",
  "missingKeywords": ["keyword1", "keyword2"]
}`;

    return generateJSON(prompt);
}

/**
 * Answer Structurer (Student tool)
 */
export async function restructureAnswer(roughDraft: string) {
    const prompt = `Restructure the following medical student's rough draft into an academic format standard for university exams.
Structure it carefully using: Definition, Etiology, Pathogenesis, Clinical Features, Management, Complications.
Correct grammar and switch to formal clinical terminology.
Draft:
"""
${roughDraft}
"""`;

    return generateText(prompt);
}
