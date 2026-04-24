-- ══════════════════════════════════════════════════════════════════════════
-- MedEduAI — lms_content schema migration (v2)
-- Run this ONCE in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yrelfdwkjtaidtoulwrj/sql
-- Safe to run multiple times — all statements use IF NOT EXISTS / IF EXISTS.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Core question columns (standardized names) ─────────────────────────
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_10_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_5_questions  TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_questions  TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_questions  TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_questions  TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS ppt_content        JSONB;

-- ── 2. Migrate existing data from old column names → new standardized names ─
DO $$
BEGIN
    -- marks_3_reasoning → marks_3_questions
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lms_content' AND column_name = 'marks_3_reasoning'
    ) THEN
        UPDATE public.lms_content
        SET marks_3_questions = marks_3_reasoning
        WHERE marks_3_questions IS NULL AND marks_3_reasoning IS NOT NULL;
    END IF;

    -- marks_2_case_mcqs → marks_2_questions
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lms_content' AND column_name = 'marks_2_case_mcqs'
    ) THEN
        UPDATE public.lms_content
        SET marks_2_questions = marks_2_case_mcqs
        WHERE marks_2_questions IS NULL AND marks_2_case_mcqs IS NOT NULL;
    END IF;

    -- marks_1_mcqs → marks_1_questions
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'lms_content' AND column_name = 'marks_1_mcqs'
    ) THEN
        UPDATE public.lms_content
        SET marks_1_questions = marks_1_mcqs
        WHERE marks_1_questions IS NULL AND marks_1_mcqs IS NOT NULL;
    END IF;
END $$;

-- ── 3. Metadata / versioning columns (public access without joins) ─────────
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS course  TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS topic   TEXT;

-- ── 4. Unique constraint on topic_id (required for upserts) ───────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lms_content_topic_id_key'
    ) THEN
        ALTER TABLE public.lms_content
        ADD CONSTRAINT lms_content_topic_id_key UNIQUE (topic_id);
    END IF;
END $$;

-- ── 5. RLS: admins / teachers can write lms_content ──────────────────────
DROP POLICY IF EXISTS teacher_write_lms ON public.lms_content;
CREATE POLICY teacher_write_lms ON public.lms_content
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id = auth.uid())
          IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
        OR
        (SELECT role FROM public.profiles WHERE id = auth.uid())
          IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
    );

-- ── 6. RLS: public read — all users (including unauthenticated) ───────────
DROP POLICY IF EXISTS read_lms ON public.lms_content;
CREATE POLICY read_lms ON public.lms_content FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════════════
-- Verify after running:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'lms_content'
-- ORDER BY ordinal_position;
-- ══════════════════════════════════════════════════════════════════════════
