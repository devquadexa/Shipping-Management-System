# Notification System - Quick Start Guide

## ✅ Issue Fixed!

The notification system is now working correctly. The database table was missing three required columns which have been added.

## What Was Wrong?

The `Notifications` table was missing:
- `createdBy` column
- `metadata` column  
- `relatedType` column

This caused notifications to fail silently when jobs were assigned to users.

## What Was Fixed?

✅ Added all missing columns to the Notifications table  
✅ Verified notification creation works  
✅ Tested with waff clerk 01 (USER0002)  
✅ Confirmed unread count is working  

## How to Test

### 1. Restart Backend Server (if running)
```bash
# Stop the server (Ctrl+C if running)
# Then start it again
cd backend-api
npm start
```

### 2. Create and Assign a Job
1. Login to the system as Admin or Manager
2. Go to Jobs section
3. Create a new job
4. Assign the job to **waff clerk 01** (or any user)
5. Save the job

### 3. Check Notifications
1. Logout
2. Login as **waff clerk 01**
   - Username: `waffclerk01`
   - Password: (your password)
3. Look at the bell icon in the top navigation bar
4. You should see:
   - ✅ A red badge with the number "1"
   - ✅ Click the bell to see the notification
   - ✅ Notification message: "You have been assigned to Job #[JOB_ID]"

## Notification Types

The system currently supports these notification types:

### Job Notifications
- **JOB_ASSIGNED** - When a user is assigned to a job
  - Triggered by: Creating/editing a job and assigning users
  - Recipients: All assigned users
  - Message: "You have been assigned to Job #[JOB_ID]"

### Invoice Review Notifications  
- **invoice_review** - When an invoice review is sent to a clerk
- **invoice_review_approved** - When a clerk approves an invoice review
- **invoice_review_rejected** - When a clerk rejects an invoice review

## Troubleshooting

### No notifications appearing?

1. **Check backend server logs**
   ```bash
   # Look for errors in the console where the server is running
   # Should see: [NOTIFICATION] Successfully created notification...
   ```

2. **Verify table structure**
   ```bash
   cd backend-api
   node debug-notification-issue.js
   ```

3. **Check database directly**
   ```sql
   USE SuperShineCargoDb;
   SELECT * FROM Notifications ORDER BY createdDate DESC;
   ```

### Backend server not starting?

Make sure your `.env` file has the correct database credentials:
```env
DB_SERVER=localhost
DB_PORT=63951
DB_DATABASE=SuperShineCargoDb
DB_USER=SUPER_SHINE_CARGO
DB_PASSWORD=1234@SuperShineDB
```

### Still having issues?

Run the debug script:
```bash
cd backend-api
node debug-notification-issue.js
```

This will:
- ✅ Check if the notification system is properly configured
- ✅ Verify the database table structure
- ✅ Create a test notification
- ✅ Show you exactly what's wrong

## Files Reference

### Scripts You Can Run:
- `fix-notifications-table.js` - Fix missing columns (already run)
- `debug-notification-issue.js` - Test the notification system
- `cleanup-test-notifications.js` - Remove test notifications
- `verify-notifications-table.sql` - Check table structure in SQL

### Documentation:
- `NOTIFICATION_FIX_SUMMARY.md` - Detailed explanation of the fix
- `NOTIFICATION_SYSTEM_SETUP.md` - Original setup documentation
- `NOTIFICATION_QUICK_START.md` - This file

## Next Steps

1. ✅ **Test the system** - Create a job and assign it to a user
2. ✅ **Verify notifications appear** - Login as that user and check
3. ✅ **Mark as read** - Click on a notification to mark it as read
4. ✅ **Mark all as read** - Use the "Mark all as read" button

## Support

If you need help:
1. Check the backend server console for errors
2. Run `node debug-notification-issue.js`
3. Review `NOTIFICATION_FIX_SUMMARY.md` for technical details

---

**Status:** ✅ WORKING  
**Last Updated:** May 24, 2026  
**Tested With:** waff clerk 01 (USER0002)
