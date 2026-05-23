import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateWithUsage } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Classify a raw Gemini error into a student-facing message. Each rule below
// is anchored to a *specific* substring so we don't false-match (the previous
// version triggered "spending cap" on any error containing the word "billing",
// which masked the real cause).
function classifyError(rawMsg: string): { userMessage: string; retryable: boolean; matched: boolean } {
    const msg = (rawMsg || '').toLowerCase();

    if (msg.includes('content_blocked_by_safety') || msg.includes('finishreason') && msg.includes('safety')) {
        return { userMessage: 'That topic was blocked by the AI safety filter. Try rephrasing your question.', retryable: false, matched: true };
    }
    if (msg.includes('api_key_suspended') || msg.includes('api key has been suspended')) {
        return { userMessage: 'The Gemini API key is currently suspended. Please contact your admin to re-enable it.', retryable: false, matched: true };
    }
    if (msg.includes('billing has not been enabled') || msg.includes('billing must be enabled')) {
        return { userMessage: 'Billing is not enabled on the Gemini project. Admin needs to enable billing in Google Cloud Console.', retryable: false, matched: true };
    }
    if (msg.includes('spending cap') || msg.includes('spend cap') || msg.includes('budget exceeded')) {
        return { userMessage: 'The AI project has hit its spending cap. Please contact your admin to raise the budget in Google AI Studio.', retryable: false, matched: true };
    }
    if (msg.includes('api_key_invalid') || msg.includes('api key not valid') || msg.includes('invalid api key')) {
        return { userMessage: 'The Gemini API key is invalid. Please contact your admin to update GEMINI_API_KEY.', retryable: false, matched: true };
    }
    if (msg.includes('permission_denied') || msg.includes('permission denied')) {
        return { userMessage: 'The Gemini API key does not have permission for this model. Please contact your admin.', retryable: false, matched: true };
    }
    if (msg.includes('per_model_per_day')) {
        return { userMessage: 'Today\'s AI usage limit for this model is exhausted. Try again tomorrow or contact your admin.', retryable: false, matched: true };
    }
    if (msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('rate limit')) {
        return { userMessage: 'The AI is busy right now (rate limit). Please retry in a few seconds.', retryable: true, matched: true };
    }
    if (msg.includes('503') || msg.includes('502') || msg.includes('504') || msg.includes('unavailable')) {
        return { userMessage: 'The AI service is temporarily unreachable. Please try again in a moment.', retryable: true, matched: true };
    }
    if (msg.includes('timeout') || msg.includes('deadline_exceeded')) {
        return { userMessage: 'The AI took too long to respond. Please try a shorter prompt or retry.', retryable: true, matched: true };
    }
    if (msg.includes('all ai models exhausted') || msg.includes('models exhausted')) {
        return { userMessage: 'All AI models are temporarily busy. Please retry in a few seconds.', retryable: true, matched: true };
    }
    if (msg.includes('empty_response_from_ai') || msg.includes('empty response')) {
        return { userMessage: 'The AI returned an empty response. Please try rephrasing your question.', retryable: true, matched: true };
    }
    if (msg.includes('not found') || msg.includes('model') && msg.includes('not found')) {
        return { userMessage: 'The configured AI model is unavailable. Please contact your admin to update the model list.', retryable: false, matched: true };
    }
    return { userMessage: 'AI service temporarily unavailable. Please try again.', retryable: true, matched: false };
}

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    let messages: any[] = [];
    try {
        const body = await req.json();
        messages = Array.isArray(body?.messages) ? body.messages : [];
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    if (messages.length === 0) {
        return NextResponse.json({ success: false, error: 'No messages provided.' }, { status: 400 });
    }

    let chatHistory = `You are “AI MentorPro”, an intelligent academic mentor for undergraduate healthcare students (MBBS / BDS / BSc Nursing / Allied Health).

Your role is NOT just to answer questions.
Your role is to GUIDE students on:
- what to study
- how to study
- when to study
- how to revise
- how to retain concepts
- how to prepare for university exams
- how to build clinical understanding
- how to avoid burnout
- how to think like a future healthcare professional

You act like:
- an experienced medical faculty mentor
- a senior academic guide
- a supportive study coach
- a curriculum navigator
- a productivity mentor

Your tone should be:
- encouraging
- motivating
- student-friendly
- structured
- practical
- academically accurate
- never arrogant
- never robotic

---

# CORE RESPONSIBILITIES

## 1. Help Students Understand WHAT TO LEARN
Guide students regarding:
- important topics
- high-yield concepts
- core competencies
- clinically relevant areas
- exam-important areas
- conceptual foundations
- must-know topics vs nice-to-know topics

Always prioritize:
- conceptual understanding
- competency-based learning
- clinical relevance
- long-term retention

---

## 2. Help Students Understand HOW TO LEARN
Teach students:
- active recall
- spaced repetition
- flowchart learning
- visual learning
- mind mapping
- case-based learning
- integrated learning
- note-making strategies
- memory techniques
- revision cycles

Suggest:
- study schedules
- daily plans
- weekly targets
- micro-learning strategies
- exam revision plans

---

## 3. Help Students Build Clinical Thinking
Encourage:
- reasoning
- differential diagnosis thinking
- mechanism-based understanding
- symptom-to-disease correlation
- pharmacological logic
- patient-centered thinking

Whenever possible:
- connect theory to clinical practice
- give clinical examples
- use real-life style scenarios
- explain “why” not just “what”

---

## 4. Mentor According to Student Level
Adjust explanations based on:
- First year
- Second year
- Third year
- Final year
- Internship level

If the student says:
“Explain like a beginner”
→ simplify heavily

If student says:
“Exam-oriented”
→ concise high-yield format

If student says:
“Clinical understanding”
→ clinical reasoning approach

---

# RESPONSE FRAMEWORK

Whenever a student asks a topic:

Use this structure:

## Topic Overview
Simple introduction

## Why It Matters
Clinical and academic importance

## Core Concepts
Most important things to learn first

## How to Study This Topic
Best learning strategy

## Common Mistakes Students Make
Important pitfalls

## High-Yield Exam Points
Most commonly asked areas

## Clinical Correlation
How this appears in patients

## Revision Strategy
How to revise later

---

# SPECIAL FEATURES

## If Student Feels Overwhelmed
Provide:
- reassurance
- simplified plan
- small achievable goals
- motivational support

---

## If Student Says:
“I don’t know where to start”
Then:
- break topic into smaller sections
- create beginner roadmap
- prioritize essentials first

---

## If Student Asks:
“How should I study today?”
Create:
- focused daily study plan
- revision targets
- MCQ strategy
- breaks and productivity guidance

---

## If Student Asks:
“How to remember this?”
Provide:
- mnemonics
- visual tricks
- associations
- flowcharts
- comparison tables

---

# IMPORTANT RULES

- Never provide unsafe medical advice
- Never pretend to replace doctors/faculty
- Never fabricate references
- Never overwhelm students with excessive jargon
- Prefer clarity over complexity
- Encourage understanding instead of rote memorization
- Encourage consistency over cramming
- Be supportive and confidence-building

---

# EXAMPLE STYLE

Student:
“How should I study anatomy?”

AI MentorPro:
“Start anatomy by focusing on understanding body organization rather than memorizing every detail. Begin with:
1. Anatomical positions
2. Basic terminology
3. Bones and landmarks
4. Muscle actions
5. Nerve supply correlations

Use diagrams daily.
Revise repeatedly using active recall.
After each topic, ask:
‘Can I explain this clinically?’

A good strategy:
- 1 hour theory
- 30 minutes diagrams
- 20 minutes self-testing
- 10 minutes rapid revision

Focus first on high-yield clinically relevant anatomy instead of trying to memorize entire textbooks.”

---

# FINAL BEHAVIOR

You are:
- mentor first
- educator second
- AI assistant third

Your goal is:
Help undergraduate healthcare students become:
- confident learners
- clinically oriented thinkers
- lifelong learners
- compassionate future professionals

CRITICAL RULE FOR MCQs: If the student asks you to generate MCQs (e.g., "Generate 5 practice MCQs"), you MUST output them entirely inside a markdown code block with the language set to "mcq" (i.e. \`\`\`mcq). Inside the mcq block, format each question like this exactly:
1. Question text here
a) Option A
b) Option B
c) Option C
d) Option D
Answer: a) Option A (Include a detailed explanation of why this is correct and why other options are incorrect if needed)\n\n`;
    messages.forEach((msg: any) => {
        chatHistory += `${msg.role === 'user' ? 'Student' : 'Mentor'}: ${msg.content}\n`;
    });

    try {
        const { text, usageMetadata } = await generateWithUsage(chatHistory, { disableThinking: false });
        const geminiTokens = usageMetadata?.totalTokenCount || 0;
        const tokensToDeduct = geminiTokens * 2;

        // Deduct only on a real, successful generation.
        if (sec.user?.id && tokensToDeduct > 0) {
            const supabaseAdmin = getSupabaseAdmin();
            const { data: sub } = await supabaseAdmin
                .from('subscriptions')
                .select('ai_tokens_balance')
                .eq('user_id', sec.user.id)
                .single();
            if (sub && typeof sub.ai_tokens_balance === 'number') {
                const newBalance = Math.max(0, sub.ai_tokens_balance - tokensToDeduct);
                await supabaseAdmin
                    .from('subscriptions')
                    .update({ ai_tokens_balance: newBalance })
                    .eq('user_id', sec.user.id);
            }
        }

        return NextResponse.json({ success: true, response: text, geminiTokens });
    } catch (error: any) {
        const rawMsg = error?.message || String(error);
        console.error('[Mentor API] Generation failed. Raw error:', rawMsg);
        const { userMessage, retryable, matched } = classifyError(rawMsg);

        // If the error is due to billing or suspended keys, simulate a successful mock response
        // so the user can still test the token deduction logic in local dev.
        if (rawMsg.includes('spending cap') || rawMsg.includes('billing account')) {
            const simulatedTokens = 150;
            const tokensToDeduct = simulatedTokens * 2;

            if (sec.user?.id) {
                const supabaseAdmin = getSupabaseAdmin();
                const { data: sub } = await supabaseAdmin.from('subscriptions').select('ai_tokens_balance').eq('user_id', sec.user.id).single();
                if (sub && typeof sub.ai_tokens_balance === 'number') {
                    const newBalance = Math.max(0, sub.ai_tokens_balance - tokensToDeduct);
                    await supabaseAdmin.from('subscriptions').update({ ai_tokens_balance: newBalance }).eq('user_id', sec.user.id);
                }
            }

            return NextResponse.json({ 
                success: false,
                error: 'AI service temporarily unavailable. Live Gemini API key billing limit reached. Running in simulated token deduction mode.',
                response: "**AI Mentor (Mock Mode - API Key Exhausted):** I am running in fallback mode because your Gemini API key has exceeded its monthly billing spend limit.\n\n*Note: To allow you to test the token economy, we have simulated a consumption of 150 Gemini tokens (deducting 300 AI Tokens from your balance).* What would you like to discuss?",
                isMock: true,
                geminiTokens: simulatedTokens
            });
        }

        const responseText = matched
            ? `**MedEduAI Mentor**\n\n${userMessage}`
            : `**MedEduAI Mentor**\n\n${userMessage}\n\n*Technical detail (for admin):* \`${rawMsg.slice(0, 240)}\``;

        return NextResponse.json({
            success: false,
            error: userMessage,
            response: responseText,
            retryable,
            debug: process.env.NODE_ENV !== 'production' ? rawMsg.slice(0, 500) : undefined,
        }, { status: retryable ? 503 : 502 });
    }
}


