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
    primary:   'gemini-2.5-flash',  // Confirmed working ✅
    secondary: 'gemini-2.5-pro',    // Confirmed working ✅ (higher intelligence)
    tertiary:  'gemini-2.5-pro',    // Same — last resort
    ultimate:  'gemini-2.5-pro',    // Same — final fallback
} as const;

// Errors that warrant retrying the SAME model (transient)
const RETRYABLE_CODES = new Set([429, 503, 502, 504, 500]);

// Errors that mean the model is GONE (deprecated/removed) — skip immediately
// Common HTTP status codes to skip model and try next immediately
const PERMANENT_SKIP_CODES = new Set([404, 400, 401, 403]);

// Safety threshold for model generation
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

/** Sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to convert base64 data URLs to Gemini's inlineData format
 */
function formatImagePart(base64DataUrl: string) {
    const match = base64DataUrl.match(/^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/);
    if (!match) return null;
    return {
        inlineData: {
            mimeType: match[1],
            data: match[2],
        },
    };
}

/**
 * Smart Gemini content generation with automatic model fallback.
 * - Retries transient errors (429, 503, 502, 504) with exponential backoff
 * - Falls back to the next model after exhausting retries
 * - Skips to the next model immediately on permanent errors (400, 401, 403)
 * ⚠️  MUST only be called from Next.js API routes (server-side).
 *     Never import or call from client components.
 *
 * Uses the new @google/genai SDK shape:
 *   ai.models.generateContent({ model, contents, config })
 *   response.text   // property, not function
 */
export async function generateWithFallback(
    prompt: string,
    options?: {
        jsonMode?: boolean;
        preferredModels?: string[];
        maxRetries?: number;
        /** Array of base64 data URLs for multimodal analysis */
        images?: string[];
        /** Set true for bulk/creator generation — disables Gemini 2.5 thinking tokens.
         *  Thinking tokens eat into the maxOutputTokens budget and add 5–30s latency per call.
         *  For structured content generation we want speed + full token budget for content.
         *  Default: true — bulk content creator workflows benefit from this.            */
        disableThinking?: boolean;
        /** Optional per-call timeout in ms. Default 120000 (2 min). */
        timeoutMs?: number;
    }
): Promise<string> {
    const models = options?.preferredModels || [
        MODELS.primary,
        MODELS.secondary,
        MODELS.tertiary,
        MODELS.ultimate,
    ];

    // ── Prepare contents (standardized parts format for new SDK) ──
    const parts: any[] = [{ text: prompt }];

    if (options?.images && options.images.length > 0) {
        const imageParts = options.images.map(formatImagePart).filter(Boolean);
        if (imageParts.length > 0) {
            parts.push(...imageParts);
        }
    }

    const contents: any[] = [{ role: 'user', parts }];

    // ── Output token limits ──
    const config: Record<string, any> = {
        maxOutputTokens: 65536,
        safetySettings: SAFETY_SETTINGS,
    };
    if (options?.jsonMode) config.responseMimeType = 'application/json';
    // Disable thinking tokens to reduce latency (especially for batch operations).
    // gemini-2.5-flash supports thinkingBudget:0 to skip reasoning steps.
    const shouldDisableThinking = options?.disableThinking !== false;
    if (shouldDisableThinking) {
        config.thinkingConfig = { thinkingBudget: 0 };
    }

    const maxRetries = options?.maxRetries ?? 4;
    const timeoutMs = options?.timeoutMs ?? 120000;

    let lastError: Error | null = null;

    for (const model of models) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const ai = getAI();
                // ── New SDK shape: ai.models.generateContent({...}) ──
                // Wrap in a per-call timeout so the whole creator batch never
                // hangs indefinitely on a model that has gone silent.
                const callPromise = ai.models.generateContent({
                    model,
                    contents,
                    config,
                });

                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error(`GEMINI_CALL_TIMEOUT (${timeoutMs}ms) on model=${model}`)), timeoutMs);
                });

                const response: any = await Promise.race([callPromise, timeoutPromise]);

                // ── Detect safety blocks ──
                const finishReason = response?.candidates?.[0]?.finishReason;
                if (finishReason === 'SAFETY' || finishReason === 'BLOCKED_REASON_BLOCKLIST' || finishReason === 'PROHIBITED_CONTENT') {
                    console.warn(`[MedEduAI AI] Model ${model} blocked by safety filters (${finishReason}).`);
                    throw new Error('CONTENT_BLOCKED_BY_SAFETY');
                }

                // text is a PROPERTY (string | undefined) in the new SDK, not a function.
                const text: string = (response?.text ?? '') || (options?.jsonMode ? '{}' : '');

                if (!text && !options?.jsonMode) {
                    throw new Error('EMPTY_RESPONSE_FROM_AI');
                }

                console.log(`[MedEduAI AI] ✅ model=${model} succeeded (attempt ${attempt}, ${text.length} chars)`);
                return text;
            } catch (e: any) {
                lastError = e;
                const httpCode: number = e?.status ?? e?.code ?? 0;

                if (e.message === 'CONTENT_BLOCKED_BY_SAFETY') {
                    console.error(`[MedEduAI AI] Model ${model} failed due to safety filters. Trying next model.`);
                    break;
                }

                // Timeouts on a model that hung mid-response → treat as transient
                const isTimeout = typeof e?.message === 'string' && e.message.includes('GEMINI_CALL_TIMEOUT');
                const isRetryable = isTimeout
                    || RETRYABLE_CODES.has(httpCode)
                    || e?.message?.includes('503')
                    || e?.message?.includes('UNAVAILABLE')
                    || e?.message?.includes('429')
                    || e?.message?.includes('RESOURCE_EXHAUSTED')
                    || e?.message?.includes('DEADLINE_EXCEEDED');

                console.warn(
                    `[MedEduAI AI] model=${model} attempt=${attempt} failed — httpCode=${httpCode} retryable=${isRetryable} — ${e.message}`
                );

                if (!isRetryable || PERMANENT_SKIP_CODES.has(httpCode)) {
                    console.error(`[MedEduAI AI] Permanent error (${httpCode}) on model=${model}, skipping to next model.`);
                    break;
                }

                if (attempt === maxRetries) {
                    console.warn(`[MedEduAI AI] model=${model} exhausted all retries, trying next model.`);
                    break;
                }

                const baseDelay = httpCode === 429 ? 5000 : (httpCode === 503 ? 2000 : 1000);
                const backoffMs = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000, 30000);
                console.log(`[MedEduAI AI] Retrying model=${model} in ${Math.round(backoffMs / 1000)}s (httpCode=${httpCode})…`);
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

    // 3. Handle unquoted keys (Gemini sometimes does this for short keys)
    // This is a bit risky but helps for common cases like { key: "value" }
    result = result.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

    return result;
}

/**
 * Generate structured JSON content with automatic parsing
 * and robust multi-layer error recovery.
 */
export async function generateJSON<T = any>(
    prompt: string,
    options?: {
        jsonMode?: boolean;
        preferredModels?: string[];
        maxRetries?: number;
        images?: string[];
        disableThinking?: boolean;
    }
): Promise<T> {
    const text = await generateWithFallback(prompt, {
        ...options,
        jsonMode: true,
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
            { jsonMode: false, preferredModels: options?.preferredModels, images: options?.images }
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
    preferredModels?: string[],
    disableThinking?: boolean,
): Promise<string> {
    return generateWithFallback(prompt, {
        jsonMode: false,
        preferredModels,
        disableThinking,
    });
}

// ── Re-export the models and AI instance for advanced usage ──
export { getAI, MODELS, repairJSON };

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
