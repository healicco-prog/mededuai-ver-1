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

-- ── Core question columns ──────────────────────────────────────────────────
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_10_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_5_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS ppt_content JSONB;

-- ── Migrate old column data into new standardized column names ────────────
-- (safe to run multiple times — only copies if old column exists AND new column is empty)
DO $$
BEGIN
    -- marks_3_reasoning → marks_3_questions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lms_content' AND column_name='marks_3_reasoning') THEN
        ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_questions TEXT;
        UPDATE public.lms_content SET marks_3_questions = marks_3_reasoning WHERE marks_3_questions IS NULL AND marks_3_reasoning IS NOT NULL;
    END IF;
    -- marks_2_case_mcqs → marks_2_questions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lms_content' AND column_name='marks_2_case_mcqs') THEN
        ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_questions TEXT;
        UPDATE public.lms_content SET marks_2_questions = marks_2_case_mcqs WHERE marks_2_questions IS NULL AND marks_2_case_mcqs IS NOT NULL;
    END IF;
    -- marks_1_mcqs → marks_1_questions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lms_content' AND column_name='marks_1_mcqs') THEN
        ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_questions TEXT;
        UPDATE public.lms_content SET marks_1_questions = marks_1_mcqs WHERE marks_1_questions IS NULL AND marks_1_mcqs IS NOT NULL;
    END IF;
END $$;

-- ── Metadata / versioning columns ─────────────────────────────────────────
-- These allow content to be queried and displayed publicly without joins
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS topic TEXT;

-- ── Unique constraint on topic_id (needed for upserts) ────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lms_content_topic_id_key'
    ) THEN
        ALTER TABLE public.lms_content ADD CONSTRAINT lms_content_topic_id_key UNIQUE (topic_id);
    END IF;
END $$;

-- ── RLS: allow superadmin/admin/teacher roles to write lms_content ─────────
DROP POLICY IF EXISTS teacher_write_lms ON public.lms_content;
CREATE POLICY teacher_write_lms ON public.lms_content
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid())
        IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
        OR
        (SELECT role FROM public.profiles WHERE id = auth.uid())
        IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
    );

-- ── RLS: public read access (all users including unauthenticated) ──────────
DROP POLICY IF EXISTS read_lms ON public.lms_content;
CREATE POLICY read_lms ON public.lms_content FOR SELECT USING (true);
        `.trim();

        // Test which columns exist
        const { error: col10Err } = await supabase.from('lms_content').select('marks_10_questions').limit(1);
        const { error: col3Err } = await supabase.from('lms_content').select('marks_3_questions').limit(1);
        const { error: pptErr } = await supabase.from('lms_content').select('ppt_content').limit(1);
        const { error: versionErr } = await supabase.from('lms_content').select('version').limit(1);
        const { error: courseErr } = await supabase.from('lms_content').select('course').limit(1);

        const missingColumns = [];
        if (col10Err?.message?.includes('column') || col10Err?.message?.includes('does not exist')) {
            missingColumns.push('marks_10_questions', 'marks_5_questions');
        }
        if (col3Err?.message?.includes('column') || col3Err?.message?.includes('does not exist')) {
            missingColumns.push('marks_3_questions', 'marks_2_questions', 'marks_1_questions');
        }
        if (pptErr?.message?.includes('column') || pptErr?.message?.includes('does not exist')) {
            missingColumns.push('ppt_content');
        }
        if (versionErr?.message?.includes('column') || versionErr?.message?.includes('does not exist')) {
            missingColumns.push('version');
        }
        if (courseErr?.message?.includes('column') || courseErr?.message?.includes('does not exist')) {
            missingColumns.push('course', 'subject', 'topic');
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
