# MedEduAI - Deployment Guide

## Architecture Overview
This application is built with:
- **Next.js (App Router)** - Production-ready frontend and backend APIs.
- **Supabase** - Authentication, PostgreSQL Database, Storage.
- **Gemini API** - AI capabilities.
- **Google Cloud Run** - Serverless scaling and Docker deployment.

---

## 🚀 Deployment to Google Cloud Run

To containerize and deploy this application, follow these steps:

### 1. Prerequisites
- Create a Free Tier account or start a Google Cloud Project.
- Install the `gcloud CLI` on your local machine.
- Verify billing is enabled for your project (required for Cloud Run, though it has a generous free tier).
- Enable the **Cloud Build API**, **Cloud Run API**, and **Artifact Registry API**.

### 2. Connect environment variables
Go to Google Cloud Secret Manager and add your secrets safely. (You can also map these directly through the Cloud Run UI during deployment):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Used securely by the server API for admin bypass if needed)
- `GEMINI_API_KEY` (Required for AI endpoints)

### 3. Deploy from CLI 
Ensure you are in the root directory where the `Dockerfile` exists, and run:

```bash
gcloud run deploy mededuai-portal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=YOUR_KEY"
```

**(Alternative) CI/CD Github Integration**
1. Connect your GitHub repository to Google Cloud Build.
2. Google Cloud will automatically detect the Next.js `Dockerfile` and build/deploy to Cloud Run with zero-downtime upon every merge to `main`.

---

## 🔐 GoDaddy Custom Domain Configuration
After successfully deploying to Cloud Run, you will get an auto-generated URL (e.g., `https://mededuai-portal-xyz.a.run.app`).

1. In the Google Cloud Console, navigate to **Cloud Run** -> **Manage Custom Domains**.
2. Click **Add Mapping** and enter `mededuai.com`.
3. Google Cloud will provide you with DNS Records (typically **CNAME** or **A** and **AAAA** records).
4. Log into your GoDaddy account and navigate to **DNS Management** for `mededuai.com`.
5. Enter the records exactly as provided by Google Cloud.
6. Wait 15-30 minutes for DNS propagation. SSL certificates will be provisioned automatically by Google.

---

## 🗄️ Initializing the Database

Navigate to the `supabase/migrations/` directory.

### Quick Setup:
If using a managed Supabase project, go to your Supabase Dashboard -> **SQL Editor** -> **New Query**, and copy-paste the contents of `0000_schema.sql` to instantiate the database.

### Local Setup (Using Supabase CLI):
```bash
npx supabase init
npx supabase start
```
This will spin up local Postgres and automatically run the migrations inside `./supabase/migrations/`. 

---
_Deployed automatically by your AI Agent assistant._
