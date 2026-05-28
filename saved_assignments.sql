-- Run this script in your Supabase SQL Editor to create the saved_assignments table

CREATE TABLE IF NOT EXISTS public.saved_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    competency TEXT,
    assignment_type TEXT NOT NULL,
    criteria TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.saved_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own assignments
CREATE POLICY "Users can insert their own assignments"
ON public.saved_assignments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own assignments
CREATE POLICY "Users can view their own assignments"
ON public.saved_assignments
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own assignments
CREATE POLICY "Users can update their own assignments"
ON public.saved_assignments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own assignments
CREATE POLICY "Users can delete their own assignments"
ON public.saved_assignments
FOR DELETE
USING (auth.uid() = user_id);

-- Allow Service Role to manage all
CREATE POLICY "Service Role can manage all assignments"
ON public.saved_assignments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
