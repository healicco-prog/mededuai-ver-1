@echo off
echo ========================================
echo  MedEduAI - Pushing Fix to GitHub
echo ========================================
echo.

cd /d "C:\Users\Dr Narayana K\Documents\mededuai Ver 1"

echo Step 1: Removing stale git lock file...
if exist ".git\index.lock" (
    del /f ".git\index.lock"
    echo Lock file removed.
) else (
    echo No lock file found.
)

echo.
echo Step 2: Staging changes...
git add src\app\dashboard\admin\creator\CreatorManagerClient.tsx
git add src\lib\supabaseAdmin.ts
git add src\lib\authMiddleware.ts
git add cloudbuild.yaml

echo.
echo Step 3: Committing...
git commit -m "fix: correct DB schema - topics has section column, not sections table"

echo.
echo Step 4: Pushing to GitHub (triggers Netlify rebuild)...
git push

echo.
echo ========================================
echo  Done! Netlify will rebuild in ~2 mins.
echo  Then click "Save 2 Notes to DB" again.
echo ========================================
echo.
pause
