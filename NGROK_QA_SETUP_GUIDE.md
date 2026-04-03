# Ngrok QA Setup Guide - Keep MSSQL, Share Link in 5 Minutes

Complete step-by-step guide to expose your local Super Shine Cargo application to QA team using Ngrok.

---

## What is Ngrok?

Ngrok creates a secure tunnel from a public URL to your local application. Your QA team gets a link like `https://abc123.ngrok-free.app` that connects to your local machine.

**Perfect for:**
- ✅ Quick QA testing
- ✅ No code changes needed
- ✅ Keep using MSSQL
- ✅ Setup in 5 minutes
- ✅ 100% FREE

**Requirements:**
- Your computer must stay on during testing
- Stable internet connection
- Local MSSQL database running

---

## Part 1: Download and Install Ngrok (2 minutes)

### Step 1: Download Ngrok

1. Open browser and go to: **https://ngrok.com/download**
2. Click "Download for Windows"
3. Save the ZIP file (e.g., to Downloads folder)

### Step 2: Extract Ngrok

1. Right-click the downloaded ZIP file
2. Click "Extract All"
3. Extract to: `C:\ngrok\`
4. You should now have: `C:\ngrok\ngrok.exe`

---

## Part 2: Create Ngrok Account (2 minutes)

### Step 1: Sign Up

1. Go to: **https://dashboard.ngrok.com/signup**
2. Sign up with:
   - Email and password, OR
   - GitHub account, OR
   - Google account
3. Verify your email (check inbox)

### Step 2: Get Your Auth Token

1. After login, you'll see: **https://dashboard.ngrok.com/get-started/your-authtoken**
2. Copy your auth token (looks like: `2abc123def456ghi789jkl0`)
3. Keep this page open

### Step 3: Authenticate Ngrok

1. Open **Command Prompt** or **PowerShell**
2. Run:
   ```bash
   cd C:\ngrok
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```
   Replace `YOUR_TOKEN_HERE` with your actual token

3. You should see: `Authtoken saved to configuration file`

---

## Part 3: Start Your Application (3 minutes)

### Step 1: Start SQL Server

1. Open **SQL Server Configuration Manager**
2. Verify **SQL Server (SQLEXPRESS)** is running
3. If not, right-click → Start

### Step 2: Start Backend API

1. Open **Command Prompt** or **PowerShell** (Terminal 1)
2. Navigate to your project:
   ```bash
   cd C:\path\to\your\project\backend-api
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```
4. Wait for: `Server running on port 5000` and `Database connected successfully`
5. **Keep this terminal open!**

### Step 3: Start Frontend

1. Open **NEW Command Prompt** or **PowerShell** (Terminal 2)
2. Navigate to frontend:
   ```bash
   cd C:\path\to\your\project\frontend
   ```
3. Start the frontend:
   ```bash
   npm start
   ```
4. Wait for: `Compiled successfully!` and browser opens at `http://localhost:3000`
5. **Keep this terminal open!**

### Step 4: Verify Local Setup

1. Browser should open automatically to `http://localhost:3000`
2. Try logging in:
   - Username: `superadmin`
   - Password: `admin123`
3. If login works, you're ready for Ngrok!

---

## Part 4: Expose with Ngrok (1 minute)

### Step 1: Start Ngrok

1. Open **NEW Command Prompt** or **PowerShell** (Terminal 3)
2. Run:
   ```bash
   cd C:\ngrok
   ngrok http 3000
   ```

### Step 2: Get Your Public URL

You'll see output like this:
```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

3. **Copy the Forwarding URL**: `https://abc123def456.ngrok-free.app`
4. **Keep this terminal open!**

---

## Part 5: Share with QA Team (1 minute)

### Send This Information:

```
🎯 Super Shine Cargo - QA Environment

Access URL: https://abc123def456.ngrok-free.app

Login Credentials:
Username: superadmin
Password: admin123

⚠️ Important Notes:
- This link is active during business hours (9 AM - 6 PM)
- If you see "Session Expired", contact me for new link
- First load may show ngrok warning page - click "Visit Site"
- Report any bugs with screenshots

Environment: QA Testing
Database: Local MSSQL
Status: Active
```

