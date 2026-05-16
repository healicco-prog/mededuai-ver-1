# 🌐 Netlify Deployment Guide (Production)

Follow these steps to deploy the frontend to Netlify safely.

### 1. Build Settings
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Node Version:** 18.x or 20.x

### 2. Environment Variables (Netlify UI)
Go to **Site Settings > Environment variables** and add ONLY these public-safe variables:

| Key | Value | Purpose |
|:--- |:--- |:--- |
| `NEXT_PUBLIC_BACKEND_URL` | `https://mededuai-backend-434817580915.us-central1.run.app` | Targets the Cloud Run backend |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yrelfdwkjtaidtoulwrj.supabase.co` | Public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Public Supabase Anon Key |
| `NEXT_PUBLIC_SITE_URL` | `https://mededuai.com` | Your custom frontend domain |
| `NETLIFY` | `true` | Enables proxying logic |

### ⚠️ IMPORTANT: SECRETS CHECK
**DO NOT** add any of the following to Netlify:
- `SUPABASE_SERVICE_ROLE_KEY` (Stay in Cloud Run only)
- `GEMINI_API_KEY` (Stay in Cloud Run only)
- `RESEND_API_KEY` (Stay in Cloud Run only)
- `ADMIN_SECRET` (Stay in Cloud Run only)

### 3. Verification
Once deployed:
1. Try logging in with an existing user.
2. Check the browser console. You should see no `console.log` output (silenced in production).
3. Verify that AI requests (e.g. MCQ generation) work. They will bypass the Netlify 10s timeout by calling `api.mededuai.com` directly.
