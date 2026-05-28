@echo off
REM ============================================================================
REM Fixes the Control Panel "Invalid login credentials" error by re-syncing the
REM Super Admin and Master Admin accounts in Supabase. Safe to run repeatedly.
REM ============================================================================
cd /d "%~dp0"
echo.
echo [MedEduAI] Resetting Control Panel admin credentials...
echo.
node reset_admin_login.mjs %*
set EXITCODE=%ERRORLEVEL%
echo.
if "%EXITCODE%"=="0" (
    echo Done. You can now sign in at http://localhost:3000/contrl-panl
) else (
    echo Reset finished with errors. Scroll up to see what failed.
)
echo.
pause
