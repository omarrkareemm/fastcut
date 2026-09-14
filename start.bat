@echo off
title Motion Blur Studio
color 0A

echo ============================================
echo  Starting Motion Blur Studio
echo ============================================
echo.

echo [1/4] Writing project files...
node bootstrap.mjs
if %errorlevel% neq 0 ( echo Failed. & pause & exit /b )

echo.
echo [2/4] Fetching RIFE model (one-time, ~40 MB)...
node fetch-model.mjs

echo.
echo [3/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 ( echo Failed. & pause & exit /b )

echo.
echo [4/4] Starting development server...
echo.
echo ============================================
echo  App starting at http://localhost:5173
echo  Press Ctrl+C to stop.
echo ============================================
echo.
call npm run dev

pause