---

## Part 6: Using Ngrok (Daily Workflow)

### Every Morning (Starting QA Session):

**Terminal 1 - Backend:**
```bash
cd C:\path\to\project\backend-api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd C:\path\to\project\frontend
npm start
```

**Terminal 3 - Ngrok:**
```bash
cd C:\ngrok
ngrok http 3000
```

**Copy the new URL and send to QA team** (URL changes each time)

### Every Evening (Ending QA Session):

1. Press `Ctrl + C` in each terminal
2. Type `Y` to confirm
3. Close terminals

---

## Part 7: Ngrok Dashboard (Monitoring)

### View Connections

1. While ngrok is running, open browser
2. Go to: **http://localhost:4040**
3. You'll see:
   - All HTTP requests
   - Response times
   - Request/response details
   - Replay requests

This is useful for debugging issues QA reports!

---

## Troubleshooting

### Issue: "ngrok not found" or "command not found"

**Solution:**
```bash
# Make sure you're in the right directory
cd C:\ngrok

# Or add to PATH:
# 1. Search "Environment Variables" in Windows
# 2. Edit "Path" variable
# 3. Add: C:\ngrok
# 4. Restart terminal
```

### Issue: "Failed to authenticate"

**Solution:**
```bash
# Re-authenticate
cd C:\ngrok
ngrok config add-authtoken YOUR_TOKEN
```

### Issue: QA sees "ngrok warning page"

**This is normal for free tier!**
- QA clicks "Visit Site" button
- They'll see this once per session
- To remove: Upgrade to ngrok paid ($8/month)

### Issue: "ERR_NGROK_3200" or tunnel closed

**Causes:**
- Internet connection dropped
- Ngrok session expired (8 hours on free tier)
- Computer went to sleep

**Solution:**
1. Stop ngrok (Ctrl + C)
2. Restart: `ngrok http 3000`
3. Send new URL to QA team

### Issue: Backend connection errors

**Check:**
1. Backend is running on port 5000
2. Frontend is running on port 3000
3. SQL Server is running
4. No firewall blocking localhost

**Solution:**
```bash
# Test backend
curl http://localhost:5000

# Test frontend
curl http://localhost:3000

# Check SQL Server
# Open SSMS and try connecting
```

### Issue: Slow performance

**Causes:**
- Your internet upload speed
- Distance between you and QA team
- Computer resources

**Solutions:**
- Close unnecessary applications
- Use wired internet (not WiFi)
- Check your upload speed: https://speedtest.net
- Consider upgrading to ngrok paid for better performance

---

## Tips for Better Ngrok Experience

### 1. Prevent Computer Sleep

**Windows:**
1. Settings → System → Power & Sleep
2. Set "When plugged in, PC goes to sleep after": **Never**
3. Set "When plugged in, turn off screen after": **Never** (or 30 minutes)

### 2. Keep Terminals Organized

Use Windows Terminal or create a batch file:

**Create**: `start-qa-environment.bat`
```batch
@echo off
echo Starting Super Shine Cargo QA Environment...
echo.

echo [1/3] Starting Backend...
start "Backend API" cmd /k "cd /d C:\path\to\project\backend-api && npm run dev"
timeout /t 10

echo [2/3] Starting Frontend...
start "Frontend" cmd /k "cd /d C:\path\to\project\frontend && npm start"
timeout /t 15

echo [3/3] Starting Ngrok...
start "Ngrok" cmd /k "cd /d C:\ngrok && ngrok http 3000"

echo.
echo ✅ All services started!
echo Check the Ngrok terminal for your public URL
pause
```

Double-click this file to start everything at once!

### 3. Create a Stop Script

**Create**: `stop-qa-environment.bat`
```batch
@echo off
echo Stopping all services...
taskkill /FI "WindowTitle eq Backend API*" /T /F
taskkill /FI "WindowTitle eq Frontend*" /T /F
taskkill /FI "WindowTitle eq Ngrok*" /T /F
echo ✅ All services stopped!
pause
```

### 4. Fixed URL (Paid Feature)

If you want a URL that doesn't change:

