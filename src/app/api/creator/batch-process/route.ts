/**
 * POST /api/creator/batch-process
 *
 * Claims and processes the NEXT pending job from creator_jobs for a given batch.
 * - Uses x-admin-secret auth — no JWT expiry risk.
 * - Runs entirely server-side (Cloud Run / Vercel) — browser can be closed.
 * - maxDuration = 300s (covers one full topic generation including top-up rounds).
 * - Inlines save-to-DB logic (no internal HTTP round-trip needed).
 *
 * Returns: { success, done, jobId, topicName, status, remaining }
 *   done: true when no pending jobs remain in the batch
 */

import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateTopicContent } from '@/lib/creatorEngine';

export const maxDuration = 900;

// Total attempts (including the first) a job gets before being permanently marked failed.
const MAX_ATTEMPTS = 3;

/**
 * Classifies a generation error so transient ones (Gemini 429/503, timeouts,
 * empty responses, exhausted-model-chain) can be retried automatically, while
 * permanent ones (safety filter, parse failure) fail fast with a clean message.
 */
function classifyGenerationError(rawMsg: string): { retryable: boolean; cleanMessage: string } {
    const msg = (rawMsg || '').toString();
    const lower = msg.toLowerCase();

    if (lower.includes('content_blocked_by_safety') || lower.includes('safety') || lower.includes('prohibited')) {
        return { retryable: false, cleanMessage: 'Blocked by AI safety filter — content cannot be generated for this topic.' };
    }
    if (lower.includes('could not be parsed') || lower.includes('parse')) {
        return { retryable: false, cleanMessage: 'AI output could not be parsed into the expected section structure.' };
    }
    if (lower.includes('invalid_argument') || lower.includes('budget 0 is invalid')) {
        return { retryable: false, cleanMessage: 'AI model configuration mismatch — please contact support.' };
    }
    if (lower.includes('gemini_call_timeout') || lower.includes('deadline_exceeded') || lower.includes('timeout')) {
        return { retryable: true, cleanMessage: 'Generation timed out — will retry automatically.' };
    }
    if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('rate')) {
        return { retryable: true, cleanMessage: 'AI rate limit hit — will retry automatically.' };
    }
    if (lower.includes('503') || lower.includes('502') || lower.includes('504') || lower.includes('unavailable')) {
        return { retryable: true, cleanMessage: 'AI service temporarily unavailable — will retry automatically.' };
    }
    if (lower.includes('empty_response_from_ai') || lower.includes('empty response')) {
        return { retryable: true, cleanMessage: 'AI returned an empty response — will retry automatically.' };
    }
    if (lower.includes('all ai models exhausted') || lower.includes('models exhausted')) {
        // First time we hit this we still retry once — the next attempt might land on
        // a freshly-recovered model. After MAX_ATTEMPTS the outer guard fails it.
        return { retryable: true, cleanMessage: 'All AI models were busy — will retry automatically.' };
    }
    if (lower.includes('api_key_suspended') || lower.includes('suspended')) {
        return { retryable: false, cleanMessage: 'Gemini API key is suspended. Please update GEMINI_API_KEY in Cloud Run.' };
    }
    if (lower.includes('spending cap') || lower.includes('spend cap')) {
        return { retryable: false, cleanMessage: 'AI Project spending cap exceeded. Please increase cap in AI Studio.' };
    }
    return { retryable: false, cleanMessage: msg.slice(0, 240) };
}

/**
 * Handles a generation failure: if the error is transient and the job hasn't
 * exhausted MAX_ATTEMPTS, returns the job to the `pending` queue so the next
 * batch-process tick picks it up. Otherwise marks it permanently `failed`
 * with a cleaned-up error message. Always returns a JSON response so the
 * outer route can simply `return await handleGenerationFailure(...)`.
 */
