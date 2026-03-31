-- ==========================================
-- MedEduAI: Timetable MS & Attendance MS Schema
-- Migration 0003 - Admin Modules
-- ==========================================

-- ======================
-- 1. TIMETABLE FORMATS (Classrooms)
-- ======================
CREATE TABLE IF NOT EXISTS timetable_formats (
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

COMMENT ON TABLE timetable_formats IS 'Classrooms created via Classroom Generator. Used by both Timetable MS and Attendance MS.';

-- ======================
-- 2. TIMETABLE SCHEDULES (Daily Scheduled Classes)
-- ======================
CREATE TABLE IF NOT EXISTS timetable_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    format_id UUID REFERENCES timetable_formats(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    topic_id TEXT,
    topic_name TEXT NOT NULL,
    competency_no TEXT,
    activity TEXT NOT NULL DEFAULT 'Lecture',
    batch TEXT NOT NULL DEFAULT 'Full',
    staff_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE timetable_schedules IS 'Individual classes scheduled on specific dates within a Timetable Format/Classroom.';

-- Index for fast date-based lookups
CREATE INDEX IF NOT EXISTS idx_timetable_schedules_date ON timetable_schedules(date);
CREATE INDEX IF NOT EXISTS idx_timetable_schedules_format ON timetable_schedules(format_id);

-- ======================
-- 3. TIMETABLE HOLIDAYS
-- ======================
CREATE TABLE IF NOT EXISTS timetable_holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    details TEXT NOT NULL DEFAULT 'Holiday',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

COMMENT ON TABLE timetable_holidays IS 'Holidays marked by admins/teachers that block scheduling on those dates.';

-- ======================
-- 4. SAVED TIMETABLES (Monthly Snapshots)
-- ======================
CREATE TABLE IF NOT EXISTS saved_timetables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    format_id UUID REFERENCES timetable_formats(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    institute_name TEXT NOT NULL,
    course TEXT NOT NULL,
    department TEXT NOT NULL,
    class_count INTEGER NOT NULL DEFAULT 0,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE saved_timetables IS 'Persisted monthly timetable snapshots for archival and PDF export.';

-- Index for month-based filtering
CREATE INDEX IF NOT EXISTS idx_saved_timetables_month ON saved_timetables(month);

-- ======================
-- 5. ADMIN ATTENDANCE RECORDS
-- (Named differently from existing teacher-level `attendance` table)
-- ======================
CREATE TABLE IF NOT EXISTS admin_attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES timetable_formats(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time_from TEXT NOT NULL,
    time_to TEXT NOT NULL,
    topic TEXT NOT NULL,
    faculty TEXT,
    student_attendance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE admin_attendance_records IS 'Attendance records for each class session. student_attendance is a JSONB map of {studentId: boolean}.';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_attendance_date ON admin_attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_admin_attendance_course ON admin_attendance_records(course_id);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all new tables
ALTER TABLE timetable_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_attendance_records ENABLE ROW LEVEL SECURITY;

-- ---- timetable_formats ----
-- Admins & Teachers: Full access
CREATE POLICY admin_teacher_manage_formats ON timetable_formats
    FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
    );
-- Students: Read-only
CREATE POLICY student_read_formats ON timetable_formats
    FOR SELECT USING (true);

-- ---- timetable_schedules ----
-- Admins & Teachers: Full access
CREATE POLICY admin_teacher_manage_schedules ON timetable_schedules
    FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
    );
-- Students: Read-only
CREATE POLICY student_read_schedules ON timetable_schedules
    FOR SELECT USING (true);

-- ---- timetable_holidays ----
-- Admins & Teachers: Full access
CREATE POLICY admin_teacher_manage_holidays ON timetable_holidays
    FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
    );
-- Students: Read-only
CREATE POLICY student_read_holidays ON timetable_holidays
    FOR SELECT USING (true);

-- ---- saved_timetables ----
-- Admins & Teachers: Full access
CREATE POLICY admin_teacher_manage_saved_timetables ON saved_timetables
    FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
    );
-- Students: Read-only
CREATE POLICY student_read_saved_timetables ON saved_timetables
    FOR SELECT USING (true);

-- ---- admin_attendance_records ----
-- Admins & Teachers: Full access
CREATE POLICY admin_teacher_manage_attendance_records ON admin_attendance_records
    FOR ALL USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
    );
-- Students: Read-only (to view their own attendance in future)
CREATE POLICY student_read_attendance_records ON admin_attendance_records
    FOR SELECT USING (true);

-- ==========================================
-- TRIGGER: Auto-update `updated_at` on timetable_formats
-- ==========================================
CREATE OR REPLACE FUNCTION update_timetable_formats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timetable_formats_updated_at
    BEFORE UPDATE ON timetable_formats
    FOR EACH ROW
    EXECUTE FUNCTION update_timetable_formats_updated_at();
