# Notification System Debugging Guide

## Issue: Notifications saved in DB but not showing in frontend

### Changes Made to Fix

1. **Fixed Route Order** (backend-api/src/presentation/routes/notificationRoutes.js)
   - Moved `/unread-count` and `/read-all` routes BEFORE `/:notificationId/read`
   - This prevents Express from matching `/unread-count` as a parameter

2. **Added Fetch on Dropdown Open** (frontend/src/components/NotificationBell.js)
   - Now fetches fresh notifications when opening the dropdown
   - Previously only fetched on component mount

3. **Added Console Logging** for debugging
   - Backend: Logs when fetching notifications and creating them
   - Frontend: Logs fetched data and errors

### Steps to Debug

#### Step 1: Verify Database
```sql
-- Check if notifications table exists
SELECT * FROM sys.tables WHERE name = 'notifications'

-- Check if notifications were created
SELECT * FROM notifications ORDER BY createdDate DESC

-- Check specific user's notifications
SELECT * FROM notifications WHERE userId = '<userId>' ORDER BY createdDate DESC
```

#### Step 2: Check Backend Logs
When you restart the backend, look for these logs:
```
Creating notification for userId: <userId> type: invoice_review
Notification created successfully: <notificationId>
Getting notifications for userId: <userId>
Notifications found: <count>
Getting unread count for userId: <userId>
Unread count: <count>
```

#### Step 3: Check Frontend Console
Open browser DevTools (F12) and check Console tab for:
```
Fetched notifications: [...]
Fetched unread count: {unreadCount: X}
```

#### Step 4: Test API Directly
Use Postman or curl to test the API:

```bash
# Get notifications (replace <token> with actual JWT token)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/notifications

# Get unread count
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/notifications/unread-count
```

### Common Issues & Solutions

#### Issue 1: Badge shows but no notifications in dropdown
**Cause**: Unread count query works but notifications query doesn't
**Solution**: 
- Check if userId is being passed correctly
- Verify notifications table has data for that userId
- Check backend logs for "Notifications found: 0"

#### Issue 2: No badge and no notifications
**Cause**: API not being called or returning error
**Solution**:
- Check browser console for errors
- Check if backend is running
- Verify token is valid
- Check CORS settings

#### Issue 3: Notifications appear but don't update
**Cause**: Frontend not refetching when dropdown opens
**Solution**: Already fixed - now fetches on dropdown open

#### Issue 4: "Mark as read" doesn't work
**Cause**: Route order issue or parameter not being passed
**Solution**: Already fixed - route order corrected

### Complete Restart Procedure

1. **Stop Backend** (if running)
   - Press Ctrl+C in terminal

2. **Verify Database**
   - Run the SQL script: `backend-api/create-notifications-table.sql`
   - Verify table exists and has data

3. **Restart Backend**
   ```bash
   cd backend-api
   npm start
   ```
   - Wait for "✅ Database connected successfully"

4. **Rebuild Frontend** (if needed)
   ```bash
   cd frontend
   npm run build
   ```

5. **Test**
   - Login as Admin/Manager
   - Send an invoice review to a Waff Clerk
   - Login as the Waff Clerk
   - Check bell icon for badge
   - Click bell to see notifications

### Files Modified

1. `backend-api/src/presentation/routes/notificationRoutes.js` - Route order fixed
2. `frontend/src/components/NotificationBell.js` - Added fetch on dropdown open + logging
3. `backend-api/src/presentation/controllers/NotificationController.js` - Added logging

### Expected Behavior After Fix

1. When invoice review is sent:
   - Backend logs: "Creating notification for userId: ..."
   - Backend logs: "Notification created successfully: ..."
   - Notification appears in database

2. When user opens app:
   - Frontend fetches notifications on mount
   - Badge shows unread count (if > 0)

3. When user clicks bell:
   - Frontend fetches fresh notifications
   - Dropdown shows all notifications
   - Unread notifications have blue background + dot

4. When user clicks notification:
   - Frontend marks as read
   - Notification loses blue styling
   - Badge count decreases

### If Still Not Working

1. Check browser console for JavaScript errors
2. Check backend console for database errors
3. Verify userId is correct (not null or undefined)
4. Verify notifications table has correct schema
5. Check if auth middleware is working (token validation)
6. Verify CORS is allowing the requests

### Performance Notes

- Notifications fetch every 30 seconds (configurable)
- Also fetches when dropdown opens
- Unread count is calculated in real-time from database
- No caching - always fresh data from DB
