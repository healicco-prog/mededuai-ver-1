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
// IMPORTANT: Gemini 1.5 models (gemini-1.5-flash, gemini-1.5-pro) have been
// REMOVED from the v1beta API and return 404. Only use 2.x models.
const MODELS = {
    primary:   'gemini-2.5-flash',          // Latest: fast, 1M context, best for bulk
    secondary: 'gemini-2.0-flash',          // Proven stable fallback
    tertiary:  'gemini-2.0-flash-lite',     // Lighter/cheaper fallback
    quaternary: 'gemini-2.5-pro',           // High intelligence last-resort
} as const;

// Errors that warrant retrying the SAME model (transient)
const RETRYABLE_CODES = new Set([429, 503, 502, 504, 500]);

// Errors that mean the model is GONE (deprecated/removed) — skip immediately
const PERMANENT_SKIP_CODES = new Set([404, 400]);

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
    // ── Output token limits ──
    // Gemini 2.0 Flash supports up to 8192 output tokens by default and 65536 with config.
    // For bulk content generation (notes + questions + flashcards), we need maximum output.
    const config = options?.jsonMode
        ? { responseMimeType: 'application/json' as const, maxOutputTokens: 65536 }
        : { maxOutputTokens: 65536 };
    const maxRetries = options?.maxRetries ?? 4; // Increased from 3 for better resilience

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

                if (!isRetryable || PERMANENT_SKIP_CODES.has(httpCode)) {
                    // Permanent error (e.g. 404 model removed, 400 bad request, 401/403 auth)
                    // Skip this model entirely — no point retrying
                    console.error(`[MedEduAI AI] Permanent error (${httpCode}) on model=${model}, skipping to next model.`);
                    break;
                }

                if (attempt === maxRetries) {
                    // Exhausted retries for this model — move to next
                    console.warn(`[MedEduAI AI] model=${model} exhausted all retries, trying next model.`);
                    break;
                }

                // Exponential backoff with jitter
                // For 429 (rate limit) use longer delays but capped to prevent excessive waits
                // For 503 (overload) use moderate delays to let the model recover
                const baseDelay = httpCode === 429 ? 5000 : (httpCode === 503 ? 3000 : 1500);
                const backoffMs = Math.min(baseDelay * Math.pow(1.5, attempt - 1) + Math.random() * 1500, 30000);
                console.log(`[MedEduAI AI] Retrying model=${model} in ${Math.round(backoffMs)}ms…`);
                await sleep(backoffMs);
            }
        }
    }

    throw lastError || new Error('All AI models exhausted');
}

/**
 * Attempt to repair common JSON issues produced by LLMs.
 * Handles: bad escape sequences, unescaped newlines/tabs inside strings,
 * trailing commas, and unescaped control characters.
 */
function repairJSON(raw: string): string {
    // 1. Fix invalid escape sequences inside JSON string values.
    //    Valid JSON escapes are: \" \\ \/ \b \f \n \r \t \uXXXX
    //    Gemini sometimes produces \_ \' \. \( \) \# \- \+ \* \& \> \< etc.
    //    Strategy: walk through the string and fix backslash sequences that aren't valid.
    let result = '';
    let inString = false;
    let i = 0;
    while (i < raw.length) {
        const ch = raw[i];

        if (ch === '"' && (i === 0 || raw[i - 1] !== '\\')) {
            inString = !inString;
            result += ch;
            i++;
            continue;
        }

        if (inString && ch === '\\') {
            const next = raw[i + 1];
            if (next === undefined) {
                // Trailing backslash — remove it
                i++;
                continue;
            }
            // Valid JSON escapes
            if ('"\\\/bfnrt'.includes(next)) {
                result += ch + next;
                i += 2;
                continue;
            }
            // Unicode escape \uXXXX
            if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(raw.substring(i + 2, i + 6))) {
                result += raw.substring(i, i + 6);
                i += 6;
                continue;
            }
            // Invalid escape — remove the backslash, keep the character
            result += next;
            i += 2;
            continue;
        }

        // Fix unescaped control characters inside strings (literal newlines, tabs)
        if (inString && (ch === '\n' || ch === '\r' || ch === '\t')) {
            if (ch === '\n') result += '\\n';
            else if (ch === '\r') result += '\\r';
            else if (ch === '\t') result += '\\t';
            i++;
            continue;
        }

        result += ch;
        i++;
    }

    // 2. Remove trailing commas before } or ]
    result = result.replace(/,\s*([\]}])/g, '$1');

    return result;
}

/**
 * Generate structured JSON content with automatic parsing
 * and robust multi-layer error recovery.
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
    
    // Layer 1: Direct parse (works most of the time)
    try {
        return JSON.parse(cleanText);
    } catch (e1) {
        console.warn(`[MedEduAI AI] Layer 1 JSON.parse failed: ${(e1 as Error).message}. Attempting repair…`);
    }

    // Layer 2: Repair bad escape sequences and retry
    try {
        const repaired = repairJSON(cleanText);
        return JSON.parse(repaired);
    } catch (e2) {
        console.warn(`[MedEduAI AI] Layer 2 repaired JSON.parse failed: ${(e2 as Error).message}. Trying text-mode fallback…`);
    }

    // Layer 3: Re-generate in non-JSON mode and extract the JSON object manually
    // This is a last resort — Gemini sometimes produces cleaner JSON when not
    // forced into responseMimeType=json mode.
    try {
        console.log('[MedEduAI AI] Layer 3: Re-generating without JSON mode…');
        const textFallback = await generateWithFallback(
            prompt + '\n\nIMPORTANT: Return ONLY a valid JSON object. No markdown, no backticks, no explanations. Every string value must have properly escaped special characters.',
            { jsonMode: false, preferredModels }
        );

        // Try to extract JSON from the text
        let jsonStr = textFallback.trim();
        // Strip ```json blocks
        if (jsonStr.startsWith('```')) {
            const lines = jsonStr.split('\n');
            if (lines[0].startsWith('```')) lines.shift();
            if (lines[lines.length - 1].startsWith('```')) lines.pop();
            jsonStr = lines.join('\n').trim();
        }
        // Find the outermost JSON object
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        // Try direct parse first, then repaired parse
        try {
            return JSON.parse(jsonStr);
        } catch {
            return JSON.parse(repairJSON(jsonStr));
        }
    } catch (e3) {
        console.error('[MedEduAI AI] All 3 layers of JSON parsing failed. Raw text snippet:', text.substring(0, 500));
        throw new Error(`JSON parsing failed after all recovery attempts: ${(e3 as Error).message}`);
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
