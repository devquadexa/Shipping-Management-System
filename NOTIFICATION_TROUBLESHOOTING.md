# Notification System - Troubleshooting Guide

## Issue: Notifications Not Appearing After Job Assignment

### Root Cause Analysis

The notification system requires the backend to be rebuilt and restarted with the latest code changes. The changes made include:

1. **AssignMultipleUsersToJob.js** - Added notification creation logic
2. **container.js** - Updated DI to pass createNotification to AssignMultipleUsersToJob
3. **CreateNotification.js** - Added debug logging

### Solution: Rebuild and Restart Backend

#### Step 1: Stop the Backend Container
```bash
docker compose down backend
# or
docker stop cargo_backend
```

#### Step 2: Rebuild the Backend Container
```bash
cd backend-api
docker compose build --no-cache backend
```

#### Step 3: Start the Backend Container
```bash
docker compose up -d backend
```

#### Step 4: Verify Backend is Running
```bash
docker ps | grep cargo_backend
# Should show the container running
```

#### Step 5: Check Backend Logs for Notification Messages
```bash
docker logs cargo_backend | grep -i notification
# Should see logs like:
# [NOTIFICATION] Creating notifications for X assigned users
# [NOTIFICATION] Creating JOB_ASSIGNED notification for user Y, job Z
# [NOTIFICATION] Successfully created notification for user Y
```

### Step-by-Step Testing After Rebuild

#### 1. Create a Job
- Login as Admin/Manager
- Navigate to Jobs
- Create a new job with all required fields
- Save the job

#### 2. Assign Job to Waff Clerk
- Open the job details
- Click "Assign Users"
- Select Waff Clerk 3 (or any waff clerk)
- Click "Assign"
- **Check backend logs** - should see notification creation messages

#### 3. Verify in Database
```sql
-- Check if notification was created
SELECT TOP 10 * FROM Notifications 
ORDER BY createdDate DESC;

-- Check for specific user
SELECT * FROM Notifications 
WHERE userId = 'WAFF_CLERK_3_ID' 
ORDER BY createdDate DESC;

-- Check for JOB_ASSIGNED type
SELECT * FROM Notifications 
WHERE type = 'JOB_ASSIGNED' 
ORDER BY createdDate DESC;
```

#### 4. Login as Waff Clerk and Check Notification Bell
- Logout from Admin account
- Login as Waff Clerk 3
- Look at notification bell in navbar
- Should show red badge with unread count
- Click bell to see notification

### Common Issues and Solutions

#### Issue 1: Backend Container Won't Start
**Symptoms:**
- `docker compose up -d backend` fails
- Container exits immediately

**Solution:**
```bash
# Check logs for errors
docker logs cargo_backend

# Common errors:
# - Port 5000 already in use: docker compose down && docker compose up -d
# - Database connection error: Verify SQL Server is running
# - Syntax error in code: Check backend logs for specific error

# Rebuild with verbose output
docker compose build --no-cache backend --progress=plain
```

#### Issue 2: Notifications Table Doesn't Exist
**Symptoms:**
- Backend logs show: "Table 'Notifications' not found"
- Database query returns no results

**Solution:**
```bash
# Run the SQL migration script
cd backend-api
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -i create-notifications-system.sql

# Verify table was created
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT * FROM sys.tables WHERE name = 'Notifications'"
```

#### Issue 3: Notification Created but Not Showing in Frontend
**Symptoms:**
- Database shows notification was created
- Frontend notification bell shows no badge
- No notifications in dropdown

**Solution:**
```bash
# 1. Check if frontend was rebuilt
cd frontend
npm run build

# 2. Copy build files to backend
cp -r build/* ../backend-api/public/

# 3. Refresh browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

# 4. Check browser console for API errors
# Open DevTools (F12) → Console tab
# Look for errors like "Failed to fetch /api/notifications/unread"

# 5. Check if user ID in JWT token matches database
# In browser console:
# localStorage.getItem('token') - copy the token
# Decode at jwt.io to see the userId
# Verify this userId exists in database
```

#### Issue 4: Notification Created for Wrong User
**Symptoms:**
- Notification appears for different user than assigned
- Multiple users getting same notification

