/**
 * POST /api/creator/batch-start
 *
 * Enqueues a list of topics as background generation jobs in the creator_jobs
 * Supabase table. Returns immediately with a batch_id so the client can:
 *   1. Close the browser (jobs persist in DB)
 *   2. Poll /api/creator/batch-status?batchId=xxx for progress
 *   3. Drive processing via /api/creator/batch-process
 *
 * Auth: x-admin-secret header (no JWT expiry risk)
 */

import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

interface TopicJob {
    topicId: string;          // local client-side ID (for UI correlation)
    topicName: string;
    sectionName: string;
    courseName: string;
    subjectName: string;
    lmsStructure: any[];
    version?: string;
}

export async function POST(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { topics, courseName, subjectName, lmsStructure, version } = body as {
            topics: TopicJob[];
            courseName?: string;
            subjectName?: string;
            lmsStructure?: any[];
            version?: string;
        };

        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            return NextResponse.json({ success: false, error: 'topics array is required and must not be empty' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const batchId = randomUUID();
        const now = new Date().toISOString();

        // ── Ensure the creator_jobs table exists ──
        // (migration should handle this, but we guard gracefully)
        const jobRows = topics.map((t) => ({
            batch_id: batchId,
            status: 'pending',
            client_topic_id: t.topicId || null,
            course_name: t.courseName || courseName || '',
            subject_name: t.subjectName || subjectName || '',
            section_name: t.sectionName || '',
            topic_name: t.topicName,
            lms_structure: t.lmsStructure || lmsStructure || [],
            version: t.version || version || new Date().getFullYear().toString(),
            attempt_count: 0,
            created_at: now,
            updated_at: now,
        }));

        const { data, error } = await supabase
            .from('creator_jobs')
            .insert(jobRows)
            .select('id, topic_name, status');

        if (error) {
            console.error('[Batch Start] DB insert error:', error.message);
            return NextResponse.json({
                success: false,
                error: `Failed to enqueue jobs: ${error.message}. Make sure the creator_jobs table exists (run migration SQL).`,
            }, { status: 500 });
        }

        console.log(`[Batch Start] ✅ Enqueued ${jobRows.length} jobs for batch ${batchId}`);

        return NextResponse.json({
            success: true,
            batchId,
            jobCount: jobRows.length,
            jobs: data,
        });

    } catch (err: any) {
        console.error('[Batch Start] Error:', err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
