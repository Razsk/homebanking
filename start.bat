@echo off
title Nordea Homebanking
echo =========================================
echo   Starter Nordea Homebanking ^& Tracker
echo =========================================
echo.

if not exist "node_modules\" (
    echo [1/3] Installerer pakker...
    call npm install
)

if not exist "dev.db" (
    echo [2/3] Klargor lokal database og seed-data...
    call npx prisma db push
    call npm run seed
) else (
    echo [2/3] Lokal database fundet (dev.db)
)

echo [3/3] Starter udviklingsserver pa http://localhost:3000...
echo.

start "" "http://localhost:3000"
call npm run dev
pause
