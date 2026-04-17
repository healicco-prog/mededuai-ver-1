-- ============================================================
-- MedEduAI: Complete Schema Setup for PGMentor Ver 1
-- Run this in Supabase SQL Editor (once, on a fresh project)
-- Project: qnguxwmrqwcksspujmoa.supabase.co
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'department_admin';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'institution_admin';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'master_admin';
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_tier AS ENUM ('free', 'basic', 'standard', 'premium', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    institution_id UUID,
    department_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 4. SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 5. TOPICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sn INTEGER,
    section TEXT DEFAULT 'General',
    competency_no TEXT DEFAULT 'N/A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_topics_section ON public.topics(section);
CREATE INDEX IF NOT EXISTS idx_topics_competency_no ON public.topics(competency_no);

-- ============================================================
-- 6. LMS CONTENT (AI-Generated)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lms_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE UNIQUE,
    introduction TEXT,
    detailed_notes TEXT,
    summary TEXT,
    -- Question bank columns
    marks_10_questions TEXT,
    marks_5_questions TEXT,
    marks_3_reasoning TEXT,
    marks_2_case_mcqs TEXT,
    marks_1_mcqs TEXT,
    -- Media columns
    flashcards JSONB,
    ppt_content JSONB,
    last_generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add missing columns if upgrading from old schema
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_10_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_5_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_reasoning TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_case_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS ppt_content JSONB;

-- Add UNIQUE constraint on topic_id for upserts (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lms_content_topic_id_key'
    ) THEN
        ALTER TABLE public.lms_content ADD CONSTRAINT lms_content_topic_id_key UNIQUE (topic_id);
    END IF;
END $$;

-- ============================================================
-- 7. ASSESSMENTS / QUESTION BANK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    marks INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT,
    options JSONB,
    correct_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 8. ATTENDANCE (Teacher Module)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id),
    teacher_id UUID REFERENCES public.users(id),
    student_id UUID REFERENCES public.users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(course_id, student_id, date)
);

-- ============================================================
-- 9. EXAMINATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.examinations(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    question_text TEXT NOT NULL,
    marks INT NOT NULL,
    question_type TEXT,
    ai_rubric JSONB,
    is_rubric_approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.student_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    total_marks INT DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.script_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    script_id UUID REFERENCES public.student_scripts(id) ON DELETE CASCADE,
    exam_question_id UUID REFERENCES public.exam_questions(id),
    image_url TEXT,
    extracted_text TEXT,
    ai_marks INT,
    ai_justification TEXT,
    ai_missing_keywords JSONB,
    teacher_override_marks INT
);

