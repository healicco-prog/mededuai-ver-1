/**
 * POST /api/creator/batch-retry
 *
 * Resets every `failed` job in a batch back to `pending` and clears their
 * attempt_count so the batch-process loop can pick them up fresh. Used by
 * the "Retry Failed" button on the Generation Engine.
 *
 * Auth: x-admin-secret header.
 */

import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const maxDuration = 30;

export async function POST(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    try {
        const { batchId } = await req.json() as { batchId: string };
        if (!batchId) {
            return NextResponse.json({ success: false, error: 'batchId is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data: resetRows, error } = await supabase
            .from('creator_jobs')
            .update({
                status: 'pending',
                attempt_count: 0,
                error_message: null,
                updated_at: new Date().toISOString(),
            })
            .eq('batch_id', batchId)
            .eq('status', 'failed')
            .select('id');

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const resetCount = resetRows?.length || 0;
        console.log(`[Batch Retry] Reset ${resetCount} failed job(s) in batch ${batchId}`);

        return NextResponse.json({ success: true, resetCount });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

