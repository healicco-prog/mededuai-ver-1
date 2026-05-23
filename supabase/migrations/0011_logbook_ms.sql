-- ============================================================================
-- 0011_logbook_ms.sql — LogBook Management System
-- ============================================================================
-- Approval chain: Faculty (teacher) → HoD (deptadmin) → HoI (instadmin)
--                 → finalized PDF available for student download.
--
-- Role values referenced (from public.users.role):
--   'student'                — Learning User
--   'teacher'                — Faculty Incharge
--   'deptadmin'              — Head of Department
--   'instadmin'              — Head of Institution
--   'superadmin' / 'masteradmin' — platform overrides
--
-- Fields marked "Add New" in the spec are stored as TEXT to allow custom
-- values, with canonical options listed in comments.
-- ============================================================================

-- ── 0. Helper: derive the calling user's role from public.users ─────────────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ── 1. Institutions & departments (idempotent — safe if they already exist) ─
CREATE TABLE IF NOT EXISTS public.institutions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    head_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.departments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id  uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name            text NOT NULL,
    head_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- HoD
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (institution_id, name)
);
CREATE INDEX IF NOT EXISTS idx_departments_inst ON public.departments(institution_id);

-- ── 2. Signatures (one per user; reused across approvals) ──────────────────
CREATE TABLE IF NOT EXISTS public.logbook_signatures (
    user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    signature_url  text NOT NULL,           -- Supabase Storage URL of the signature image
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 3. HoI / HoD broadcast messages (initiation, reminders, etc.) ──────────
CREATE TABLE IF NOT EXISTS public.logbook_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id  uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    department_id   uuid REFERENCES public.departments(id) ON DELETE CASCADE,  -- null = institution-wide
    sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    audience        text NOT NULL CHECK (audience IN ('hod', 'faculty', 'student', 'all')),
    subject         text NOT NULL,
    body            text NOT NULL,
    sent_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logbook_messages_institution ON public.logbook_messages(institution_id, sent_at DESC);

-- ── 4. Logbook master record (per student per phase/block) ─────────────────
CREATE TABLE IF NOT EXISTS public.logbooks (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id            uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    department_id             uuid NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    course_name               text,                -- denormalized convenience (e.g. "MBBS")
    academic_year             text NOT NULL,       -- "2025-26"
    phase                     text,                -- 'MBBS Phase I' | 'Phase II' | 'Phase III Part 1/2' | custom
    block                     text,                -- 'Block 1' | 'Block 2' | 'Block 3' | custom

    -- Three-tier approval chain
    status                    text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'faculty_approved', 'hod_approved', 'institution_approved', 'finalized')),
    faculty_approved_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    faculty_approved_at       timestamptz,
    hod_approved_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    hod_approved_at           timestamptz,
    institution_approved_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    institution_approved_at   timestamptz,
    finalized_pdf_url         text,                -- populated when status='finalized'

    initiated_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- HoI who initiated
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    UNIQUE (student_id, academic_year, phase, block)
);
CREATE INDEX IF NOT EXISTS idx_logbooks_dept ON public.logbooks(department_id, status);
CREATE INDEX IF NOT EXISTS idx_logbooks_inst ON public.logbooks(institution_id, status);

-- ── 5. HoD-approved classroom roster (the "list uploaded" the spec mentions) ─
CREATE TABLE IF NOT EXISTS public.logbook_classroom_students (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id   uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    student_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approved_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (department_id, student_id)
);

