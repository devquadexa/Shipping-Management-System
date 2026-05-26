# Test Notification System - Backend is Now Running

## ✅ Backend Status
The backend server is now running on port 5000 with the notification system enabled.

## Test Steps

### Step 1: Create a Job and Assign to Waff Clerk

1. **Open browser:** http://localhost:5000
2. **Login as Admin/Manager**
3. **Go to Jobs → Create New Job**
4. **Fill in required fields:**
   - Customer: Select any customer
   - Shipment Category: Select a category
   - Other required fields
5. **Assign to Waff Clerk 1:**
   - In the "Assign Users" section, select Waff Clerk 1
   - Click "Create Job" or "Assign"

### Step 2: Check Backend Console for Notification Logs

Look at the terminal where the backend is running. You should see logs like:

```
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
```

**If you see these logs, the notification was created successfully!**

### Step 3: Verify Notification in Database

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

### Step 4: Check Notification in Frontend

1. **Logout** from Admin account
2. **Login as Waff Clerk 1**
3. **Look at the notification bell** in the top navbar
   - Should see a red badge with "1"
4. **Click the bell icon** to open the notification dropdown
   - Should see: "New Job Assigned - You have been assigned to Job #JOB0001"
5. **Click the checkmark** to mark as read
   - Notification should disappear
   - Badge should disappear

## Expected Results

✅ **All 4 tests pass:**
1. Backend logs show notification creation messages
2. Database has notification record
3. Notification bell shows red badge
4. Clicking bell shows notification details

## If Something Goes Wrong

### No logs appear in backend console
- Backend might not have restarted properly
- Check if backend is still running: `Get-Process node`
- If not running, restart it

### Database query returns empty
- Notifications table might not exist
- Run migration: `sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -i create-notifications-system.sql`

### Notification bell shows no badge
- Frontend might need hard refresh: `Ctrl+Shift+R`
- Check browser console (F12) for API errors
- Verify you're logged in as the assigned waff clerk

### Backend shows `createNotification available: false`
- DI container issue
- Restart backend: Kill node process and run `npm start` again

## Quick Commands

```bash
# Check if backend is running
Get-Process node

# Check database for notifications
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P "your_password" -d SuperShineCargoDb -Q "SELECT TOP 10 * FROM Notifications ORDER BY createdDate DESC"

# Kill backend if needed
taskkill /IM node.exe /F

# Start backend
cd "d:\Work and Learn\Quadexa\Shipping Management System\backend-api"
npm start
```

## Next Steps

1. **Test the system** using the steps above
2. **Share the results:**
   - Do you see the notification logs in the backend console?
   - Does the database have the notification record?
   - Does the notification bell show the badge?
3. **If all tests pass:** Notification system is working! 🎉
4. **If any test fails:** Share the error message and I'll help troubleshoot

---

**Backend Status:** ✅ Running on port 5000
**Notification System:** ✅ Enabled
**Ready to Test:** ✅ Yes

**Test now and let me know the results!**
