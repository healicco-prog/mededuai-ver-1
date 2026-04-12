import { GoogleGenAI } from '@google/genai';

// ─────────────────────────────────────────────────────────────
// MedEduAI – Centralized Gemini AI Configuration
// ─────────────────────────────────────────────────────────────
//
// PRIORITY: If GEMINI_API_KEY is set → use Google AI Studio (API key mode).
//           Otherwise → fall back to Vertex AI with ADC.
//
// Cloud Run auto-injects GOOGLE_CLOUD_PROJECT which causes the SDK
// to override API key auth. We MUST delete it at module scope
// BEFORE anything else captures it.
// ─────────────────────────────────────────────────────────────

// ─── CRITICAL: Clean environment BEFORE any reads ───────────
// Cloud Run auto-injects GOOGLE_CLOUD_PROJECT. If an API key is
// present, purge all project variables to force API-key mode.
const _apiKey = process.env.GEMINI_API_KEY;
if (_apiKey) {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_LOCATION;
    delete process.env.GOOGLE_CLOUD_REGION;
    delete process.env.GCLOUD_PROJECT;
    delete process.env.GCP_PROJECT;
}

const isCloudRun = !!(process.env.K_SERVICE);  // Only use K_SERVICE (not project vars we just deleted)
const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'mededuai-prod';
const GCP_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
    if (!_ai) {
        if (_apiKey) {
            // ── Google AI Studio / API Key ──────────────────
            console.log('[MedEduAI AI] Initializing Google AI Studio using API Key (Cloud Run or Local)');
            _ai = new GoogleGenAI({ apiKey: _apiKey });
        } else if (isCloudRun) {
            // ── Production: Vertex AI + ADC (service account) ──────────────
            console.log(`[MedEduAI AI] Initializing Vertex AI (project=${GCP_PROJECT}, location=${GCP_LOCATION})`);
            _ai = new GoogleGenAI({
                vertexai: true,
                project: GCP_PROJECT,
                location: GCP_LOCATION,
            });
        } else {
            throw new Error(
                '[MedEduAI AI] GEMINI_API_KEY is not set for local dev. ' +
                'Set it in .env.local or run on Cloud Run with Vertex AI.'
            );
        }
    }
    return _ai;
}

// Model fallback chain — each must be a genuinely different model so that
// when one is overloaded (503) the next one can succeed.
const MODELS = {
    primary:   'gemini-2.5-flash',          // Latest Flash — fastest, most available
    secondary: 'gemini-2.0-flash',          // Stable Flash — good fallback
    tertiary:  'gemini-2.5-pro',            // High intelligence — strong fallback
    quaternary: 'gemini-2.0-flash-lite',    // Lightweight — reliable last resort
} as const;

// Errors that warrant retrying the SAME model (transient)
const RETRYABLE_CODES = new Set([429, 503, 502, 504, 500]);

/** Sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Smart Gemini content generation with automatic model fallback.
 * - Retries transient errors (429, 503, 502, 504) with exponential backoff
 * - Falls back to the next model after exhausting retries
 * - Skips to the next model immediately on permanent errors (400, 401, 403)
 * ⚠️  MUST only be called from Next.js API routes (server-side).
 *     Never import or call from client components.
 */
export async function generateWithFallback(
    prompt: string,
    options?: {
        jsonMode?: boolean;
        preferredModels?: string[];
        maxRetries?: number;
    }
): Promise<string> {
    const models = options?.preferredModels || [
        MODELS.primary,
        MODELS.secondary,
        MODELS.tertiary,
        MODELS.quaternary,
    ];
    const config = options?.jsonMode ? { responseMimeType: 'application/json' as const } : undefined;
    const maxRetries = options?.maxRetries ?? 3;

    let lastError: Error | null = null;

    for (const model of models) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[MedEduAI AI] Trying model=${model} attempt=${attempt}/${maxRetries}`);
                const response = await getAI().models.generateContent({
                    model,
                    contents: prompt,
                    ...(config ? { config } : {}),
                });
                const text = response.text || (options?.jsonMode ? '{}' : '');
                console.log(`[MedEduAI AI] ✅ model=${model} succeeded (attempt ${attempt})`);
                return text;
            } catch (e: any) {
                lastError = e;
                const httpCode: number = e?.status ?? e?.code ?? 0;
                const isRetryable = RETRYABLE_CODES.has(httpCode) || e?.message?.includes('503') || e?.message?.includes('UNAVAILABLE') || e?.message?.includes('overloaded') || e?.message?.includes('high demand');

                console.warn(
                    `[MedEduAI AI] model=${model} attempt=${attempt} failed — httpCode=${httpCode} retryable=${isRetryable} — ${e.message}`
                );

                if (!isRetryable) {
                    // Permanent error (e.g. bad request, auth failure) — skip this model entirely
                    console.error(`[MedEduAI AI] Permanent error on model=${model}, skipping to next model.`);
                    break;
                }

                if (attempt === maxRetries) {
                    // Exhausted retries for this model — move to next
                    console.warn(`[MedEduAI AI] model=${model} exhausted all retries, trying next model.`);
                    break;
                }

                // Exponential backoff with jitter: 2s, 4s, 8s…
                // For 503 (overload) use longer delays to let the model recover
                const baseDelay = isRetryable && (httpCode === 503 || httpCode === 429) ? 3000 : 1000;
                const backoffMs = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                console.log(`[MedEduAI AI] Retrying model=${model} in ${Math.round(backoffMs)}ms…`);
                await sleep(backoffMs);
            }
        }
    }

    throw lastError || new Error('All AI models exhausted');
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
