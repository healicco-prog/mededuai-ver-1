@echo off
REM ────────────────────────────────────────────────────────────────────
REM clean-and-dev.bat — fully reset Next.js dev environment
REM
REM Use this when you see:
REM   "Cannot read properties of undefined (reading 'call')"
REM   in chunks like .next\static\chunks\app\*\page.js
REM
REM That error means webpack chunk module IDs in the browser have drifted
REM from the freshly-compiled chunks on disk. The fix is to nuke .next and
REM let Next.js rebuild everything from scratch.
REM ────────────────────────────────────────────────────────────────────

echo Stopping any running Next.js dev servers on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

echo Removing .next build cache...
if exist .next (
    rmdir /S /Q .next
)

echo Removing node_modules\.cache (Turbopack/SWC cache)...
if exist node_modules\.cache (
    rmdir /S /Q node_modules\.cache
)

echo Cache cleared. Starting fresh dev server on port 3001...
echo (If port 3001 is busy, npm will pick the next free one.)
echo.

call npm run dev -- -p 3001
