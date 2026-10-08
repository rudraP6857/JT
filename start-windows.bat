@echo off
title StatusHired Dev Server
echo ====================================================
echo Starting StatusHired Local Development Server...
echo ====================================================

if exist ".env.txt" (
    echo [Info] Found .env.txt - automatically renaming to .env...
    move /y ".env.txt" ".env" >nul
)

if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env >nul
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

if not exist "node_modules\lightningcss-win32-x64-msvc" (
    echo Verifying Windows native binary dependencies...
    call npm install lightningcss-win32-x64-msvc@1.32.0 @tailwindcss/oxide-win32-x64-msvc@4.3.3 @rolldown/binding-win32-x64-msvc@1.2.12 @esbuild/win32-x64@0.28.0 --no-save
)

echo Starting Vite server on http://localhost:3000 ...
call npm run dev
pause
