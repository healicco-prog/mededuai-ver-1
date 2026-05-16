/**
 * GET /api/creator/batch-status?batchId=xxx
 *
 * Returns the current status of all jobs in a batch.
 * Used by the UI to poll progress and decide whether to keep processing.
 *
 * Auth: x-admin-secret header (no JWT expiry risk)
 */

import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 15;

export async function GET(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    const url = new URL(req.url);
    const batchId = url.searchParams.get('batchId');

    if (!batchId) {
        return NextResponse.json({ success: false, error: 'batchId query param is required' }, { status: 400 });
    }

    try {
        const supabase = getSupabaseAdmin();

        const { data: jobs, error } = await supabase
            .from('creator_jobs')
            .select('id, status, topic_name, section_name, client_topic_id, error_message, completed_at, created_at, attempt_count')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!jobs || jobs.length === 0) {
            return NextResponse.json({ success: false, error: 'Batch not found or has no jobs' }, { status: 404 });
        }

        const counts = {
            total: jobs.length,
            pending: jobs.filter(j => j.status === 'pending').length,
            processing: jobs.filter(j => j.status === 'processing').length,
            completed: jobs.filter(j => j.status === 'completed').length,
            failed: jobs.filter(j => j.status === 'failed').length,
        };

        const isDone = counts.pending === 0 && counts.processing === 0;
        const progressPercent = counts.total > 0
            ? Math.round(((counts.completed + counts.failed) / counts.total) * 100)
            : 0;

        return NextResponse.json({
            success: true,
            batchId,
            ...counts,
            isDone,
            progressPercent,
            jobs: jobs.map(j => ({
                id: j.id,
                status: j.status,
                topicName: j.topic_name,
                sectionName: j.section_name,
                clientTopicId: j.client_topic_id,
                errorMessage: j.error_message,
                completedAt: j.completed_at,
                attemptCount: j.attempt_count,
            })),
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

