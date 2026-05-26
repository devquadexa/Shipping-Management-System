# Notification System - Complete Setup & Deployment Guide

## Current Status
✅ Backend code is ready with notification support
✅ Frontend notification bell is ready
✅ Database schema is ready
❌ **Backend Docker container needs to be rebuilt and restarted**

## Why Notifications Aren't Working

The Notifications table is empty because:
1. The backend Docker container is either not running OR
2. The backend container is running the OLD code (before notification changes)

**Solution:** Rebuild the Docker container with the new code

## Complete Setup Steps

### Step 1: Ensure Docker is Running
```bash
# On Windows, start Docker Desktop
# Or run:
docker --version
# Should show Docker version
```

### Step 2: Stop All Containers
```bash
docker compose down
```

### Step 3: Rebuild Backend Container
```bash
cd backend-api
docker compose build --no-cache backend
```
This will take 2-3 minutes. Wait for it to complete.

### Step 4: Start All Containers
```bash
docker compose up -d
```

### Step 5: Wait for Services to Start
```bash
# Wait 15-20 seconds
sleep 20

# Verify all containers are running
docker ps
```

You should see:
- `cargo_backend` - Running
- `cargo_frontend` - Running
- `cargo_db` - Running (if using Docker for DB)

### Step 6: Verify Backend is Ready
```bash
# Check backend logs
docker logs cargo_backend | tail -20

# Should see messages like:
# "Server running on port 5000"
# "Database connected"
```

## Test the Notification System

### Test 1: Create Job and Assign During Creation
1. Login as Admin/Manager
2. Go to Jobs → Create New Job
3. Fill in all required fields
4. In the "Assign Users" section, select Waff Clerk 1
5. Click "Create Job"
6. **Check backend logs:**
   ```bash
   docker logs cargo_backend | grep -i "notification\|assign"
   ```

### Test 2: Create Job and Assign After Creation
1. Login as Admin/Manager
2. Go to Jobs → Create New Job
3. Fill in all required fields
4. Click "Create Job" (without assigning)
5. Open the job details
6. Click "Assign Users"
7. Select Waff Clerk 1
8. Click "Assign"
9. **Check backend logs:**
   ```bash
   docker logs cargo_backend | grep -i "notification\|assign"
   ```

### Test 3: Verify Notification in Database
```bash
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"
```

Should show:
- `notificationId`: NOTIF00001 (or similar)
- `userId`: USER0002 (Waff Clerk 1's ID)
- `type`: JOB_ASSIGNED
- `isRead`: 0

### Test 4: Verify Notification in Frontend
1. Logout from Admin account
2. Login as Waff Clerk 1
3. Look at notification bell in top navbar
4. Should see red badge with "1"
5. Click bell to see notification
6. Should see: "New Job Assigned - You have been assigned to Job #JOB0001"

## Expected Backend Logs

When you assign a job, you should see these logs:

```
[AssignMultipleUsersToJob] Starting job assignment - jobId: JOB0001, userIds: ["USER0002"], assignedBy: USER0001
[AssignMultipleUsersToJob] createNotification available: true
[NOTIFICATION] createNotification is available, creating notifications for 1 assigned users
[NOTIFICATION] Creating JOB_ASSIGNED notification for user USER0002, job JOB0001
[NOTIFICATION] Notification data: {"userId":"USER0002","type":"JOB_ASSIGNED",...}
[CreateNotification] Creating notification for user USER0002, type: JOB_ASSIGNED
[CreateNotification] Generated notification ID: NOTIF00001
[CreateNotification] Persisting notification to database
[CreateNotification] Notification created successfully: {...}
[NOTIFICATION] Successfully created notification for user USER0002, result: {...}
```

## Troubleshooting

### Issue: Backend container won't start
```bash
# Check logs for errors
docker logs cargo_backend

# Common fixes:
# 1. Port 5000 already in use
docker compose down
docker compose up -d

# 2. Database connection error
# Verify SQL Server is running and accessible

# 3. Syntax error in code
# Check the error message in logs
```

### Issue: No logs appear when assigning job
```bash
# Backend might not be running
docker ps | grep cargo_backend

# If not running, start it
docker compose up -d backend

# If running but no logs, backend might be old code
# Rebuild:
docker compose down backend
docker compose build --no-cache backend
docker compose up -d backend
```

### Issue: Logs show `createNotification available: false`
```bash
# DI container isn't injecting the service
# This means the backend code wasn't rebuilt properly

# Solution:
docker compose down backend
docker compose build --no-cache backend --progress=plain
docker compose up -d backend
```

### Issue: Notification in database but not showing in frontend
```bash
# Frontend might not be updated
# Rebuild frontend:
cd frontend
npm run build
cp -r build/* ../backend-api/public/

# Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Issue: Database query returns empty
```bash
# Notifications table might not exist
# Create it:
cd backend-api
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -i create-notifications-system.sql

# Verify it was created:
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT * FROM sys.tables WHERE name = 'Notifications'"
```

## Files Modified

### Backend
- `src/application/use-cases/job/AssignMultipleUsersToJob.js` - Added notification creation
- `src/infrastructure/di/container.js` - Injected createNotification
- `src/application/use-cases/notification/CreateNotification.js` - Added logging

### Frontend
- `src/components/NotificationBell.js` - Notification bell component
- `src/components/Navbar.js` - Added notification bell to navbar
- `src/styles/NotificationBell.css` - Styling
- `src/api/services/notificationService.js` - API service

## Verification Checklist

After completing all steps, verify:

- [ ] Docker containers are running: `docker ps`
- [ ] Backend logs show notification messages
- [ ] Notifications table has records
- [ ] Notification bell shows badge in frontend
- [ ] Clicking bell shows notification
- [ ] Marking as read works
- [ ] No errors in browser console
- [ ] No errors in backend logs

## Quick Command Reference

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Rebuild backend
docker compose build --no-cache backend

# View backend logs
docker logs cargo_backend

# View last 50 lines of logs
docker logs cargo_backend | tail -50

# Search logs for notifications
docker logs cargo_backend | grep -i notification

# Rebuild frontend
cd frontend && npm run build && cp -r build/* ../backend-api/public/

# Check database
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"
```

## Next Steps

1. **Rebuild backend container** (Step 3 above)
2. **Start all containers** (Step 4 above)
3. **Test the system** (Test 1-4 above)
4. **Check logs and database** to verify notifications are being created
5. **Check frontend** to verify notification bell is working

## Support

If you encounter issues:
1. Check backend logs: `docker logs cargo_backend`
2. Check database: `SELECT * FROM Notifications`
3. Check browser console: F12 → Console tab
4. Review troubleshooting section above
5. Refer to NOTIFICATION_DIAGNOSTIC_GUIDE.md for detailed diagnostics

---

**Status:** Ready for deployment
**Last Updated:** May 24, 2026
**Version:** 1.0.0
