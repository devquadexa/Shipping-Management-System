# Restart Backend Server - Local Machine (No Docker)

## Current Situation
- You're running the application locally on your machine
- Node.js backend is running
- Code changes have been made to add notification support
- Backend needs to be restarted to load the new code

## Quick Fix (2 Steps)

### Step 1: Stop the Backend Server

**Option A: Using PowerShell**
```powershell
# Kill all Node.js processes
Get-Process node | Stop-Process -Force

# Verify they're stopped
Get-Process node -ErrorAction SilentlyContinue
# Should return nothing
```

**Option B: Using Task Manager**
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Find "node.exe" processes
3. Right-click and select "End Task"
4. Repeat for all node.exe processes

**Option C: Using Command Line**
```cmd
taskkill /IM node.exe /F
```

### Step 2: Start the Backend Server

```bash
cd "d:\Work and Learn\Quadexa\Shipping Management System\backend-api"
npm start
```

Wait for the server to start. You should see:
```
Server running on port 5000
Database connected
```

## Test the Notification System

### Step 1: Create a Job and Assign to Waff Clerk 1

1. Open browser: http://localhost:5000
2. Login as Admin/Manager
3. Go to Jobs → Create New Job
4. Fill in all required fields
5. Assign to Waff Clerk 1
6. Click "Create Job" or "Assign"

### Step 2: Check Backend Console for Notification Logs

Look at the terminal/console where you ran `npm start`. You should see:

```
[AssignMultipleUsersToJob] Starting job assignment - jobId: JOB0001, userIds: ["USER0002"], assignedBy: USER0001
[AssignMultipleUsersToJob] createNotification available: true
[NOTIFICATION] createNotification is available, creating notifications for 1 assigned users
[NOTIFICATION] Creating JOB_ASSIGNED notification for user USER0002, job JOB0001
[CreateNotification] Creating notification for user USER0002, type: JOB_ASSIGNED
[CreateNotification] Generated notification ID: NOTIF00001
[CreateNotification] Persisting notification to database
[CreateNotification] Notification created successfully: {...}
[NOTIFICATION] Successfully created notification for user USER0002, result: {...}
```

### Step 3: Check Database for Notification

```bash
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"
```

Should show a notification record with:
- `type = 'JOB_ASSIGNED'`
- `userId = WAFF_CLERK_1_ID`
- `isRead = 0`

### Step 4: Check Frontend Notification Bell

1. Logout from Admin account
2. Login as Waff Clerk 1
3. Look at notification bell in top navbar
4. Should see red badge with "1"
5. Click bell to see notification

## Troubleshooting

### Issue: Backend won't start
```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# If port is in use, kill the process
taskkill /PID <PID> /F

# Then try starting again
npm start
```

### Issue: "Cannot find module" error
```bash
# Reinstall dependencies
cd backend-api
npm install

# Then start
npm start
```

### Issue: Database connection error
```bash
# Verify SQL Server is running
# Check connection string in config/database.js
# Verify credentials are correct
```

### Issue: No notification logs appear
```bash
# Backend might not have restarted properly
# Kill all node processes and restart:
taskkill /IM node.exe /F
npm start

# Wait 5-10 seconds for full startup
```

### Issue: Notification created but not showing in frontend
```bash
# Frontend might need to be rebuilt
cd frontend
npm run build

# Then refresh browser (Ctrl+Shift+R for hard refresh)
```

## Complete Restart Procedure

If you want to do a complete restart of everything:

```bash
# 1. Kill all Node processes
taskkill /IM node.exe /F

# 2. Wait 2 seconds
timeout /t 2

# 3. Start backend
cd "d:\Work and Learn\Quadexa\Shipping Management System\backend-api"
npm start

# In another terminal/PowerShell window:
# 4. Start frontend (if needed)
cd "d:\Work and Learn\Quadexa\Shipping Management System\frontend"
npm start
```

## Verify Everything is Working

After restart, verify:

- [ ] Backend console shows "Server running on port 5000"
- [ ] Backend console shows "Database connected"
- [ ] Frontend loads at http://localhost:3000 (or your frontend port)
- [ ] Can login to application
- [ ] Can create job and assign to waff clerk
- [ ] Backend console shows notification logs
- [ ] Database has notification record
- [ ] Notification bell shows badge in frontend
- [ ] Clicking bell shows notification

## Quick Reference Commands

```bash
# Kill all Node processes
taskkill /IM node.exe /F

# Start backend
cd backend-api && npm start

# Start frontend
cd frontend && npm start

# Check if port is in use
netstat -ano | findstr :5000

# Check database
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"

# Rebuild frontend
cd frontend && npm run build
```

## Expected Behavior After Restart

1. ✅ Admin creates job and assigns to Waff Clerk 1
2. ✅ Backend logs show notification creation messages
3. ✅ Notification record appears in database
4. ✅ Waff Clerk 1 logs in
5. ✅ Notification bell shows red badge with count
6. ✅ Clicking bell shows notification details
7. ✅ Marking as read works
8. ✅ Notification disappears from unread list

---

**Status:** Ready to restart
**Last Updated:** May 24, 2026
**Version:** 1.0.0
