-- SQL for Teaching and Department Admin Features (Saving History)

-- 1. Lesson Plans
CREATE TABLE IF NOT EXISTS saved_lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    topic_title TEXT,
    course TEXT,
    subject TEXT,
    plan_data JSONB
);
ALTER TABLE saved_lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own lesson plans" ON saved_lesson_plans FOR ALL USING (auth.uid() = user_id);

-- 2. Rubrics
CREATE TABLE IF NOT EXISTS saved_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT,
    course TEXT,
    subject TEXT,
    rubric_data JSONB
);
ALTER TABLE saved_rubrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own rubrics" ON saved_rubrics FOR ALL USING (auth.uid() = user_id);

-- 3. Digital Evaluation Assist (Dig Eval)
CREATE TABLE IF NOT EXISTS saved_digital_evals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    question TEXT,
    marks INTEGER,
    evaluation_data JSONB
);
ALTER TABLE saved_digital_evals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own digital evals" ON saved_digital_evals FOR ALL USING (auth.uid() = user_id);

-- 4. Classroom Generator
CREATE TABLE IF NOT EXISTS saved_classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT,
    course TEXT,
    classroom_data JSONB
);
ALTER TABLE saved_classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own classrooms" ON saved_classrooms FOR ALL USING (auth.uid() = user_id);

-- 5. Q-Paper Dev
CREATE TABLE IF NOT EXISTS saved_q_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT,
    course TEXT,
    subject TEXT,
    q_paper_data JSONB
);
ALTER TABLE saved_q_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own question papers" ON saved_q_papers FOR ALL USING (auth.uid() = user_id);

-- 6. EMS (Essay Evaluation System)
CREATE TABLE IF NOT EXISTS saved_ems_evals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exam_name TEXT,
    student_name TEXT,
    ems_data JSONB
);
ALTER TABLE saved_ems_evals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own EMS evals" ON saved_ems_evals FOR ALL USING (auth.uid() = user_id);

-- 7. EMR (MCQ Evaluation System)
CREATE TABLE IF NOT EXISTS saved_emr_evals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exam_name TEXT,
    student_name TEXT,
    emr_data JSONB
);
ALTER TABLE saved_emr_evals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own EMR evals" ON saved_emr_evals FOR ALL USING (auth.uid() = user_id);

-- Note: 
-- 1. Notes Creator uses the 'saved_notes' table we already created.
-- 2. Essays Generator uses 'saved_essays'.
-- 3. MCQs Generator uses 'saved_mcqs'.
-- 4. Time Table MS uses 'saved_timetables' (already exists in your DB schema).
-- 5. Attendance MS uses 'admin_attendance_records' (already exists in your DB schema).