async function handleGenerationFailure(
    supabase: ReturnType<typeof getSupabaseAdmin>,
    batchId: string,
    job: any,
    rawError: string
) {
    const { retryable, cleanMessage } = classifyGenerationError(rawError);
    const attemptCount = job.attempt_count || 1;
    const willRetry = retryable && attemptCount < MAX_ATTEMPTS;

    if (willRetry) {
        const retryMessage = `${cleanMessage} (attempt ${attemptCount}/${MAX_ATTEMPTS})`;
        await supabase
            .from('creator_jobs')
            .update({
                status: 'pending',
                error_message: retryMessage,
                updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
        console.warn(`[Batch Process] ↻ Retrying "${job.topic_name}" (attempt ${attemptCount}/${MAX_ATTEMPTS}): ${cleanMessage}`);
    } else {
        await supabase
            .from('creator_jobs')
            .update({
                status: 'failed',
                error_message: cleanMessage,
                updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
        console.error(`[Batch Process] ✗ Permanently failed "${job.topic_name}" after ${attemptCount} attempt(s): ${cleanMessage}`);
    }

    const { count: remainingCount } = await supabase
        .from('creator_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('batch_id', batchId)
        .eq('status', 'pending');

    const isRateLimit = cleanMessage.includes('rate limit') || cleanMessage.includes('exhausted');
    const isDaily = cleanMessage.includes('per_model_per_day');

    return NextResponse.json({
        success: true,
        done: (remainingCount || 0) === 0,
        jobId: job.id,
        clientTopicId: job.client_topic_id,
        topicName: job.topic_name,
        status: willRetry ? 'pending' : 'failed',
        willRetry,
        isRateLimit,
        isDaily,
        attemptCount,
        error: cleanMessage,
        remaining: remainingCount || 0,
    });
}

export async function POST(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    try {
        const { batchId } = await req.json() as { batchId: string };
        if (!batchId) {
            return NextResponse.json({ success: false, error: 'batchId is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // ── Step 1: Claim the next pending job (atomic update to avoid double-processing) ──
        // We do a select + update in sequence. In low-concurrency superadmin use this is safe.
        // For higher concurrency, a DB function with FOR UPDATE SKIP LOCKED would be better.

        // Recover any stale "processing" jobs (stuck > 4 min — slightly over the
        // 300s maxDuration so a Cloud-Run-killed job becomes claimable again
        // quickly instead of leaving the batch limping for the full 10 min).
        const staleThreshold = new Date(Date.now() - 4 * 60 * 1000).toISOString();
        await supabase
            .from('creator_jobs')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('batch_id', batchId)
            .eq('status', 'processing')
            .lt('updated_at', staleThreshold);

        // Find pending candidates
        const { data: candidates, error: fetchErr } = await supabase
            .from('creator_jobs')
            .select('*')
            .eq('batch_id', batchId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(5);

        if (fetchErr) {
            return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
        }

        // No pending jobs. The batch is only truly done when nothing is still
        // `processing` either — otherwise a job killed mid-flight by Cloud Run
        // would let the client loop exit prematurely while the stale-recovery
        // query hasn't yet had time to reset it to pending.
        if (!candidates || candidates.length === 0) {
            const { data: remaining } = await supabase
                .from('creator_jobs')
                .select('status')
                .eq('batch_id', batchId);
            const processingCount = remaining?.filter(j => j.status === 'processing').length || 0;
            const allDone = remaining?.every(j => j.status === 'completed' || j.status === 'failed') ?? false;

            if (!allDone && processingCount > 0) {
                // Tell the client to wait a bit before polling again — stale
                // recovery will reclaim the stuck job on a future tick.
                return NextResponse.json({
                    success: true,
                    done: false,
                    waitingForStaleRecovery: true,
                    processingCount,
                });
            }

            return NextResponse.json({ success: true, done: true, allCompleted: allDone });
        }

        // Atomically try to claim a job from the candidates
        let claimedJob = null;
        for (const cand of candidates) {
            const { data: updatedRows } = await supabase
                .from('creator_jobs')
                .update({ status: 'processing', attempt_count: (cand.attempt_count || 0) + 1, updated_at: new Date().toISOString() })
                .eq('id', cand.id)
                .eq('status', 'pending')
                .select()
                .maybeSingle();

            if (updatedRows) {
                claimedJob = updatedRows;
                break;
            }
        }

        if (!claimedJob) {
            // Another serverless worker simultaneously claimed all candidates. Return skippedClaim so client safely retries.
            return NextResponse.json({ success: true, done: false, skippedClaim: true });
        }

        const job = claimedJob;
        console.log(`[Batch Process] Processing job ${job.id} — "${job.topic_name}" (batch: ${batchId})`);

        // ── Step 2: Generate content ──
        let genResult;
        try {
            genResult = await generateTopicContent({
                courseName: job.course_name,
                subjectName: job.subject_name,
                sectionName: job.section_name || '',
                topicName: job.topic_name,
                lmsStructure: job.lms_structure || [],
            });
        } catch (genErr: any) {
            return await handleGenerationFailure(supabase, batchId, job, genErr?.message || 'Generation error');
        }

        if (!genResult.success || !genResult.generatedNotes) {
            return await handleGenerationFailure(supabase, batchId, job, genResult.error || 'Generation returned no content');
        }

        const { generatedNotes } = genResult;

        // ── Step 3: Save generated content to lms_content ──
        try {
            await saveTopicToDb({
                supabase,
                courseName: job.course_name,
                subjectName: job.subject_name,
                sectionName: job.section_name || 'General',
                topicName: job.topic_name,
                generatedNotes,
                version: job.version || new Date().getFullYear().toString(),
            });
        } catch (saveErr: any) {
            console.error(`[Batch Process] Save failed for "${job.topic_name}":`, saveErr.message);
            // Don't fail the job — mark as completed with a save warning
            await supabase
                .from('creator_jobs')
                .update({
                    status: 'completed',
                    result: generatedNotes,
                    error_message: `Content generated but DB save failed: ${saveErr.message}`,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', job.id);

            // Count remaining
            const { count: remainingCount } = await supabase
                .from('creator_jobs')
                .select('id', { count: 'exact', head: true })
                .eq('batch_id', batchId)
                .eq('status', 'pending');

            return NextResponse.json({
                success: true,
                done: (remainingCount || 0) === 0,
                jobId: job.id,
                clientTopicId: job.client_topic_id,
                topicName: job.topic_name,
                status: 'completed',
                saveWarning: saveErr.message,
                remaining: remainingCount || 0,
                generatedNotes,
            });
        }

        // ── Step 4: Mark job as completed ──
        await supabase
            .from('creator_jobs')
            .update({
                status: 'completed',
                result: generatedNotes,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);

        // Count remaining pending jobs
        const { count: remainingCount } = await supabase
            .from('creator_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('batch_id', batchId)
            .eq('status', 'pending');

        console.log(`[Batch Process] ✅ Completed "${job.topic_name}" — ${remainingCount || 0} jobs remaining`);

        return NextResponse.json({
            success: true,
            done: (remainingCount || 0) === 0,
            jobId: job.id,
            clientTopicId: job.client_topic_id,
            topicName: job.topic_name,
            status: 'completed',
            remaining: remainingCount || 0,
            generatedNotes,
        });

    } catch (err: any) {
        console.error('[Batch Process] Unhandled error:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ── Inline save logic (mirrors /api/creator/save but without HTTP round-trip) ──
async function saveTopicToDb({
    supabase,
    courseName,
    subjectName,
    sectionName,
    topicName,
    generatedNotes,
    version,
}: {
    supabase: ReturnType<typeof getSupabaseAdmin>;
    courseName: string;
    subjectName: string;
    sectionName: string;
    topicName: string;
    generatedNotes: Record<string, string>;
    version: string;
}) {
    // Resolve or create course
    let { data: courseRow } = await supabase.from('courses').select('id').eq('name', courseName).maybeSingle();
    if (!courseRow?.id) {
        const { data: newCourse, error } = await supabase.from('courses').insert({ name: courseName }).select('id').single();
        if (error || !newCourse?.id) throw new Error(`Failed to resolve course: ${error?.message}`);
        courseRow = newCourse;
    }

    // Resolve or create subject
    let { data: subjectRow } = await supabase.from('subjects').select('id').eq('name', subjectName).eq('course_id', courseRow.id).maybeSingle();
    if (!subjectRow?.id) {
        const { data: newSubject, error } = await supabase.from('subjects').insert({ name: subjectName, course_id: courseRow.id }).select('id').single();
        if (error || !newSubject?.id) throw new Error(`Failed to resolve subject: ${error?.message}`);
        subjectRow = newSubject;
    }

    // Resolve or create topic
    let topicId: string;
    const { data: existingTopic } = await supabase.from('topics').select('id').eq('name', topicName).eq('subject_id', subjectRow.id).maybeSingle();
    if (existingTopic?.id) {
        topicId = existingTopic.id;
        if (sectionName) await supabase.from('topics').update({ section: sectionName }).eq('id', topicId);
    } else {
        const { data: newTopic, error } = await supabase.from('topics').insert({ name: topicName, subject_id: subjectRow.id, section: sectionName || 'General' }).select('id').single();
        if (error || !newTopic?.id) throw new Error(`Failed to resolve topic: ${error?.message}`);
        topicId = newTopic.id;
    }

    // Build lms_content payload
    const lmsPayload: Record<string, any> = {
        topic_id: topicId,
        last_generated_at: new Date().toISOString(),
        course: courseName,
        subject: subjectName,
        section: sectionName,
        topic: topicName,
        version,
    };
    if (generatedNotes['l1']) lmsPayload['introduction'] = generatedNotes['l1'];
    if (generatedNotes['l2']) lmsPayload['detailed_notes'] = generatedNotes['l2'];
    if (generatedNotes['l3']) lmsPayload['summary'] = generatedNotes['l3'];
    if (generatedNotes['l4'] && generatedNotes['l4'] !== 'None requested.') lmsPayload['marks_10_questions'] = generatedNotes['l4'];
    if (generatedNotes['l5'] && generatedNotes['l5'] !== 'None requested.') lmsPayload['marks_5_questions'] = generatedNotes['l5'];
    if (generatedNotes['l6'] && generatedNotes['l6'] !== 'None requested.') lmsPayload['marks_3_reasoning'] = generatedNotes['l6'];
    if (generatedNotes['l7'] && generatedNotes['l7'] !== 'None requested.') lmsPayload['marks_2_case_mcqs'] = generatedNotes['l7'];
    if (generatedNotes['l8'] && generatedNotes['l8'] !== 'None requested.') lmsPayload['marks_1_mcqs'] = generatedNotes['l8'];
    if (generatedNotes['l9'] && generatedNotes['l9'] !== 'None requested.') lmsPayload['flashcards'] = generatedNotes['l9'];

    const { data: existingLms } = await supabase.from('lms_content').select('id').eq('topic_id', topicId).maybeSingle();

    const trySave = async (payload: Record<string, any>) => {
        if (existingLms?.id) {
            return supabase.from('lms_content').update(payload).eq('id', existingLms.id);
        } else {
            return supabase.from('lms_content').insert(payload);
        }
    };

    let { error: saveErr } = await trySave(lmsPayload);
    if (saveErr && (saveErr.message?.includes('column') || saveErr.message?.includes('does not exist'))) {
        // Fall back to core columns only
        const corePayload: Record<string, any> = { topic_id: topicId, last_generated_at: lmsPayload['last_generated_at'] };
        if (lmsPayload['introduction']) corePayload['introduction'] = lmsPayload['introduction'];
        if (lmsPayload['detailed_notes']) corePayload['detailed_notes'] = lmsPayload['detailed_notes'];
        if (lmsPayload['summary']) corePayload['summary'] = lmsPayload['summary'];
        if (lmsPayload['flashcards']) corePayload['flashcards'] = lmsPayload['flashcards'];
        const { error: coreErr } = await trySave(corePayload);
        if (coreErr) throw new Error(`lms_content save failed: ${coreErr.message}`);
    } else if (saveErr) {
        throw new Error(`lms_content save failed: ${saveErr.message}`);
    }

    // Save assessment questions
    const assessmentSources = [
        { key: 'l4', marks: 10, type: 'essay' },
        { key: 'l5', marks: 5, type: 'essay' },
        { key: 'l6', marks: 3, type: 'short-answer' },
        { key: 'l7', marks: 2, type: 'case-based' },
        { key: 'l8', marks: 1, type: 'mcq' },
    ];
    const assessmentsToInsert: any[] = [];
    for (const src of assessmentSources) {
        const raw = generatedNotes[src.key];
        if (!raw || raw === 'None requested.') continue;
        const questions = raw.split(/\n(?=\d+\.\s)/).map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(q => q.length > 10);
        for (const q of questions) {
            let questionText = q;
            let correct_answer: string | null = null;
            if (src.type === 'mcq') {
                const answerMatch = q.match(/Answer:\s*(.+)/i);
                if (answerMatch) { correct_answer = answerMatch[1].trim(); questionText = q.replace(/Answer:\s*.+/i, '').trim(); }
            }
            assessmentsToInsert.push({ topic_id: topicId, marks: src.marks, question_text: questionText, question_type: src.type, ...(correct_answer ? { correct_answer } : {}) });
        }
    }
    if (assessmentsToInsert.length > 0) {
        await supabase.from('assessments').delete().eq('topic_id', topicId);
        await supabase.from('assessments').insert(assessmentsToInsert);
    }
}