-- ── 6. Logbook sessions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logbook_sessions (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id               uuid NOT NULL REFERENCES public.logbooks(id) ON DELETE CASCADE,
    session_date             date NOT NULL,
    time_from                timestamptz NOT NULL,
    time_to                  timestamptz NOT NULL,
    -- Canonical session_type values:
    --   AETCOM | Certifiable Skill Session | Non-Certifiable Skill Session
    --   | Self Directed Learning | Seminar | Tutorials
    --   | Integrated Teaching Session | Clinical Clerkship Session
    --   | Skill Lab | PBL | CBL | TBL
    --   | (or any custom "Add New" value)
    session_type             text NOT NULL,
    topic                    text NOT NULL,                    -- Topic / Module / Session Name
    competency_no            text,
    competency               text,
    -- Details JSON: { learning_domain, level_of_competency, is_core, required_count }
    details                  jsonb NOT NULL DEFAULT '{}'::jsonb,
    learning_objectives      text,
    -- Reflection: required ≥200 words once filled (empty string allowed while draft).
    reflection               text NOT NULL DEFAULT '',
    attendance               text NOT NULL DEFAULT 'present' CHECK (attendance IN ('present', 'absent')),
    faculty_incharge_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    date_of_completion       date,
    attempt                  text CHECK (attempt IN ('F', 'R', 'Re')),  -- First / Repeat / Remedial
    rating                   text CHECK (rating IN ('B', 'M', 'E')),    -- Below / Meets / Exceeds
    decision                 text CHECK (decision IN ('C', 'R', 'Re')), -- Completed / Repeat / Remedial
    feedback_remarks         text,

    -- Per-session faculty approval (the "Then Approve" button)
    faculty_approved_at      timestamptz,
    faculty_approved_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),

    -- Enforce the 200-word reflection minimum at approval time. We allow
    -- empty reflection while drafting and only check word count when the
    -- session is approved by faculty.
    CONSTRAINT chk_reflection_min_words CHECK (
        faculty_approved_at IS NULL
        OR array_length(regexp_split_to_array(trim(regexp_replace(reflection, '\s+', ' ', 'g')), ' '), 1) >= 200
    )
);
CREATE INDEX IF NOT EXISTS idx_logbook_sessions_logbook ON public.logbook_sessions(logbook_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_logbook_sessions_faculty ON public.logbook_sessions(faculty_incharge_id);

-- ── 7. Reflection files: multi-image / PDF uploads per session ─────────────
CREATE TABLE IF NOT EXISTS public.logbook_session_files (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   uuid NOT NULL REFERENCES public.logbook_sessions(id) ON DELETE CASCADE,
    file_url     text NOT NULL,
    file_type    text NOT NULL CHECK (file_type IN ('image', 'pdf')),
    uploaded_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logbook_session_files ON public.logbook_session_files(session_id);

-- ── 8. Assessments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logbook_assessments (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id               uuid NOT NULL REFERENCES public.logbooks(id) ON DELETE CASCADE,
    assessment_category      text NOT NULL CHECK (assessment_category IN ('formative', 'internal')),
    assessment_no            text NOT NULL,                             -- "1", "2", "Mid-1", etc.
    assessment_type          text NOT NULL CHECK (assessment_type IN ('theory', 'practical', 'viva')),
    marks_received           numeric,
    marks_out_of             numeric,
    faculty_incharge_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    feedback                 text,
    faculty_approved_at      timestamptz,
    faculty_approved_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logbook_assessments_logbook ON public.logbook_assessments(logbook_id);

CREATE TABLE IF NOT EXISTS public.logbook_assessment_students (
    assessment_id uuid NOT NULL REFERENCES public.logbook_assessments(id) ON DELETE CASCADE,
    student_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY (assessment_id, student_id)
);

-- ── 9. Attendance reports ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logbook_attendance_reports (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id      uuid NOT NULL REFERENCES public.logbooks(id) ON DELETE CASCADE,
    phase           text NOT NULL,
    block           text NOT NULL,
    -- attendance_pct JSON: { "theory": 82.5, "practical": 90.0, "clinical_posting": 75.0, ... }
    -- (jsonb so callers can "Add New" buckets without a schema change)
    attendance_pct  jsonb NOT NULL DEFAULT '{}'::jsonb,
    eligibility     text NOT NULL CHECK (eligibility IN ('eligible', 'not_eligible', 'not_applicable')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logbook_attendance_logbook ON public.logbook_attendance_reports(logbook_id);

-- ── 10. Additional activities ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logbook_additional_activities (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id               uuid NOT NULL REFERENCES public.logbooks(id) ON DELETE CASCADE,
    -- activity_type canonical: 'Additional Curricular' | 'Extracurricular' | 'Achievements' | 'Awards' | custom
    activity_type            text NOT NULL,
    -- activity_name canonical: 'Seminar' | 'Conference' | 'Outreach activities' | 'Workshop' | custom
    activity_name            text NOT NULL,
    activity_date            date NOT NULL,
    details                  text,
    faculty_incharge_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logbook_activities_logbook ON public.logbook_additional_activities(logbook_id);

CREATE TABLE IF NOT EXISTS public.logbook_additional_activity_students (
    activity_id uuid NOT NULL REFERENCES public.logbook_additional_activities(id) ON DELETE CASCADE,
    student_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, student_id)
);

-- ── 11. updated_at trigger ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'logbooks',
        'logbook_sessions',
        'logbook_assessments',
        'logbook_attendance_reports',
        'logbook_additional_activities'
    ]
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.%I;
             CREATE TRIGGER trg_touch_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();',
            t, t
        );
    END LOOP;
END $$;

-- ── 12. Row-Level Security ─────────────────────────────────────────────────
-- Service role bypasses these. App-level reads/writes from the browser hit
-- these policies. Tighten the role lists per institution if you go multi-tenant.

ALTER TABLE public.logbook_signatures              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbooks                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_classroom_students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_sessions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_session_files           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_assessments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_assessment_students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_attendance_reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_additional_activities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_additional_activity_students ENABLE ROW LEVEL SECURITY;

-- Signatures: user owns their own row; admins read all.
DROP POLICY IF EXISTS sig_select ON public.logbook_signatures;
CREATE POLICY sig_select ON public.logbook_signatures FOR SELECT
    USING (user_id = auth.uid()
           OR public.current_user_role() IN ('superadmin','masteradmin','instadmin','deptadmin'));
DROP POLICY IF EXISTS sig_upsert ON public.logbook_signatures;
CREATE POLICY sig_upsert ON public.logbook_signatures FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Logbooks: students read own, faculty/HoD/HoI read all in scope.
DROP POLICY IF EXISTS lb_read ON public.logbooks;
CREATE POLICY lb_read ON public.logbooks FOR SELECT
    USING (student_id = auth.uid()
           OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'));
DROP POLICY IF EXISTS lb_write ON public.logbooks;
CREATE POLICY lb_write ON public.logbooks FOR ALL
    USING (public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'));

-- Sessions
DROP POLICY IF EXISTS sessions_read ON public.logbook_sessions;
CREATE POLICY sessions_read ON public.logbook_sessions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logbooks lb WHERE lb.id = logbook_id
            AND (lb.student_id = auth.uid()
                 OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))));
DROP POLICY IF EXISTS sessions_write ON public.logbook_sessions;
CREATE POLICY sessions_write ON public.logbook_sessions FOR ALL
    USING (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'));

-- Reflection files: student uploads to their own session; faculty/admin read+manage.
DROP POLICY IF EXISTS reffiles_read ON public.logbook_session_files;
CREATE POLICY reffiles_read ON public.logbook_session_files FOR SELECT
    USING (EXISTS (SELECT 1
                     FROM public.logbook_sessions s
                     JOIN public.logbooks lb ON lb.id = s.logbook_id
                    WHERE s.id = session_id
                      AND (lb.student_id = auth.uid()
                           OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))));
DROP POLICY IF EXISTS reffiles_insert ON public.logbook_session_files;
CREATE POLICY reffiles_insert ON public.logbook_session_files FOR INSERT
    WITH CHECK (uploaded_by = auth.uid()
                AND EXISTS (SELECT 1
                              FROM public.logbook_sessions s
                              JOIN public.logbooks lb ON lb.id = s.logbook_id
                             WHERE s.id = session_id
                               AND (lb.student_id = auth.uid()
                                    OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))));
DROP POLICY IF EXISTS reffiles_delete ON public.logbook_session_files;
CREATE POLICY reffiles_delete ON public.logbook_session_files FOR DELETE
    USING (uploaded_by = auth.uid()
           OR public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'));

-- Assessments
DROP POLICY IF EXISTS assess_read ON public.logbook_assessments;
CREATE POLICY assess_read ON public.logbook_assessments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logbooks lb WHERE lb.id = logbook_id
            AND (lb.student_id = auth.uid()
                 OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))));
