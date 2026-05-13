-- ══════════════════════════════════════════════════════════════════════════
-- MedEduAI — lms_content add section column
-- Run this ONCE in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yrelfdwkjtaidtoulwrj/sql
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS section TEXT;
