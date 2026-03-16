# Restart Frontend Development Server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting Frontend Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop all node processes
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Node processes stopped." -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory and start server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Set-Location -Path "frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting npm..." -ForegroundColor Cyan
Write-Host "Wait for 'Compiled successfully!' message" -ForegroundColor Green
Write-Host "Then refresh browser with Ctrl+Shift+R" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm start
