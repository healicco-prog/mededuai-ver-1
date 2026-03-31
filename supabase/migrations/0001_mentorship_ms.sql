-- ==========================================
-- Mentorship Management System Module Schema
-- Added Roles: instadmin, deptadmin
-- ==========================================

-- Add new roles to user_role ENUM safely (requires PostgreSQL 10+)
COMMIT;
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'instadmin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'deptadmin';
COMMIT;

-- ==========================================
-- 1. INSTITUTIONS & DEPARTMENTS
-- ==========================================

CREATE TABLE institutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    course TEXT,
    head_id UUID REFERENCES users(id) ON DELETE SET NULL, -- the institution admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    head_id UUID REFERENCES users(id) ON DELETE SET NULL, -- the department head
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Associate users with institutions/departments via user_profiles extension
CREATE TABLE student_profiles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    institution_id UUID REFERENCES institutions(id),
    department_id UUID REFERENCES departments(id), -- For teachers/dept heads
    registration_number TEXT,
    university_id TEXT,
    year INT,
    permanent_address TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    course TEXT,
    designation TEXT -- For mentors
);

-- ==========================================
-- 2. MENTORSHIP ALLOCATION
-- ==========================================

CREATE TABLE mentorship_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    peer_mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    year INT,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE mentorship_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES mentorship_groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(group_id, student_id)
);

-- ==========================================
-- 3. MENTORSHIP MEETINGS & FEEDBACK
-- ==========================================

CREATE TYPE meeting_type AS ENUM ('mentor_meeting', 'peer_meeting');
CREATE TYPE meeting_focus AS ENUM ('academic', 'nonacademic', 'both');

CREATE TABLE mentorship_meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES mentorship_groups(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type meeting_type DEFAULT 'mentor_meeting',
    academic_nonacademic meeting_focus DEFAULT 'both',
    issues_raised TEXT,
    action_taken TEXT,
    discussion_points TEXT,
    goal_setting TEXT,
    remarks TEXT,
    next_meeting_date TIMESTAMP WITH TIME ZONE,
    signed_by_mentor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE mentorship_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES mentorship_meetings(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    usefulness_rating INT CHECK (usefulness_rating BETWEEN 1 AND 5),
    mentor_support_rating INT CHECK (mentor_support_rating BETWEEN 1 AND 5),
    academic_guidance_rating INT CHECK (academic_guidance_rating BETWEEN 1 AND 5),
    personal_support_rating INT CHECK (personal_support_rating BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(meeting_id, student_id)
);

CREATE TABLE year_end_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES mentorship_groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    attendance_remarks TEXT,
    assessment_remarks TEXT,
    non_scholastic_remarks TEXT,
    signed_by_mentor BOOLEAN DEFAULT FALSE,
    approved_by_coordinator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, academic_year)
);

-- ==========================================
-- 4. MESSAGING / CHAT SYSTEM
-- ==========================================

CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES mentorship_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 5. ASSESSMENTS & PERFORMANCE
-- ==========================================

CREATE TYPE dh_assessment_type AS ENUM ('formative', 'internal', 'clinical', 'summative');
CREATE TYPE dh_assessment_mode AS ENUM ('theory', 'practical', 'viva', 'clinical', 'custom');

CREATE TABLE department_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type dh_assessment_type NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_classes_conducted INT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE assessment_papers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES department_assessments(id) ON DELETE CASCADE,
    paper_name TEXT NOT NULL,
    mode dh_assessment_mode NOT NULL,
    max_marks FLOAT NOT NULL
);

CREATE TABLE student_assessment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_paper_id UUID REFERENCES assessment_papers(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    marks_obtained FLOAT,
    attendance_percentage FLOAT,
    overall_assessment TEXT,
    remarks TEXT,
    approved_by_dh BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(assessment_paper_id, student_id)
);

CREATE TYPE non_scholastic_category AS ENUM ('research', 'sports', 'cultural', 'leadership', 'volunteering', 'awards');

CREATE TABLE non_scholastic_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    category non_scholastic_category NOT NULL,
    description TEXT NOT NULL,
    verified_by_dept_head BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_end_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assessment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_scholastic_achievements ENABLE ROW LEVEL SECURITY;

-- Admins and InstAdmins can read/write most structure
CREATE POLICY admin_all_inst ON institutions FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instadmin'));
CREATE POLICY read_inst ON institutions FOR SELECT USING (true);

CREATE POLICY admin_all_dept ON departments FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instadmin'));
CREATE POLICY read_dept ON departments FOR SELECT USING (true);

-- Users can read profiles
CREATE POLICY read_profiles ON student_profiles FOR SELECT USING (true);
CREATE POLICY admin_all_profiles ON student_profiles FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instadmin', 'deptadmin'));
CREATE POLICY update_own_profile ON student_profiles FOR UPDATE USING (user_id = auth.uid());

-- Allow all authenticated users to read mentorship groups for now
CREATE POLICY read_groups ON mentorship_groups FOR SELECT USING (true);
CREATE POLICY admin_manage_groups ON mentorship_groups FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instadmin', 'deptadmin'));

CREATE POLICY read_group_members ON mentorship_group_members FOR SELECT USING (true);
CREATE POLICY admin_manage_group_members ON mentorship_group_members FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instadmin', 'deptadmin'));

-- Allow reads on assessments
CREATE POLICY read_dept_assessments ON department_assessments FOR SELECT USING (true);
CREATE POLICY read_assessment_papers ON assessment_papers FOR SELECT USING (true);
CREATE POLICY read_student_assessments ON student_assessment_records FOR SELECT USING (true);
CREATE POLICY read_non_scholastic ON non_scholastic_achievements FOR SELECT USING (true);

-- Department Heads can write assessments
CREATE POLICY deptadmin_assessment_write ON department_assessments FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'deptadmin', 'instadmin'));
CREATE POLICY deptadmin_papers_write ON assessment_papers FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'deptadmin', 'instadmin'));
CREATE POLICY deptadmin_records_write ON student_assessment_records FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'deptadmin', 'instadmin'));
CREATE POLICY deptadmin_nonscholastic_write ON non_scholastic_achievements FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'deptadmin', 'instadmin'));

-- Meeting reads and writes
CREATE POLICY read_meetings ON mentorship_meetings FOR SELECT USING (true);
CREATE POLICY write_meetings ON mentorship_meetings FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin', 'instadmin', 'deptadmin') OR mentor_id = auth.uid());

CREATE POLICY read_feedback ON mentorship_feedback FOR SELECT USING (true);
CREATE POLICY write_feedback ON mentorship_feedback FOR ALL USING (student_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin'));

CREATE POLICY read_year_reports ON year_end_reports FOR SELECT USING (true);
CREATE POLICY write_year_reports ON year_end_reports FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin', 'instadmin', 'deptadmin'));

CREATE POLICY read_chat ON chat_messages FOR SELECT USING (true);
CREATE POLICY write_chat ON chat_messages FOR ALL USING (sender_id = auth.uid());
