# Production Fix — Run These Steps in Order

## The Problems
1. Cloud Run hasn't been rebuilt with the latest code (db-test route missing → red error banner)
2. `lms_content` table is missing `marks_10_questions` etc. columns → saves fail silently
3. 51 local code fixes not yet committed/deployed

---

## Step 1 — Run This SQL in Supabase (FASTEST FIX — Do This First)

Open: https://supabase.com/dashboard/project/yrelfdwkjtaidtoulwrj/sql

Paste and run:
```sql
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_10_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_5_questions TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_reasoning TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_case_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_mcqs TEXT;
ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS ppt_content JSONB;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lms_content_topic_id_key'
    ) THEN
        ALTER TABLE public.lms_content ADD CONSTRAINT lms_content_topic_id_key UNIQUE (topic_id);
    END IF;
END $$;
```

---

## Step 2 — Update Netlify Environment Variables

Go to: https://app.netlify.com → Your site → Site settings → Environment variables

Add/update these two:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://yrelfdwkjtaidtoulwrj.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWxmZHdranRhaWR0b3Vsd3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDU3ODQsImV4cCI6MjA4ODY4MTc4NH0.FpFw_TINjRTeSRK54PFa-NoLa5R9ctx8y5h4_wmoBfk`

---

## Step 3 — Commit & Push Code Fixes

Open your terminal in the project folder and run:

```bash
git add -A
git commit -m "fix: DB saves with column fallback, auth fix, db-test UI, MedEduAI-1 project"
git push
```

This triggers a Netlify rebuild automatically.

---

## Step 4 — Update Cloud Run Env Vars + Rebuild

In your terminal:

```bash
# Step 4a: Update Cloud Run env vars to MedEduAI-1
gcloud run services update mededuai-backend \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://yrelfdwkjtaidtoulwrj.supabase.co" \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWxmZHdranRhaWR0b3Vsd3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDU3ODQsImV4cCI6MjA4ODY4MTc4NH0.FpFw_TINjRTeSRK54PFa-NoLa5R9ctx8y5h4_wmoBfk" \
  --update-env-vars="SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWxmZHdranRhaWR0b3Vsd3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEwNTc4NCwiZXhwIjoyMDg4NjgxNzg0fQ.YFqGcueb4VKoMUyIfpgiw7pXIKlYjeSp7ajdMp2NVlY"

# Step 4b: Rebuild Cloud Run with latest code
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=\
_NEXT_PUBLIC_SUPABASE_URL="https://yrelfdwkjtaidtoulwrj.supabase.co",\
_NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWxmZHdranRhaWR0b3Vsd3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDU3ODQsImV4cCI6MjA4ODY4MTc4NH0.FpFw_TINjRTeSRK54PFa-NoLa5R9ctx8y5h4_wmoBfk",\
_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWxmZHdranRhaWR0b3Vsd3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEwNTc4NCwiZXhwIjoyMDg4NjgxNzg0fQ.YFqGcueb4VKoMUyIfpgiw7pXIKlYjeSp7ajdMp2NVlY",\
_NEXT_PUBLIC_SITE_URL="https://mededuai.netlify.app",\
_ALLOWED_ORIGINS="https://www.mededuai.com,https://mededuai.com,https://mededuai.netlify.app",\
_GEMINI_API_KEY="AIzaSyC6Oo5mTCxphLc6p4QkKxsqx9QdOoyuBxQ",\
_RESEND_API_KEY="re_6QfYAbdJ_Nme12TLYW2xZqYcNi4WXxjMn"
```

---

## Step 5 — Save the Notes to DB

After Steps 1-4:
1. Go to `mededuai.com/dashboard/admin/creator` as Super Admin
2. A green banner confirms DB is connected
3. Click **"Save 3 Notes to DB"**
4. Notes appear for all users on the notes page

---

## Why Notes Are Blank Right Now

The `lms_content` table has columns: `introduction`, `detailed_notes`, `summary`, `flashcards`  
But the save code tries to write: `marks_10_questions`, `marks_5_questions`, etc.  
Supabase rejects the entire INSERT when it sees unknown columns → nothing gets saved at all.  
Step 1 (SQL migration) adds those columns → saves will work immediately.
