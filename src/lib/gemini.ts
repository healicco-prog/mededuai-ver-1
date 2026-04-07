import { GoogleGenAI } from '@google/genai';

// ─────────────────────────────────────────────────────────────
// MedEduAI – Centralized Gemini AI Configuration
// ─────────────────────────────────────────────────────────────
//
// PRODUCTION (Cloud Run):
//   Uses Vertex AI with Application Default Credentials (ADC).
//   The Cloud Run service account (mededuai-vertex-sa) has
//   roles/aiplatform.user — NO API KEY needed.
//
// LOCAL DEV:
//   Falls back to GEMINI_API_KEY if GOOGLE_CLOUD_PROJECT is not set.
//   Never exposed to portal users — only accessed from API routes.
// ─────────────────────────────────────────────────────────────

const isCloudRun = !!(
    process.env.K_SERVICE ||              // Cloud Run service name
    process.env.GOOGLE_CLOUD_PROJECT      // Explicitly set project
);

const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'mededuai-prod';
const GCP_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
    if (!_ai) {
        if (isCloudRun) {
            // ── Production: Vertex AI + ADC (service account) ──────────────
            // No API key needed — Cloud Run identity provides auth via ADC.
            console.log(`[MedEduAI AI] Initializing Vertex AI (project=${GCP_PROJECT}, location=${GCP_LOCATION})`);
            _ai = new GoogleGenAI({
                vertexai: true,
                project: GCP_PROJECT,
                location: GCP_LOCATION,
            });
        } else {
            // ── Local Dev: Google AI Studio key (fallback) ──────────────────
            const key = process.env.GEMINI_API_KEY;
            if (!key) {
                throw new Error(
                    '[MedEduAI AI] GEMINI_API_KEY is not set for local dev. ' +
                    'Set it in .env.local or run on Cloud Run with Vertex AI.'
                );
            }
            console.log('[MedEduAI AI] Initializing Google AI Studio (local dev)');
            _ai = new GoogleGenAI({ apiKey: key });
        }
    }
    return _ai;
}

// Model hierarchy – compatible with both Vertex AI and AI Studio
const MODELS = {
    primary: 'gemini-2.5-flash',       // Primary: best quality & stable
    secondary: 'gemini-2.5-flash',     // Fallback 1
    tertiary: 'gemini-2.5-flash',      // Fallback 2
} as const;

/**
 * Smart Gemini content generation with automatic model fallback.
 * Tries models in order until one succeeds.
 * ⚠️  MUST only be called from Next.js API routes (server-side).
 *     Never import or call from client components.
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
    
    // Strip markdown formatting like ```json ... ```
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        const lines = cleanText.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines[lines.length - 1].startsWith('```')) lines.pop();
        cleanText = lines.join('\n').trim();
    }
    
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.warn("[MedEduAI AI] Failed to parse JSON. Raw text:", text);
        throw e;
    }
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
