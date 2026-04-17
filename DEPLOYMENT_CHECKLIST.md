# MedEduAI — Supabase Configuration

## Active Project: MedEduAI-1

| Setting | Value |
|---|---|
| Project Name | MedEduAI-1 |
| Project ID | yrelfdwkjtaidtoulwrj |
| API URL | https://yrelfdwkjtaidtoulwrj.supabase.co |

All 4 environment files point to this project:
- ✅ `.env.local`
- ✅ `.env.production`
- ✅ `.netlify/functions-internal/___netlify-server-handler/.env.local`
- ✅ `.netlify/functions-internal/___netlify-server-handler/.env.production`

---

## To Test Locally (After Any Env Change)

1. Stop the dev server (Ctrl+C)
2. Run `npm run dev`
3. Log in as Super Admin → go to `/dashboard/admin/creator`
4. The green bar at the top confirms DB is connected
5. Click **"Save N Notes to DB"** to push generated content to Supabase
6. Open notes page as any user — content will appear

## Run This SQL Once in Supabase SQL Editor

The old `lms_content` table is missing the question bank columns. Run this in
https://supabase.com/dashboard/project/yrelfdwkjtaidtoulwrj/sql

```sql
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_10_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_5_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_reasoning TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_case_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS ppt_content JSONB;

-- Add unique constraint on topic_id (needed for upserts):
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lms_content_topic_id_key'
    ) THEN
        ALTER TABLE public.lms_content ADD CONSTRAINT lms_content_topic_id_key UNIQUE (topic_id);
    END IF;
END $$;
```

This is optional for basic functionality — the app now auto-falls back to core columns
if these are missing. But running it enables full question bank saving.