**Solution:**
```bash
# Check the job assignment
SELECT * FROM JobAssignments 
WHERE jobId = 'JOB_ID' 
ORDER BY assignedDate DESC;

# Check the notification
SELECT * FROM Notifications 
WHERE relatedId = 'JOB_ID' 
ORDER BY createdDate DESC;

# Verify userId in notification matches assigned user
# If mismatch, check AssignMultipleUsersToJob.js for logic error
```

#### Issue 5: Notification Creation Fails Silently
**Symptoms:**
- Job assignment succeeds
- No notification created
- No error in logs

**Solution:**
```bash
# 1. Check backend logs for [NOTIFICATION] messages
docker logs cargo_backend | grep "\[NOTIFICATION\]"

# 2. If no logs appear, createNotification might not be injected
# Check container.js line 211-222 to verify:
# - notificationRepository is created
# - createNotification is instantiated
# - createNotification is passed to AssignMultipleUsersToJob

# 3. Rebuild container if code was modified
docker compose build --no-cache backend

# 4. Check for JavaScript errors in backend
# Look for: "TypeError: this.createNotification is not a function"
```

### Debug Logging

The following debug logs have been added to help troubleshoot:

#### In AssignMultipleUsersToJob.js:
```
[NOTIFICATION] Creating notifications for X assigned users
[NOTIFICATION] Creating JOB_ASSIGNED notification for user Y, job Z
[NOTIFICATION] Successfully created notification for user Y
[NOTIFICATION] createNotification is not available - notifications will not be created
```

#### In CreateNotification.js:
```
[CreateNotification] Creating notification for user X, type: JOB_ASSIGNED
[CreateNotification] Generated notification ID: NOTIF00001
[CreateNotification] Persisting notification to database
[CreateNotification] Notification created successfully: {...}
```

### Verification Checklist

After rebuilding, verify:

- [ ] Backend container is running: `docker ps | grep cargo_backend`
- [ ] Backend logs show notification messages: `docker logs cargo_backend | grep NOTIFICATION`
- [ ] Notifications table exists: `SELECT * FROM sys.tables WHERE name = 'Notifications'`
- [ ] Job assignment succeeds
- [ ] Notification appears in database
- [ ] Frontend notification bell shows badge
- [ ] Clicking bell shows notification
- [ ] Marking as read works
- [ ] No errors in browser console
- [ ] No errors in backend logs

### Performance Considerations

If notifications are slow:

```sql
-- Check if indexes exist
SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Notifications');

-- If missing, create them
CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(userId, isRead);
CREATE INDEX IX_Notifications_CreatedDate ON Notifications(createdDate DESC);
```

### Rollback Instructions

If you need to rollback the notification system:

```bash
# 1. Revert code changes
git checkout backend-api/src/application/use-cases/job/AssignMultipleUsersToJob.js
git checkout backend-api/src/infrastructure/di/container.js
git checkout backend-api/src/application/use-cases/notification/CreateNotification.js

# 2. Rebuild backend
docker compose build --no-cache backend

# 3. Restart backend
docker compose down backend
docker compose up -d backend

# 4. (Optional) Drop notifications table
# sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "DROP TABLE Notifications"
```

### Getting Help

If you're still having issues:

1. **Check backend logs:**
   ```bash
   docker logs cargo_backend > backend_logs.txt
   # Review the logs for errors
   ```

2. **Check database:**
   ```sql
   -- Verify table structure
   SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notifications';
   
   -- Check for data
   SELECT COUNT(*) FROM Notifications;
   
   -- Check for errors
   SELECT * FROM Notifications WHERE type = 'JOB_ASSIGNED' ORDER BY createdDate DESC;
   ```

3. **Check frontend:**
   - Open DevTools (F12)
   - Go to Network tab
   - Assign a job
   - Look for API calls to `/api/notifications/unread`
   - Check response for errors

4. **Verify code changes:**
   - Ensure all three files were modified correctly
   - Check for syntax errors: `node -c src/index.js`
   - Verify DI container setup

---

**Last Updated:** May 24, 2026
**Version:** 1.0.0
