@echo off
title Job Tracker - Clean Install for Windows
echo ====================================================
echo Cleaning and Installing Dependencies for Windows...
echo ====================================================

echo 1. Cleaning node_modules...
if exist "node_modules" rmdir /s /q node_modules

echo 2. Cleaning lockfiles...
if exist "package-lock.json" del /f /q package-lock.json

echo 3. Ensuring .env exists...
if exist ".env.txt" move /y ".env.txt" ".env" >nul
if not exist ".env" copy .env.example .env >nul

echo 4. Installing dependencies...
call npm install

echo 5. Ensuring Windows native binary dependencies...
if not exist "node_modules\lightningcss-win32-x64-msvc" (
    call npm install lightningcss-win32-x64-msvc@1.32.0 @tailwindcss/oxide-win32-x64-msvc@4.3.3 @rolldown/binding-win32-x64-msvc@1.2.12 @esbuild/win32-x64@0.28.0 --no-save
)

echo ====================================================
echo Dependencies installed successfully!
echo Starting dev server on http://localhost:3000 ...
echo ====================================================
call npm run dev
pause
