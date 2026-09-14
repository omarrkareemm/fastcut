@echo off
title Fastcut — Deploy to GitHub Pages
color 0A

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

git add -A
git diff --cached --quiet
if %errorlevel% equ 0 (
  echo Nothing to commit.
) else (
  git commit -m "Update Fastcut"
)

echo.
echo [5/5] Pushing to GitHub...
git push -u origin main 2>nul
if %errorlevel% neq 0 (
  echo.
  echo ============================================
  echo  Push failed — this is normal the first time.
  echo ============================================
  echo.
  echo  1. Create the repo at https://github.com/new
  echo     Name it: fastcut  (public, no README)
  echo.
  echo  2. Then run this script again.
  echo.
  echo  Or, if the repo exists, connect it:
  echo     git remote add origin https://github.com/omarrkareemm/fastcut.git
  echo.
  pause
  exit /b
)

echo.
echo ============================================
echo  Pushed successfully.
echo.
echo  Now enable Pages ONE TIME:
echo    1. Open https://github.com/omarrkareemm/fastcut/settings/pages
echo    2. Source: "GitHub Actions"
echo    3. Wait ~2 minutes
echo    4. Visit https://omarrkareemm.github.io/fastcut/
echo ============================================
pause