-- ============================================================
-- 10. AI LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    module TEXT NOT NULL,
    prompt TEXT,
    response TEXT,
    tokens_used INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 11. USAGE LIMITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) UNIQUE,
    mentor_questions_today INT DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    plan_type TEXT DEFAULT 'free',
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- 12. TIMETABLE SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetable_formats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institute_name TEXT NOT NULL,
    institute_logo_url TEXT,
    course TEXT NOT NULL,
    department TEXT NOT NULL,
    weekly_slots JSONB DEFAULT '[]'::jsonb,
    faculty_members JSONB DEFAULT '[]'::jsonb,
    topics_pool JSONB DEFAULT '[]'::jsonb,
    students_list JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.timetable_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    format_id UUID REFERENCES public.timetable_formats(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    topic_id TEXT,
    topic_name TEXT NOT NULL,
    competency_no TEXT,
    activity TEXT NOT NULL DEFAULT 'Lecture',
    batch TEXT NOT NULL DEFAULT 'Full',
    staff_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.timetable_holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    details TEXT NOT NULL DEFAULT 'Holiday',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.saved_timetables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    format_id UUID REFERENCES public.timetable_formats(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    institute_name TEXT NOT NULL,
    course TEXT NOT NULL,
    department TEXT NOT NULL,
    class_count INTEGER NOT NULL DEFAULT 0,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.timetable_formats(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time_from TEXT NOT NULL,
    time_to TEXT NOT NULL,
    topic TEXT NOT NULL,
    faculty TEXT,
    student_attendance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_timetable_schedules_date ON public.timetable_schedules(date);
CREATE INDEX IF NOT EXISTS idx_timetable_schedules_format ON public.timetable_schedules(format_id);
CREATE INDEX IF NOT EXISTS idx_saved_timetables_month ON public.saved_timetables(month);
CREATE INDEX IF NOT EXISTS idx_admin_attendance_date ON public.admin_attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_admin_attendance_course ON public.admin_attendance_records(course_id);

-- ============================================================
-- 13. SUBSCRIPTIONS & PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_tier plan_tier NOT NULL DEFAULT 'free',
    billing_status billing_status NOT NULL DEFAULT 'trialing',
    trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
    ai_tokens_balance INT NOT NULL DEFAULT 10000,
    ai_tokens_allotment INT NOT NULL DEFAULT 10000,
    tokens_reset_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    razorpay_subscription_id TEXT,
    razorpay_customer_id TEXT,
    razorpay_plan_id TEXT,
    last_payment_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    payment_failure_count INT DEFAULT 0,
    bonus_tokens INT DEFAULT 0,
    trial_extended_by UUID,
    trial_extension_days INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    amount_paise INT NOT NULL,
    currency TEXT DEFAULT 'INR',
    plan_tier plan_tier NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.token_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    tokens_used INT NOT NULL,
    ai_model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_token_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    target_user_id UUID NOT NULL REFERENCES auth.users(id),
    adjustment_type TEXT NOT NULL,
    amount INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_token_adjustments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY DEFINER FUNCTIONS (prevent RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_institution_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    SELECT institution_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_department_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    SELECT department_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Users
DROP POLICY IF EXISTS admin_all ON public.users;
CREATE POLICY admin_all ON public.users FOR ALL USING (public.get_auth_role() IN ('admin', 'super_admin', 'master_admin'));
CREATE POLICY IF NOT EXISTS "Users read own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profiles
DROP POLICY IF EXISTS "Super Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Master Admins manage their institution" ON public.profiles;
DROP POLICY IF EXISTS "Institution Admins manage their institution" ON public.profiles;
DROP POLICY IF EXISTS "Department Admins manage their department" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Super Admins have full access" ON public.profiles
    FOR ALL USING (public.get_auth_role() IN ('super_admin', 'superadmin', 'master_admin', 'masteradmin'));
CREATE POLICY "Institution Admins manage their institution" ON public.profiles
    FOR ALL USING (public.get_auth_role() IN ('institution_admin', 'instadmin') AND institution_id = public.get_auth_institution_id());
CREATE POLICY "Department Admins manage their department" ON public.profiles
    FOR ALL USING (public.get_auth_role() IN ('department_admin', 'deptadmin') AND department_id = public.get_auth_department_id() AND institution_id = public.get_auth_institution_id());
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Courses / Subjects / Topics / LMS / Assessments
DROP POLICY IF EXISTS read_courses ON public.courses;
DROP POLICY IF EXISTS read_subjects ON public.subjects;
DROP POLICY IF EXISTS read_topics ON public.topics;
DROP POLICY IF EXISTS read_lms ON public.lms_content;
DROP POLICY IF EXISTS read_assessments ON public.assessments;
DROP POLICY IF EXISTS teacher_write_courses ON public.courses;
DROP POLICY IF EXISTS teacher_write_subjects ON public.subjects;
DROP POLICY IF EXISTS teacher_write_topics ON public.topics;
DROP POLICY IF EXISTS teacher_write_lms ON public.lms_content;
DROP POLICY IF EXISTS teacher_write_assessments ON public.assessments;

CREATE POLICY read_courses ON public.courses FOR SELECT USING (true);
CREATE POLICY read_subjects ON public.subjects FOR SELECT USING (true);
CREATE POLICY read_topics ON public.topics FOR SELECT USING (true);
CREATE POLICY read_lms ON public.lms_content FOR SELECT USING (true);
CREATE POLICY read_assessments ON public.assessments FOR SELECT USING (true);

CREATE POLICY teacher_write_courses ON public.courses
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY teacher_write_subjects ON public.subjects
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY teacher_write_topics ON public.topics
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY teacher_write_lms ON public.lms_content
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY teacher_write_assessments ON public.assessments
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));

-- Timetable
CREATE POLICY IF NOT EXISTS admin_teacher_manage_formats ON public.timetable_formats
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY IF NOT EXISTS student_read_formats ON public.timetable_formats FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS admin_teacher_manage_schedules ON public.timetable_schedules
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY IF NOT EXISTS student_read_schedules ON public.timetable_schedules FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS admin_teacher_manage_holidays ON public.timetable_holidays
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY IF NOT EXISTS student_read_holidays ON public.timetable_holidays FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS admin_teacher_manage_saved_timetables ON public.saved_timetables
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY IF NOT EXISTS student_read_saved_timetables ON public.saved_timetables FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS admin_teacher_manage_attendance_records ON public.admin_attendance_records
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin', 'institution_admin'));
CREATE POLICY IF NOT EXISTS student_read_attendance_records ON public.admin_attendance_records FOR SELECT USING (true);

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
DROP POLICY IF EXISTS "Service role manages payments" ON public.payment_history;
CREATE POLICY "Users can view own payments" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages payments" ON public.payment_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own token usage" ON public.token_usage_log;
DROP POLICY IF EXISTS "Service role manages token usage" ON public.token_usage_log;
CREATE POLICY "Users can view own token usage" ON public.token_usage_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages token usage" ON public.token_usage_log FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role manages adjustments" ON public.admin_token_adjustments;
CREATE POLICY "Service role manages adjustments" ON public.admin_token_adjustments FOR ALL USING (true);

-- Own usage limits
CREATE POLICY IF NOT EXISTS own_usage_limits ON public.usage_limits FOR SELECT USING (user_id = auth.uid());

-- Exams
CREATE POLICY IF NOT EXISTS teacher_manage_exams ON public.examinations
    FOR ALL USING (teacher_id = auth.uid() OR public.get_auth_role() IN ('admin', 'super_admin', 'master_admin'));
CREATE POLICY IF NOT EXISTS teacher_manage_exam_q ON public.exam_questions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS teacher_manage_scripts ON public.student_scripts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS teacher_manage_answers ON public.script_answers FOR ALL USING (true);

-- Attendance
CREATE POLICY IF NOT EXISTS teacher_attendance ON public.attendance
    FOR ALL USING (public.get_auth_role() IN ('teacher', 'admin', 'super_admin', 'master_admin'));
CREATE POLICY IF NOT EXISTS student_attendance ON public.attendance
    FOR SELECT USING (student_id = auth.uid());

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- handle_new_user: auto-populate profiles and users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
    ) ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- initialize_subscription: auto-create subscription on new user
CREATE OR REPLACE FUNCTION public.initialize_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan_tier, billing_status, ai_tokens_balance, ai_tokens_allotment)
    VALUES (NEW.id, 'free', 'trialing', 10000, 10000)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_user_subscription ON auth.users;
