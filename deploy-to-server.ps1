# Deployment script for Shipping Management System
# Server: 72.61.169.242

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploying to Production Server" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# SSH command to execute on server
$sshCommand = @"
cd /root/Shipping-Management-System && \
echo 'Current directory: ' && pwd && \
echo 'Pulling latest changes from GitHub...' && \
git pull origin main && \
echo 'Checking backend dependencies...' && \
cd backend-api && \
npm install --production && \
echo 'Restarting application...' && \
pm2 restart shipping-management && \
echo 'Application status:' && \
pm2 status shipping-management && \
echo '' && \
echo '==========================================' && \
echo 'Deployment completed successfully!' && \
echo '=========================================='
"@

# Execute SSH command
Write-Host "Connecting to server..." -ForegroundColor Yellow
ssh root@72.61.169.242 $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please verify the application at: http://72.61.169.242:5000" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
}
