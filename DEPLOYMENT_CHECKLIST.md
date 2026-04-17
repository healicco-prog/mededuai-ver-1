# MedEduAI → PGMentor Ver 1: Deployment Checklist

## What Was Changed (Already Done)

✅ `.env.local` — Supabase URL + keys updated to `qnguxwmrqwcksspujmoa`  
✅ `.env.production` — Same  
✅ `.netlify/functions-internal/___netlify-server-handler/.env.local` — Same  
✅ `.netlify/functions-internal/___netlify-server-handler/.env.production` — Same  
✅ `supabase_setup_pgmentor_v1.sql` — Complete schema setup SQL created  
✅ `CreatorManagerClient.tsx` — Auto-save is now **synchronous** (awaited, 3 retries, confirmed DB write before moving to next topic)  
✅ `CreatorManagerClient.tsx` — Batch size increased **2 → 4** (4 topics generate in parallel, ~2× faster)  

---

## Steps You Must Complete

### Step 1: Run SQL Setup in Supabase

1. Open https://supabase.com/dashboard/project/qnguxwmrqwcksspujmoa
2. Go to **SQL Editor**
3. Open the file `supabase_setup_pgmentor_v1.sql` from your project folder
4. Click **Run** — this creates all tables, RLS policies, and triggers

### Step 2: Set Your Superadmin Role

After running the SQL, create your user account in the app (or via Auth > Add User in Supabase dashboard), then run in SQL Editor:

```sql
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'healicco@gmail.com';
UPDATE public.users SET role = 'super_admin' WHERE email = 'healicco@gmail.com';
```

### Step 3: Update Cloud Run Environment Variables

The backend API runs on Google Cloud Run. Its env vars are stored as Cloud Build substitution variables — these must be updated separately.

**Option A: via Google Cloud Console (UI)**
1. Go to https://console.cloud.google.com/cloud-build/triggers
2. Find the `mededuai-backend` trigger
3. Click Edit → scroll to "Substitution variables"
4. Update these values:

| Variable | New Value |
|---|---|
| `_NEXT_PUBLIC_SUPABASE_URL` | `https://qnguxwmrqwcksspujmoa.supabase.co` |
| `_NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3V4d21ycXdja3NzcHVqbW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTI0MjAsImV4cCI6MjA5MDYyODQyMH0.BjmAwUO4Yq4AikcHn8d94dSTRDJxEpZKTY2aUaWptSk` |
| `_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3V4d21ycXdja3NzcHVqbW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA1MjQyMCwiZXhwIjoyMDkwNjI4NDIwfQ.5bRAK4rX4kaWJVITvlQ7WdoVcHpNcmD6GrlnR9Taz8o` |

**Option B: via gcloud CLI (direct env var update, faster)**
```bash
gcloud run services update mededuai-backend \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://qnguxwmrqwcksspujmoa.supabase.co" \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3V4d21ycXdja3NzcHVqbW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTI0MjAsImV4cCI6MjA5MDYyODQyMH0.BjmAwUO4Yq4AikcHn8d94dSTRDJxEpZKTY2aUaWptSk" \
  --update-env-vars="SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3V4d21ycXdja3NzcHVqbW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA1MjQyMCwiZXhwIjoyMDkwNjI4NDIwfQ.5bRAK4rX4kaWJVITvlQ7WdoVcHpNcmD6GrlnR9Taz8o"
```

### Step 4: Redeploy Backend (Cloud Run)

Trigger a new build to deploy the updated code + env vars:
```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_NEXT_PUBLIC_SUPABASE_URL="https://qnguxwmrqwcksspujmoa.supabase.co",\
_NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\
_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\
_NEXT_PUBLIC_SITE_URL="https://mededuai.netlify.app",\
_ALLOWED_ORIGINS="https://www.mededuai.com,https://mededuai.com,https://mededuai.netlify.app",\
_GEMINI_API_KEY="AIzaSyC6Oo5mTCxphLc6p4QkKxsqx9QdOoyuBxQ",\
_RESEND_API_KEY="re_6QfYAbdJ_Nme12TLYW2xZqYcNi4WXxjMn"
```

### Step 5: Redeploy Frontend (Netlify)

Push to Git — Netlify auto-deploys:
```bash
git add -A
git commit -m "Switch to PGMentor Ver 1 Supabase project; fix synchronous saves; 4× parallel batch generation"
git push
```

Also update Netlify environment variables in the Netlify dashboard:
- **Site settings → Environment variables**
- Add/update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## What's Fixed After All Steps Complete

| Problem | Fix |
|---|---|
| Content not saving to Supabase | Env vars now point to correct project; save is now synchronous (awaited) |
| "Unauthorized" during generation | Auth headers use `supabase.auth.getSession()` + force refresh every 5 topics |
| Notes not visible to users | Content saves directly to DB before moving to next topic |
| Slow generation (2 at a time) | Now 4 topics generate in parallel (2× faster) |
| PPT content (l10) missing from DB | Save and load routes both handle `ppt_content` column |
| No way to delete & regenerate | Delete button added in both creator and notes pages |
