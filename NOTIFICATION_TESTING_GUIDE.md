# Notification System Testing Guide

## Setup
1. Ensure backend is running: `npm start` in `backend-api` folder
2. Ensure frontend is built: `npm run build` in `frontend` folder
3. Open the application in browser

## Test Scenario 1: Invoice Review Sent Notification

### Steps:
1. Login as **Admin** or **Manager**
2. Go to **Invoicing** section
3. Create or select a job
4. Click **Review Invoice** button
5. Select a **Waff Clerk** from dropdown
6. Add review notes
7. Click **Submit**

### Expected Result:
- Success message appears
- Notification is saved to database

### Verify in Frontend:
1. Logout from Admin account
2. Login as the **Waff Clerk** who received the review
3. Look at top navigation bar
4. Bell icon should show **badge with number 1**
5. Click bell icon
6. Dropdown should show:
   - **Icon:** 📋
   - **Title:** "New Invoice Review"
   - **Message:** "{AdminName} sent you a new invoice review for job {JobId}"
   - **Background:** Blue (#f0f7ff)
   - **Indicator:** Blue dot on right side

---

## Test Scenario 2: Invoice Review Approved Notification

### Steps:
1. Login as **Waff Clerk** (from previous test)
2. Go to **Invoice Reviews** page
3. Find the pending review
4. Click **Approve** button

### Expected Result:
- Review status changes to "Approved"
- Notification is created for the Admin/Manager

### Verify in Frontend:
1. Logout from Clerk account
2. Login as the **Admin/Manager** who sent the review
3. Look at bell icon
4. Badge should show **1** (or increment if there were previous notifications)
5. Click bell icon
6. Dropdown should show:
   - **Icon:** ✅
   - **Title:** "Invoice Review Approved"
   - **Message:** "{ClerkName} approved the invoice review for job {JobId}"
   - **Background:** Green (#f0fdf4)
   - **Left Border:** Green line
   - **Indicator:** Blue dot on right side

---

## Test Scenario 3: Invoice Review Rejected Notification

### Steps:
1. Login as **Admin/Manager**
2. Send another invoice review to a **Waff Clerk**
3. Logout and login as the **Waff Clerk**
4. Go to **Invoice Reviews** page
5. Find the pending review
6. Click **Reject** button
7. Enter rejection reason (e.g., "Missing transporter payment details")
8. Click **Submit**

### Expected Result:
- Review status changes to "Rejected"
- Rejection reason is saved
- Notification is created for the Admin/Manager

### Verify in Frontend:
1. Logout from Clerk account
2. Login as the **Admin/Manager** who sent the review
3. Look at bell icon
4. Badge should show updated count
5. Click bell icon
6. Dropdown should show:
   - **Icon:** ❌
   - **Title:** "Invoice Review Rejected"
   - **Message:** "{ClerkName} rejected the invoice review for job {JobId}. Reason: {RejectionReason}"
   - **Background:** Red (#fef2f2)
   - **Left Border:** Red line
   - **Indicator:** Blue dot on right side
   - **Rejection Reason:** Visible in the message

---

## Test Scenario 4: Mark Notification as Read

### Steps:
1. With unread notifications visible in dropdown
2. Click on any unread notification

### Expected Result:
- Notification background changes to white
- Blue indicator dot disappears
- Badge count decreases by 1
- Notification remains in list but marked as read

---

## Test Scenario 5: Mark All as Read

### Steps:
1. With multiple unread notifications visible
2. Click **"Mark all as read"** button

### Expected Result:
- All notifications change to white background
- All blue indicator dots disappear
- Badge count becomes 0 and disappears
- Button disappears (no unread notifications)

---

## Test Scenario 6: Notification Persistence

### Steps:
1. Create notifications (sent, approved, rejected)
2. Refresh the page (F5)
3. Click bell icon

### Expected Result:
- All notifications still appear
- Read/unread status is preserved
- Badge count is correct

---

## Test Scenario 7: Multiple Notifications

### Steps:
1. Send multiple invoice reviews to same clerk
2. Approve some, reject others
3. Login as clerk and approve/reject them
4. Check notifications

### Expected Result:
- All notifications appear in dropdown
- Each has correct icon, title, and message
- Badge shows total unread count
- Can scroll through list if more than 5 notifications

---

## Database Verification

### Check Notifications Table:
```sql
-- View all notifications
SELECT * FROM notifications ORDER BY createdDate DESC

-- View unread notifications for specific user
SELECT * FROM notifications 
WHERE userId = '<userId>' AND isRead = 0
ORDER BY createdDate DESC

-- View notifications by type
SELECT type, COUNT(*) as count FROM notifications GROUP BY type

-- Verify rejection reason is included
SELECT notificationId, type, message FROM notifications 
WHERE type = 'invoice_review_rejected'
```

---

## Console Logging

### Backend Logs to Check:
```
Creating notification for userId: <userId> type: invoice_review
Notification created successfully: <notificationId>

Creating notification for userId: <userId> type: invoice_review_approved
Notification created successfully: <notificationId>

Creating notification for userId: <userId> type: invoice_review_rejected
Notification created successfully: <notificationId>

Getting notifications for userId: <userId>
Notifications found: 3

Getting unread count for userId: <userId>
Unread count: 2
```

### Frontend Console Logs to Check:
```
Fetched notifications: [...]
Fetched unread count: {unreadCount: 2}
Error marking notification as read: (if any)
Error fetching notifications: (if any)
```

---

## Troubleshooting

### Issue: Badge shows but no notifications in dropdown
- Check browser console for errors
- Check backend logs for database errors
- Verify userId is correct
- Refresh page and try again

### Issue: Rejection reason not showing
- Verify rejection reason was entered when rejecting
- Check database: `SELECT message FROM notifications WHERE type = 'invoice_review_rejected'`
- Message should include "Reason: {reason}"

### Issue: Notifications not updating
- Check if backend is running
- Check if frontend is built (npm run build)
- Clear browser cache (Ctrl+Shift+Delete)
- Restart backend server

### Issue: Badge count incorrect
- Click "Mark all as read" to reset
- Refresh page
- Check database for orphaned notifications

---

## Performance Notes

- Notifications fetch every 30 seconds automatically
- Also fetch when opening dropdown
- No caching - always fresh from database
- Unread count calculated in real-time
- Supports up to 99+ unread notifications

---

## Notification Types Summary

| Type | Icon | Color | Recipient | Trigger |
|------|------|-------|-----------|---------|
| invoice_review | 📋 | Blue | Clerk | Review sent |
| invoice_review_approved | ✅ | Green | Admin/Manager | Review approved |
| invoice_review_rejected | ❌ | Red | Admin/Manager | Review rejected |

---

## Success Criteria

- ✅ All three notification types appear correctly
- ✅ Icons display properly (📋 ✅ ❌)
- ✅ Colors are correct (blue/green/red)
- ✅ Rejection reason appears in message
- ✅ Badge count updates correctly
- ✅ Mark as read works
- ✅ Mark all as read works
- ✅ Notifications persist after refresh
- ✅ No console errors
- ✅ Database has all notifications
