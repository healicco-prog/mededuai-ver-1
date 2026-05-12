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

export const maxDuration = 300;

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

        // First, recover any stale "processing" jobs (stuck > 10 min = server crashed mid-job)
        const staleThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        await supabase
            .from('creator_jobs')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('batch_id', batchId)
            .eq('status', 'processing')
            .lt('updated_at', staleThreshold);

        // Find next pending job
        const { data: job, error: fetchErr } = await supabase
            .from('creator_jobs')
            .select('*')
            .eq('batch_id', batchId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (fetchErr) {
            return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
        }

        // No pending jobs — check if batch is fully done
        if (!job) {
            const { data: remaining } = await supabase
                .from('creator_jobs')
                .select('status')
                .eq('batch_id', batchId);
            const allDone = remaining?.every(j => j.status === 'completed' || j.status === 'failed');
            return NextResponse.json({ success: true, done: true, allCompleted: allDone });
        }

        // Claim the job
        await supabase
            .from('creator_jobs')
            .update({ status: 'processing', attempt_count: (job.attempt_count || 0) + 1, updated_at: new Date().toISOString() })
            .eq('id', job.id);

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
            const errMsg = genErr?.message || 'Generation error';
            await supabase
                .from('creator_jobs')
                .update({ status: 'failed', error_message: errMsg, updated_at: new Date().toISOString() })
                .eq('id', job.id);
            return NextResponse.json({ success: false, done: false, jobId: job.id, topicName: job.topic_name, status: 'failed', error: errMsg });
        }

        if (!genResult.success || !genResult.generatedNotes) {
            const errMsg = genResult.error || 'Generation returned no content';
            await supabase
                .from('creator_jobs')
                .update({ status: 'failed', error_message: errMsg, updated_at: new Date().toISOString() })
                .eq('id', job.id);
            return NextResponse.json({ success: false, done: false, jobId: job.id, topicName: job.topic_name, status: 'failed', error: errMsg });
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
