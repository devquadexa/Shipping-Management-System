#!/bin/bash

# Deployment script for Shipping Management System
# Server: 72.61.169.242

echo "=========================================="
echo "Deploying to Production Server"
echo "=========================================="

# SSH into server and deploy
ssh root@72.61.169.242 << 'ENDSSH'
    echo "Connected to server..."
    
    # Navigate to application directory
    cd /root/Shipping-Management-System || exit 1
    echo "Current directory: $(pwd)"
    
    # Pull latest changes
    echo "Pulling latest changes from GitHub..."
    git pull origin main
    
    # Check if pull was successful
    if [ $? -eq 0 ]; then
        echo "✓ Code updated successfully"
    else
        echo "✗ Failed to pull changes"
        exit 1
    fi
    
    # Install/update backend dependencies (if needed)
    echo "Checking backend dependencies..."
    cd backend-api
    npm install --production
    
    # Restart the application using PM2
    echo "Restarting application..."
    pm2 restart shipping-management
    
    # Check PM2 status
    echo "Application status:"
    pm2 status shipping-management
    
    echo ""
    echo "=========================================="
    echo "Deployment completed successfully!"
    echo "=========================================="
    
ENDSSH

echo ""
echo "Deployment script finished."
echo "Please verify the application at: http://72.61.169.242:5000"
