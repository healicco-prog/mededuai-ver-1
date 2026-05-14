-- ══════════════════════════════════════════════════════════════════════════
-- MedEduAI Migration 0008: Secure-by-Default Global Grants
-- Retrofits explicit SQL GRANT statements across all application tables to 
-- ensure seamless API visibility under Supabase's secure-by-default rollout.
-- 
-- API visibility grants (GRANT) control if the engine routes requests at all.
-- Data security and boundary isolation remain strictly governed by existing RLS.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Formalize Missing Table Schema (dig_eval_scripts) ──────────────────
CREATE TABLE IF NOT EXISTS public.dig_eval_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rubric_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    roll_number TEXT,
    student_name TEXT,
    marks_obtained FLOAT,
    total_marks INT,
    percentage FLOAT,
    evaluation_result TEXT,
    course TEXT,
    subject TEXT,
    question TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on dig_eval_scripts
ALTER TABLE public.dig_eval_scripts ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies for dig_eval_scripts
DROP POLICY IF EXISTS "Users can read own evaluated scripts" ON public.dig_eval_scripts;
CREATE POLICY "Users can read own evaluated scripts" ON public.dig_eval_scripts
    FOR SELECT USING (
        auth.uid() = user_id 
        OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin')
    );

DROP POLICY IF EXISTS "Users can insert evaluated scripts" ON public.dig_eval_scripts;
CREATE POLICY "Users can insert evaluated scripts" ON public.dig_eval_scripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ── 2. Explicit Baseline Grants for Anonymous Access (anon) ───────────────
-- Highly restricted baseline access primarily for catalog lookups
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT ON public.topics TO anon;
GRANT SELECT ON public.lms_content TO anon;
GRANT SELECT ON public.assessments TO anon;


-- ── 3. Explicit Baseline Grants for Authenticated Users (authenticated) ───
-- Standard application client interaction privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lms_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.examinations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_scripts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.script_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_limits TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentorship_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.year_end_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_papers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_assessment_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.non_scholastic_achievements TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_formats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_holidays TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_timetables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_attendance_records TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.token_usage_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_token_adjustments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_jobs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dig_eval_scripts TO authenticated;


-- ── 4. Explicit Elevated Grants for Backend Operations (service_role) ─────
-- Full administrative interface bypassing default RLS layer
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.courses TO service_role;
GRANT ALL ON public.subjects TO service_role;
GRANT ALL ON public.topics TO service_role;
GRANT ALL ON public.lms_content TO service_role;
GRANT ALL ON public.assessments TO service_role;
GRANT ALL ON public.attendance TO service_role;
GRANT ALL ON public.examinations TO service_role;
GRANT ALL ON public.exam_questions TO service_role;
GRANT ALL ON public.student_scripts TO service_role;
GRANT ALL ON public.script_answers TO service_role;
GRANT ALL ON public.ai_logs TO service_role;
GRANT ALL ON public.usage_limits TO service_role;

GRANT ALL ON public.profiles TO service_role;

GRANT ALL ON public.institutions TO service_role;
GRANT ALL ON public.departments TO service_role;
GRANT ALL ON public.student_profiles TO service_role;
GRANT ALL ON public.mentorship_groups TO service_role;
GRANT ALL ON public.mentorship_group_members TO service_role;
GRANT ALL ON public.mentorship_meetings TO service_role;
GRANT ALL ON public.mentorship_feedback TO service_role;
GRANT ALL ON public.year_end_reports TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.department_assessments TO service_role;
GRANT ALL ON public.assessment_papers TO service_role;
GRANT ALL ON public.student_assessment_records TO service_role;
GRANT ALL ON public.non_scholastic_achievements TO service_role;

GRANT ALL ON public.timetable_formats TO service_role;
GRANT ALL ON public.timetable_schedules TO service_role;
GRANT ALL ON public.timetable_holidays TO service_role;
GRANT ALL ON public.saved_timetables TO service_role;
GRANT ALL ON public.admin_attendance_records TO service_role;

GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.payment_history TO service_role;
GRANT ALL ON public.token_usage_log TO service_role;
GRANT ALL ON public.admin_token_adjustments TO service_role;

GRANT ALL ON public.creator_jobs TO service_role;

GRANT ALL ON public.dig_eval_scripts TO service_role;
