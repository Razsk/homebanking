# Nordea Homebanking Startup Script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starter Nordea Homebanking & Tracker   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/3] Installerer pakker..." -ForegroundColor Yellow
    npm install
}

# Check database
if (-not (Test-Path "dev.db")) {
    Write-Host "[2/3] Klargør lokal database og seed-data..." -ForegroundColor Yellow
    npx prisma db push
    npm run seed
} else {
    Write-Host "[2/3] Lokal database fundet (dev.db)" -ForegroundColor Green
}

# Start server and open browser
Write-Host "[3/3] Starter udviklingsserver pa http://localhost:3000..." -ForegroundColor Green
Write-Host ""
Write-Host "Tryk Ctrl+C for at stoppe serveren." -ForegroundColor Gray
Write-Host ""

# Open browser in background after 2 seconds
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
} | Out-Null

npm run dev
