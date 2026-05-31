# Fix: Notifications Not Appearing - Quick Fix Guide

## The Problem
You created a job and assigned it to Waff Clerk 3, but the notification didn't appear.

## The Root Cause
The backend code was modified to add notification creation, but the Docker container hasn't been rebuilt with these changes. The old backend code is still running.

## The Solution (5 Steps)

### Step 1: Stop the Backend Container
```bash
docker compose down backend
```

### Step 2: Rebuild the Backend Container
```bash
cd backend-api
docker compose build --no-cache backend
```
This will take 2-3 minutes. Wait for it to complete.

### Step 3: Start the Backend Container
```bash
docker compose up -d backend
```

### Step 4: Wait for Backend to Start
```bash
# Wait 10-15 seconds for the backend to fully start
# Then check if it's running:
docker ps | grep cargo_backend
```
You should see the container listed as "Up".

### Step 5: Test the Notification System

1. **Open the application** in your browser
2. **Login as Admin/Manager**
3. **Create a new job** with all required fields
4. **Assign the job to Waff Clerk 3**
5. **Logout** from Admin account
6. **Login as Waff Clerk 3**
7. **Look at the notification bell** in the top navbar
   - You should see a red badge with a number (e.g., "1")
8. **Click the bell icon** to open the notification dropdown
   - You should see: "New Job Assigned - You have been assigned to Job #[jobId]"

## Verify Backend Logs

To confirm notifications are being created, check the backend logs:

```bash
docker logs cargo_backend | grep NOTIFICATION
```

You should see messages like:
```
[NOTIFICATION] Creating notifications for 1 assigned users
[NOTIFICATION] Creating JOB_ASSIGNED notification for user WAFF_CLERK_3, job JOB0001
[NOTIFICATION] Successfully created notification for user WAFF_CLERK_3
```

## Verify in Database

To confirm the notification was saved to the database:

```bash
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 5 * FROM Notifications ORDER BY createdDate DESC"
```

You should see a row with:
- `type = 'JOB_ASSIGNED'`
- `userId = WAFF_CLERK_3_ID`
- `isRead = 0` (unread)

## If It Still Doesn't Work

### Check 1: Is the backend running?
```bash
docker ps | grep cargo_backend
```
If not running, check logs:
```bash
docker logs cargo_backend
```

### Check 2: Does the Notifications table exist?
```bash
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT * FROM sys.tables WHERE name = 'Notifications'"
```
If not, run the migration:
```bash
cd backend-api
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -i create-notifications-system.sql
```

### Check 3: Is the frontend showing the notification bell?
- Open browser DevTools (F12)
- Go to Console tab
- Look for any errors
- Hard refresh the page (Ctrl+Shift+R)

### Check 4: Check browser network requests
- Open DevTools (F12)
- Go to Network tab
- Login as Waff Clerk
- Look for a request to `/api/notifications/unread`
- Check the response - should show the notification

## Files That Were Changed

The following backend files were modified to add notification support:

1. **backend-api/src/application/use-cases/job/AssignMultipleUsersToJob.js**
   - Added notification creation after job assignment
   - Added debug logging

2. **backend-api/src/infrastructure/di/container.js**
   - Updated to pass createNotification to AssignMultipleUsersToJob
   - Reorganized notification use case setup

3. **backend-api/src/application/use-cases/notification/CreateNotification.js**
   - Added debug logging for troubleshooting

These changes require a Docker rebuild to take effect.

## Expected Behavior After Fix

1. ✅ Admin/Manager creates a job
2. ✅ Admin/Manager assigns job to Waff Clerk
3. ✅ Notification is created in database
4. ✅ Waff Clerk logs in
5. ✅ Notification bell shows red badge with count
6. ✅ Clicking bell shows notification details
7. ✅ Clicking checkmark marks notification as read
8. ✅ Notification disappears from unread list

## Timeline

- **Step 1-2:** 2-3 minutes (Docker rebuild)
- **Step 3-4:** 1-2 minutes (Container startup)
- **Step 5:** 2-3 minutes (Testing)

**Total time: ~5-8 minutes**

---

**If you need more detailed troubleshooting, see: NOTIFICATION_TROUBLESHOOTING.md**
