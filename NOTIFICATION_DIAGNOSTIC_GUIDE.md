# Notification System - Diagnostic Guide

## Issue: Notifications Not Appearing

The notification system has been enhanced with detailed logging to help diagnose why notifications aren't being created.

## Step 1: Rebuild Backend with Enhanced Logging

The backend code has been updated with detailed logging. You MUST rebuild the Docker container:

```bash
# Stop the backend
docker compose down backend

# Rebuild with new code
cd backend-api
docker compose build --no-cache backend

# Start the backend
docker compose up -d backend

# Wait 10-15 seconds for startup
sleep 15

# Verify it's running
docker ps | grep cargo_backend
```

## Step 2: Create Job and Assign to Waff Clerk

1. Login as Admin/Manager
2. Create a new job
3. Assign the job to Waff Clerk 1
4. Note the Job ID (e.g., JOB0001)

## Step 3: Check Backend Logs for Diagnostic Messages

```bash
# Get all notification-related logs
docker logs cargo_backend | grep -i "notification\|assign"

# Or get the last 100 lines
docker logs cargo_backend | tail -100
```

### Expected Log Output

If everything is working, you should see:

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

## Step 4: Interpret Log Messages

### Message: `createNotification available: true`
✅ **GOOD** - The notification service is properly injected
❌ **BAD** - If it says `false`, the DI container isn't working

### Message: `Creating JOB_ASSIGNED notification for user...`
✅ **GOOD** - The notification creation is being attempted
❌ **BAD** - If this doesn't appear, the code isn't being executed

### Message: `Error creating notifications for job assignment:`
⚠️ **WARNING** - An error occurred but the job assignment still succeeded
- Check the error message for details
- Common errors:
  - "userId, type, title, and message are required"
  - Database connection error
  - Notifications table doesn't exist

### Message: `createNotification is NOT available`
❌ **CRITICAL** - The notification service wasn't injected
- This means the DI container setup failed
- The backend needs to be rebuilt

## Step 5: Check Database for Notification Record

```bash
# Query the Notifications table
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"

# Or check for specific user
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT * FROM Notifications WHERE type = 'JOB_ASSIGNED' ORDER BY createdDate DESC"
```

### Expected Database Output

You should see a row with:
- `notificationId`: NOTIF00001 (or similar)
- `userId`: USER0002 (the assigned waff clerk)
- `type`: JOB_ASSIGNED
- `title`: New Job Assigned
- `message`: You have been assigned to Job #JOB0001
- `isRead`: 0 (unread)
- `createdDate`: Current timestamp

## Step 6: Verify Frontend Notification Bell

1. Login as Waff Clerk 1
2. Look at the notification bell in the top navbar
3. Should see a red badge with number "1"
4. Click the bell to open dropdown
5. Should see the notification

### If Notification Bell Shows No Badge

Check browser console (F12):
```javascript
// In browser console, check if API call is working
fetch('/api/notifications/unread', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(d => console.log(d))
```

Expected response:
```json
{
  "notifications": [
    {
      "notificationId": "NOTIF00001",
      "userId": "USER0002",
      "type": "JOB_ASSIGNED",
      "title": "New Job Assigned",
      "message": "You have been assigned to Job #JOB0001",
      "isRead": false,
      "createdDate": "2026-05-24T10:30:00Z"
    }
  ],
  "unreadCount": 1
}
```

## Troubleshooting Decision Tree

### Q: Do you see `[AssignMultipleUsersToJob]` logs?
- **YES** → Go to Q2
- **NO** → Backend code isn't being executed. Rebuild container: `docker compose build --no-cache backend`

### Q: Do you see `createNotification available: true`?
- **YES** → Go to Q3
- **NO** → DI container isn't injecting createNotification. Check container.js line 222

### Q: Do you see `[CreateNotification]` logs?
- **YES** → Go to Q4
- **NO** → createNotification.execute() isn't being called. Check AssignMultipleUsersToJob.js line 85

### Q: Do you see `Notification created successfully`?
- **YES** → Go to Q5
- **NO** → Database insert failed. Check error message and database connection

### Q: Does notification appear in database?
- **YES** → Go to Q6
- **NO** → Database query failed. Check SQL Server connection

### Q: Does notification bell show badge?
- **YES** → ✅ SYSTEM WORKING
- **NO** → Frontend issue. Check browser console for API errors

## Common Error Messages and Solutions

### Error: "userId, type, title, and message are required"
**Cause:** One of the required fields is missing or null
**Solution:** Check that userId is being passed correctly from AssignMultipleUsersToJob

### Error: "Table 'Notifications' not found"
**Cause:** The Notifications table doesn't exist in the database
**Solution:** Run the migration script:
```bash
cd backend-api
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -i create-notifications-system.sql
```

### Error: "Connection timeout"
**Cause:** Database connection failed
**Solution:** 
- Verify SQL Server is running
- Check connection string in config/database.js
- Verify firewall allows connection to port 63951

### Error: "Validation failed: Invalid notification type"
**Cause:** The notification type isn't in the allowed list
**Solution:** Check that type is exactly 'JOB_ASSIGNED' (case-sensitive)

## Performance Diagnostics

### Check notification creation time
```bash
# Look for timing in logs
docker logs cargo_backend | grep "CreateNotification"
```

If notification creation takes > 1 second, check:
- Database connection pool
- Network latency
- Database indexes

### Check database query performance
```sql
-- Check if indexes exist
SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Notifications');

-- If missing, create them
CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(userId, isRead);
```

## Verification Checklist

After following all steps, verify:

- [ ] Backend container rebuilt and running
- [ ] `[AssignMultipleUsersToJob]` logs appear when assigning job
- [ ] `createNotification available: true` appears in logs
- [ ] `[CreateNotification]` logs appear
- [ ] `Notification created successfully` appears in logs
- [ ] Notification record exists in database
- [ ] Notification bell shows badge in frontend
- [ ] Clicking bell shows notification
- [ ] No errors in browser console
- [ ] No errors in backend logs

## Next Steps

If all checks pass:
✅ **Notification system is working correctly**

If any check fails:
1. Review the error message
2. Check the troubleshooting decision tree
3. Follow the solution for that error
4. Rebuild backend if code was modified
5. Test again

## Support

For detailed technical information, see:
- `NOTIFICATION_TRIGGER_IMPLEMENTATION.md` - Technical implementation
- `NOTIFICATION_TROUBLESHOOTING.md` - Detailed troubleshooting
- `FIX_NOTIFICATION_ISSUE.md` - Quick fix guide

---

**Last Updated:** May 24, 2026
**Version:** 2.0.0 (Enhanced with detailed logging)
