@echo off
title Fastcut — Deploy to GitHub Pages
color 0A

set REPO_URL=https://github.com/omarrkareemm/fastcut.git

echo ============================================
echo  Deploying Fastcut to GitHub Pages
echo ============================================
echo.

echo [1/5] Writing project files...
node bootstrap.mjs
if %errorlevel% neq 0 ( echo Failed. & pause & exit /b )

echo.
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 ( echo Failed. & pause & exit /b )

echo.
echo [3/5] Testing local build...
call npm run build
if %errorlevel% neq 0 ( echo Build failed. & pause & exit /b )

echo.
echo [4/5] Staging and committing...
if not exist .git (
  echo Initializing new git repository...
  git init
  git branch -M main
)

git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
  echo Adding remote origin...
  git remote add origin %REPO_URL%
)

git add -A
git diff --cached --quiet
if %errorlevel% equ 0 (
  echo Nothing to commit.
) else (
  git commit -m "Update Fastcut"
)

echo.
echo [5/5] Pushing to GitHub...

REM Capture push output to a temp file, check for 'fatal' or 'error:'
git push -u origin main > "%TEMP%\fastcut_push.log" 2>&1
type "%TEMP%\fastcut_push.log"

findstr /C:"fatal" /C:"error:" /C:"rejected" "%TEMP%\fastcut_push.log" >nul
if %errorlevel% equ 0 (
  echo.
  echo Push failed. Check output above.
  pause
  exit /b
)

echo.
echo ============================================
echo  Pushed successfully.
echo.
echo  GitHub Actions will now build and deploy.
echo  Watch progress: %REPO_URL%/actions
echo.
echo  Live site: https://omarrkareemm.github.io/fastcut/
echo ============================================
pause