DROP POLICY IF EXISTS assess_write ON public.logbook_assessments;
CREATE POLICY assess_write ON public.logbook_assessments FOR ALL
    USING (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'));

-- Attendance reports (HoD authors)
DROP POLICY IF EXISTS att_read ON public.logbook_attendance_reports;
CREATE POLICY att_read ON public.logbook_attendance_reports FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logbooks lb WHERE lb.id = logbook_id
            AND (lb.student_id = auth.uid()
                 OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))));
DROP POLICY IF EXISTS att_write ON public.logbook_attendance_reports;
CREATE POLICY att_write ON public.logbook_attendance_reports FOR ALL
    USING (public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'));

-- Additional activities
DROP POLICY IF EXISTS act_read ON public.logbook_additional_activities;
CREATE POLICY act_read ON public.logbook_additional_activities FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.logbooks lb WHERE lb.id = logbook_id
            AND (lb.student_id = auth.uid()
                 OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))));
DROP POLICY IF EXISTS act_write ON public.logbook_additional_activities;
CREATE POLICY act_write ON public.logbook_additional_activities FOR ALL
    USING (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'));

-- Junction tables: same scope as parent, plus students see rows they're allotted to.
DROP POLICY IF EXISTS assess_stu_all ON public.logbook_assessment_students;
CREATE POLICY assess_stu_all ON public.logbook_assessment_students FOR ALL
    USING (student_id = auth.uid()
           OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'));

DROP POLICY IF EXISTS act_stu_all ON public.logbook_additional_activity_students;
CREATE POLICY act_stu_all ON public.logbook_additional_activity_students FOR ALL
    USING (student_id = auth.uid()
           OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'));

-- Classroom roster (HoD-managed)
DROP POLICY IF EXISTS cls_select ON public.logbook_classroom_students;
CREATE POLICY cls_select ON public.logbook_classroom_students FOR SELECT
    USING (student_id = auth.uid()
           OR public.current_user_role() IN ('teacher','deptadmin','instadmin','superadmin','masteradmin'));
DROP POLICY IF EXISTS cls_write ON public.logbook_classroom_students;
CREATE POLICY cls_write ON public.logbook_classroom_students FOR ALL
    USING (public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'))
    WITH CHECK (public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'));

-- Broadcast messages
DROP POLICY IF EXISTS msgs_read ON public.logbook_messages;
CREATE POLICY msgs_read ON public.logbook_messages FOR SELECT
    USING (public.current_user_role() IN ('student','teacher','deptadmin','instadmin','superadmin','masteradmin'));
DROP POLICY IF EXISTS msgs_send ON public.logbook_messages;
CREATE POLICY msgs_send ON public.logbook_messages FOR INSERT
    WITH CHECK (sender_id = auth.uid()
                AND public.current_user_role() IN ('deptadmin','instadmin','superadmin','masteradmin'));

-- ============================================================================
-- 0011_logbook_ms.sql — END
-- ============================================================================