CREATE TRIGGER on_new_user_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.initialize_subscription();

-- Auto-update timetable_formats.updated_at
CREATE OR REPLACE FUNCTION public.update_timetable_formats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_timetable_formats_updated_at ON public.timetable_formats;
CREATE TRIGGER trigger_update_timetable_formats_updated_at
    BEFORE UPDATE ON public.timetable_formats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timetable_formats_updated_at();

-- deduct_tokens function
CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id UUID, p_amount INT, p_feature TEXT, p_model TEXT DEFAULT 'gemini')
RETURNS JSON AS $$
DECLARE
    v_balance INT;
    v_bonus INT;
    v_total INT;
    v_remaining INT;
BEGIN
    SELECT ai_tokens_balance, bonus_tokens
    INTO v_balance, v_bonus
    FROM public.subscriptions
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No subscription found', 'remaining', 0);
    END IF;

    v_total := v_balance + COALESCE(v_bonus, 0);

    IF v_total < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient tokens', 'remaining', v_total);
    END IF;

    IF COALESCE(v_bonus, 0) >= p_amount THEN
        UPDATE public.subscriptions SET bonus_tokens = bonus_tokens - p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    ELSIF COALESCE(v_bonus, 0) > 0 THEN
        UPDATE public.subscriptions SET ai_tokens_balance = ai_tokens_balance - (p_amount - bonus_tokens), bonus_tokens = 0, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE
        UPDATE public.subscriptions SET ai_tokens_balance = ai_tokens_balance - p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    END IF;

    v_remaining := v_total - p_amount;

    INSERT INTO public.token_usage_log (user_id, feature_name, tokens_used, ai_model)
    VALUES (p_user_id, p_feature, p_amount, p_model);

    RETURN json_build_object('success', true, 'remaining', v_remaining, 'deducted', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- DONE
-- ============================================================
-- After running this script:
-- 1. Go to Authentication > Settings and configure your site URL
-- 2. Create your superadmin user via the Auth dashboard
-- 3. Update their role to 'super_admin' in the profiles table:
--    UPDATE public.profiles SET role = 'super_admin' WHERE email = 'healicco@gmail.com';
--    UPDATE public.users SET role = 'super_admin' WHERE email = 'healicco@gmail.com';
