# Production Fix — Run These Steps in Order

---

## ⚡ IMMEDIATE FIX (No rebuild needed — run this NOW)

The save button fails because Cloud Run is verifying your login token against the **wrong Supabase project** (PGMentor instead of MedEduAI-1). This one command fixes it instantly — no code rebuild, no git push needed:

```bash
gcloud run services update mededuai-backend \
  --region=us-central1 \
  --update-env-vars="SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY_HERE>" \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://yrelfdwkjtaidtoulwrj.supabase.co" \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ANON_KEY_HERE>"
```

After this command completes (~30 seconds), **click "Save N Notes to DB" again** — it should work immediately.

---

## Full Deployment (To keep all fixes permanent)

### Step 1 — Run This SQL in Supabase

Open: https://supabase.com/dashboard/project/yrelfdwkjtaidtoulwrj/sql

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

### Step 2 — Update Netlify Environment Variables

Go to: https://app.netlify.com → Your site → Site settings → Environment variables

Add/update:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://yrelfdwkjtaidtoulwrj.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<YOUR_ANON_KEY_HERE>`
- `NEXT_PUBLIC_ADMIN_SECRET` = `mededuai-superadmin-2024`

---

### Step 3 — Commit & Push Code Fixes

```bash
git add -A
git commit -m "fix: remove x-admin-secret from save headers (CORS), robust JWT fallback"
git push
```

This triggers Netlify rebuild automatically.

---

### Step 4 — Rebuild Cloud Run

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=\
_NEXT_PUBLIC_SUPABASE_URL="https://yrelfdwkjtaidtoulwrj.supabase.co",\
_NEXT_PUBLIC_SUPABASE_ANON_KEY="<YOUR_ANON_KEY_HERE>",\
_SUPABASE_SERVICE_ROLE_KEY="<YOUR_SERVICE_ROLE_KEY_HERE>",\
_NEXT_PUBLIC_SITE_URL="https://mededuai.netlify.app",\
_ALLOWED_ORIGINS="https://www.mededuai.com,https://mededuai.com,https://mededuai.netlify.app",\
_GEMINI_API_KEY="<YOUR_GEMINI_API_KEY_HERE>",\
_RESEND_API_KEY="<YOUR_RESEND_API_KEY_HERE>",\
_ADMIN_SECRET="mededuai-superadmin-2024"
```

---

## What Was Fixed in the Code

**CORS Error ("Network: Failed to fetch"):**
The `x-admin-secret` custom header was being sent in save requests. The currently deployed Cloud Run doesn't list that header in `Access-Control-Allow-Headers`, so the browser's CORS preflight fails before the request even reaches the server. Fix: removed `x-admin-secret` from save/delete request headers. The JWT Bearer token is used exclusively for auth.

**"Saved 0 topics. X failed" (401 Unauthorized):**
Cloud Run's `SUPABASE_SERVICE_ROLE_KEY` was pointing to PGMentor. When it tried to verify the user's MedEduAI-1 JWT, it failed → 401. The immediate fix is the `gcloud run services update` command at the top of this file.

**Auth token not found when Netlify URL is wrong:**
Added `getAccessToken()` in the creator client — a multi-layer fallback that scans all `sb-*-auth-token` keys in localStorage to find the correct session token regardless of which Supabase URL the client was initialised with.

**lms_content INSERT failing (missing columns):**
Added `trySave` fallback in `save/route.ts` — retries with core columns only if `marks_*` columns are missing.
