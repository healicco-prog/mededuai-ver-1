$envVars = @{}

# 1. Load from .env.local first
if (Test-Path .env.local) {
    Get-Content .env.local | ForEach-Object {
        if ($_ -match '^(?!#)([^=]+)=(.*)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            # Strip quotes if present
            if ($val -match '^"(.*)"$') { $val = $Matches[1] }
            $envVars[$key] = $val
        }
    }
}

# 2. Load from env_vars.yaml (override or fill gaps)
if (Test-Path env_vars.yaml) {
    Get-Content env_vars.yaml | ForEach-Object {
        if ($_ -match '^([^:]+):\s*"([^"]+)"$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            $envVars[$key] = $val
        } elseif ($_ -match '^([^:]+):\s*(.+)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            if ($val -match '^"(.*)"$') { $val = $Matches[1] }
            $envVars[$key] = $val
        }
    }
}

# Validate required variables
$requiredKeys = @(
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'GEMINI_API_KEY',
    'CRON_SECRET',
    'ADMIN_SECRET'
)

Write-Host "--- Environment Variables Loaded ---"
foreach ($k in $requiredKeys) {
    $v = $envVars[$k]
    if (-not $v) {
        Write-Warning "Missing environment variable: $k"
    } else {
        # Mask the middle of the key for display/logging safety
        $len = $v.Length
        if ($len -gt 8) {
            $masked = $v.Substring(0, 4) + "..." + $v.Substring($len - 4)
        } else {
            $masked = "..."
        }
        Write-Host "$k = $masked"
    }
}

$SITE_URL = if ($envVars['NEXT_PUBLIC_SITE_URL']) { $envVars['NEXT_PUBLIC_SITE_URL'] } else { "https://mededuai.com" }
Write-Host "NEXT_PUBLIC_SITE_URL = $SITE_URL"

$substitutions = @(
    "_NEXT_PUBLIC_SUPABASE_URL=$($envVars['NEXT_PUBLIC_SUPABASE_URL'])",
    "_NEXT_PUBLIC_SUPABASE_ANON_KEY=$($envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'])",
    "_NEXT_PUBLIC_SITE_URL=$SITE_URL",
    "_SUPABASE_SERVICE_ROLE_KEY=$($envVars['SUPABASE_SERVICE_ROLE_KEY'])",
    "_RESEND_API_KEY=$($envVars['RESEND_API_KEY'])",
    "_GEMINI_API_KEY=$($envVars['GEMINI_API_KEY'])",
    "_CRON_SECRET=$($envVars['CRON_SECRET'])",
    "_ADMIN_SECRET=$($envVars['ADMIN_SECRET'])"
) -join ","

Write-Host "Submitting build to Cloud Build..."
gcloud builds submit --config cloudbuild.yaml --substitutions=$substitutions .
