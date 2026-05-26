# Final Notification System Test - Backend Running on Port 5001

## ✅ Backend Status
- **Port:** 5001 (changed from 5000 due to port conflict)
- **Status:** Running
- **Database:** Connected
- **Notification System:** Enabled with enhanced logging

## Important: Update Your Browser URL

Since the backend is now running on port **5001** instead of 5000, you need to update your browser:

**Old URL:** http://localhost:5000
**New URL:** http://localhost:5001

## Test Steps

### Step 1: Open Application in Browser
```
http://localhost:5001
```

### Step 2: Login as Admin/Manager
- Username: admin_user (or your admin account)
- Password: your_password

### Step 3: Create a Job and Assign to Waff Clerk 1

**Option A: Assign During Job Creation**
1. Go to Jobs → Create New Job
2. Fill in all required fields
3. In "Assign Users" section, select Waff Clerk 1
4. Click "Create Job"

**Option B: Assign After Job Creation**
1. Go to Jobs → Create New Job
2. Fill in all required fields
3. Click "Create Job"
4. Open the job details
5. Click "Assign Users"
6. Select Waff Clerk 1
7. Click "Assign"

### Step 4: Check Backend Console for Logs

Look at the terminal where the backend is running. You should see detailed logs like:

```
========================================
=== ASSIGN USERS TO JOB ENDPOINT ===
========================================
Job ID: JOB0001
Request body: { userIds: [ 'USER0002' ], notes: null }
User: { userId: 'USER0001', username: 'admin', ... }
[ROUTE] Getting assignMultipleUsersToJob from container...
[ROUTE] assignMultipleUsersToJob retrieved: true
[ROUTE] Has createNotification: true
[ROUTE] Executing use case...
[AssignMultipleUsersToJob] Starting job assignment - jobId: JOB0001, userIds: ["USER0002"], assignedBy: USER0001
[AssignMultipleUsersToJob] createNotification available: true
[NOTIFICATION] createNotification is available, creating notifications for 1 assigned users
[NOTIFICATION] Creating JOB_ASSIGNED notification for user USER0002, job JOB0001
[NOTIFICATION] Notification data: {...}
[CreateNotification] Creating notification for user USER0002, type: JOB_ASSIGNED
[CreateNotification] Generated notification ID: NOTIF00001
[CreateNotification] Persisting notification to database
[CreateNotification] Notification created successfully: {...}
[NOTIFICATION] Successfully created notification for user USER0002, result: {...}
[ROUTE] Success! Result: {...}
========================================
```

**If you see these logs, the notification was created!**

### Step 5: Check Database for Notification

Open PowerShell and run:

```bash
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"
```

You should see a notification record with:
- `notificationId`: NOTIF00001 (or similar)
- `userId`: USER0002 (Waff Clerk 1)
- `type`: JOB_ASSIGNED
- `title`: New Job Assigned
- `message`: You have been assigned to Job #JOB0001
- `isRead`: 0 (unread)

### Step 6: Check Notification in Frontend

1. **Logout** from Admin account
2. **Update URL to port 5001:** http://localhost:5001
3. **Login as Waff Clerk 1**
4. **Look at the notification bell** in the top navbar
   - Should see a red badge with "1"
5. **Click the bell icon** to open the notification dropdown
   - Should see: "New Job Assigned - You have been assigned to Job #JOB0001"
6. **Click the checkmark** to mark as read
   - Notification should disappear
   - Badge should disappear

## Troubleshooting

### Issue: Backend logs don't show notification messages
**Possible causes:**
1. Job assignment endpoint wasn't called
2. Backend code wasn't reloaded
3. Error occurred before notification creation

**Solution:**
- Check if `[ROUTE]` logs appear first
- If not, the endpoint wasn't called
- If yes but no `[NOTIFICATION]` logs, there's an error

### Issue: Backend shows `[ROUTE] Has createNotification: false`
**Cause:** DI container isn't injecting the notification service

**Solution:**
- Kill all node processes: `taskkill /IM node.exe /F`
- Restart backend: `npm start`

### Issue: Database query returns empty
**Cause:** Notifications table doesn't exist or insert failed

**Solution:**
- Create table: `sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -i create-notifications-system.sql`
- Check backend logs for database errors

### Issue: Notification bell shows no badge
**Cause:** Frontend not updated or API error

**Solution:**
- Hard refresh browser: `Ctrl+Shift+R`
- Check browser console (F12) for errors
- Verify you're logged in as the assigned waff clerk

## Quick Reference

```bash
# Kill all node processes
taskkill /IM node.exe /F

# Start backend on port 5001
cd "d:\Work and Learn\Quadexa\Shipping Management System\backend-api"
$env:PORT=5001; npm start

# Check database
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"

# Check if port is in use
netstat -ano | findstr :5001
```

## Expected Results

✅ **All 4 tests pass:**
1. Backend logs show all notification creation messages
2. Database has notification record
3. Notification bell shows red badge
4. Clicking bell shows notification details

## Next Steps

1. **Update browser URL to port 5001**
2. **Test the system** using the steps above
3. **Share the results:**
   - Do you see the notification logs in the backend console?
   - Does the database have the notification record?
   - Does the notification bell show the badge?
4. **If all tests pass:** Notification system is working! 🎉
5. **If any test fails:** Share the specific error and I'll help troubleshoot

---

**Backend Status:** ✅ Running on port 5001
**Notification System:** ✅ Enabled with enhanced logging
**Ready to Test:** ✅ Yes

**Test now and share the results!**
