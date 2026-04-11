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

// Model hierarchy – compatible with both Vertex AI and AI Studio
const MODELS = {
    primary: 'gemini-2.5-flash',       // Primary: fast, stable, widely available
    secondary: 'gemini-2.5-flash',     // Fallback 1: proven stable
    tertiary: 'gemini-2.5-flash',        // Fallback 2: highest quality
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
        maxRetries?: number;
    }
): Promise<string> {
    const models = options?.preferredModels || [MODELS.primary, MODELS.secondary, MODELS.tertiary];
    const config = options?.jsonMode ? { responseMimeType: 'application/json' as const } : undefined;
    const maxRetries = options?.maxRetries ?? 3;

    let lastError: Error | null = null;

    for (const model of models) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await getAI().models.generateContent({
                    model,
                    contents: prompt,
                    ...(config ? { config } : {}),
                });
                return response.text || (options?.jsonMode ? '{}' : '');
            } catch (e: any) {
                console.error(`[MedEduAI AI] Model ${model} failed (attempt ${attempt}/${maxRetries}): ${e.message}`, { status: e.status, code: e.code });
                lastError = e;
                
                // If it's the last attempt for this model, break and try the next model
                if (attempt === maxRetries) {
                    break;
                }
                
                // Exponential backoff: 1s, 2s, 4s...
                const backoffMs = Math.pow(2, attempt - 1) * 1000 + (Math.random() * 500); 
                console.log(`[MedEduAI AI] Retrying in ${Math.round(backoffMs)}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
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