**Ngrok Paid Plan**: $8/month
- Fixed domain: `https://yourcompany.ngrok.app`
- No session limits
- No warning page
- Better performance

To upgrade:
1. Go to: https://dashboard.ngrok.com/billing
2. Choose "Personal" plan ($8/month)
3. Set custom domain

---

## Ngrok Free Tier Limitations

### What's Limited:
- ❌ URL changes every restart
- ❌ 1 online tunnel at a time
- ❌ 40 connections per minute
- ❌ Session expires after 8 hours
- ❌ Shows warning page to visitors

### What's NOT Limited:
- ✅ Unlimited data transfer
- ✅ Unlimited requests
- ✅ HTTPS included
- ✅ Can use daily
- ✅ No time restrictions (just restart after 8 hours)

### For QA Testing:
These limitations are usually fine! QA team can:
- Click through warning page (one-time per session)
- Use the app normally
- Test all features
- Report bugs

---

## Alternative: Ngrok + Static IP (Advanced)

If you have a static IP at home/office:

### Option 1: Port Forwarding
1. Configure router to forward port 3000
2. QA accesses: `http://YOUR_PUBLIC_IP:3000`
3. No ngrok needed
4. Free forever

### Option 2: Dynamic DNS
1. Use service like No-IP.com (free)
2. Get domain like: `yourcompany.ddns.net`
3. QA accesses: `http://yourcompany.ddns.net:3000`
4. More professional than IP address

---

## Security Considerations

### For Ngrok:
- ✅ HTTPS encryption included
- ✅ Tunnel is secure
- ⚠️ Anyone with URL can access
- ⚠️ Don't share URL publicly

### Recommendations:
1. **Use strong passwords** for all accounts
2. **Don't use production data** in QA environment
3. **Change URL regularly** (happens automatically with free tier)
4. **Monitor ngrok dashboard** for suspicious activity
5. **Create separate QA user accounts** (not superadmin)

---

## Cost Comparison

| Duration | Ngrok Free | Ngrok Paid | Railway | Oracle Cloud |
|----------|------------|------------|---------|--------------|
| 1 week | $0 | $8 | $0 | $0 |
| 1 month | $0 | $8 | $0-5 | $0 |
| 3 months | $0 | $24 | $0-15 | $0 |
| 1 year | $0 | $96 | $0-60 | $0 |

**Ngrok Free = $0 forever** (with limitations)

---

## Quick Start Commands

### Start Everything:
```bash
# Terminal 1 - Backend
cd C:\path\to\project\backend-api
npm run dev

# Terminal 2 - Frontend  
cd C:\path\to\project\frontend
npm start

# Terminal 3 - Ngrok
cd C:\ngrok
ngrok http 3000
```

### Stop Everything:
Press `Ctrl + C` in each terminal, then type `Y`

---

## FAQ

**Q: How long can QA team use the link?**
A: Until you stop ngrok or 8 hours (whichever comes first). Then restart and send new link.

**Q: Can multiple QA testers use it simultaneously?**
A: Yes! Free tier allows 40 connections/minute (plenty for QA team).

**Q: What if my computer restarts?**
A: Restart all services and ngrok, then send new URL to QA team.

**Q: Can I schedule QA testing hours?**
A: Yes! Start ngrok during QA hours (e.g., 9 AM - 5 PM), stop after.

**Q: Is my data secure?**
A: Yes, ngrok uses HTTPS encryption. But don't use production data in QA.

**Q: Can I use a custom domain?**
A: Yes, but requires ngrok paid plan ($8/month).

---

## Next Steps

1. Download ngrok (2 minutes)
2. Sign up and authenticate (2 minutes)
3. Start your app (3 minutes)
4. Run ngrok (1 minute)
5. Share URL with QA team
6. Start testing!

**Ready to start? Follow the steps above!**

---

## Need Help?

If you encounter any issues:
1. Check that all 3 terminals are running
2. Verify SQL Server is running
3. Test locally first (http://localhost:3000)
4. Check ngrok dashboard (http://localhost:4040)
5. Review error messages in terminals

**Let me know if you need help with any step!**
