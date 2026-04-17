import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/creator/db-migrate
 * Adds missing columns to lms_content on the old Supabase schema.
 * Safe to run multiple times — uses IF NOT EXISTS logic by testing column presence first.
 * Called once from the Creator UI when the DB test shows missing columns.
 */
export async function POST() {
    try {
        const supabase = getSupabaseAdmin();
        const results: string[] = [];

        // We can't run raw DDL via the JS client, but we CAN work around it:
        // Strategy: try inserting a dummy row with the new columns; if it fails,
        // we detect the missing column. We then use Supabase's rpc() if available,
        // or we insert with only what exists.
        //
        // The real migration must be run in Supabase SQL editor.
        // This endpoint returns the exact SQL to run.

        const migrationSQL = `
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}/sql

ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_10_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_5_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_reasoning TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_case_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS ppt_content JSONB;

-- Add unique constraint on topic_id if missing (needed for upserts):
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lms_content_topic_id_key'
    ) THEN
        ALTER TABLE public.lms_content ADD CONSTRAINT lms_content_topic_id_key UNIQUE (topic_id);
    END IF;
END $$;

-- Make sure superadmin can write to lms_content:
DROP POLICY IF EXISTS teacher_write_lms ON public.lms_content;
CREATE POLICY teacher_write_lms ON public.lms_content
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid())
        IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
        OR
        (SELECT role FROM public.profiles WHERE id = auth.uid())
        IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
    );
        `.trim();

        // Test which columns exist
        const { error: col10Err } = await supabase.from('lms_content').select('marks_10_questions').limit(1);
        const { error: pptErr } = await supabase.from('lms_content').select('ppt_content').limit(1);

        const missingColumns = [];
        if (col10Err?.message?.includes('column') || col10Err?.message?.includes('does not exist')) {
            missingColumns.push('marks_10_questions', 'marks_5_questions', 'marks_3_reasoning', 'marks_2_case_mcqs', 'marks_1_mcqs');
        }
        if (pptErr?.message?.includes('column') || pptErr?.message?.includes('does not exist')) {
            missingColumns.push('ppt_content');
        }

        if (missingColumns.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'All required columns already exist. No migration needed.',
                status: 'ALREADY_COMPLETE',
            });
        }

        return NextResponse.json({
            success: false,
            status: 'MIGRATION_REQUIRED',
            missingColumns,
            message: `Missing columns: ${missingColumns.join(', ')}. Run the SQL below in your Supabase SQL Editor.`,
            sqlToRun: migrationSQL,
            supabaseSqlEditorUrl: `https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}/sql`,
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
