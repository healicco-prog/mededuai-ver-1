$envVars = @{}
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^(?!#)([^=]+)=(.*)$') {
        $envVars[$Matches[1]] = $Matches[2].Trim()
    }
}

$NEXT_PUBLIC_SITE_URL = "https://mededuai.com"

$substitutions = @(
    "_NEXT_PUBLIC_SUPABASE_URL=$($envVars['NEXT_PUBLIC_SUPABASE_URL'])",
    "_NEXT_PUBLIC_SUPABASE_ANON_KEY=$($envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'])",
    "_NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL",
    "_SUPABASE_SERVICE_ROLE_KEY=$($envVars['SUPABASE_SERVICE_ROLE_KEY'])",
    "_RESEND_API_KEY=$($envVars['RESEND_API_KEY'])",
    "_GEMINI_API_KEY=$($envVars['GEMINI_API_KEY'])",
    "_CRON_SECRET=$($envVars['CRON_SECRET'])",
    "_ADMIN_SECRET=$($envVars['ADMIN_SECRET'])"
) -join ","

Write-Host "Submitting build to Cloud Build with correct substitutions..."
gcloud builds submit --config cloudbuild.yaml --substitutions=$substitutions .
