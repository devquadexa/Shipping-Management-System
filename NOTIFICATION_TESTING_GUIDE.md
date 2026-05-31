# Notification System - Testing Guide

## Quick Test Scenario

### Prerequisites
- Backend running on port 5000
- Frontend running or deployed to backend-api/public
- Database with Notifications table created
- At least 2 users: 1 Admin/Manager and 1 Waff Clerk

### Test Steps

#### 1. Login as Admin/Manager
```
URL: http://localhost:5000/login
Username: admin_user
Password: admin_password
```

#### 2. Create a New Job
```
Navigate to: Jobs → Create New Job
Fill in:
  - Customer: Select any customer
  - Shipment Category: Select category
  - Other required fields
Click: Save Job
```

#### 3. Assign Job to Waff Clerk
```
In Job Details:
  - Click "Assign Users" button
  - Select one or more Waff Clerks
  - Add notes (optional)
  - Click "Assign"
Expected: Success message appears
```

#### 4. Verify Notification Created
```
Backend Check:
  - Query: SELECT * FROM Notifications WHERE type = 'JOB_ASSIGNED'
  - Should see new notification record
  - Verify userId matches assigned waff clerk
  - Verify isRead = 0 (unread)
```

#### 5. Login as Assigned Waff Clerk
```
URL: http://localhost:5000/login
Username: waff_clerk_user
Password: waff_clerk_password
```

#### 6. Check Notification Bell
```
Expected:
  - Bell icon visible in top navbar
  - Red badge showing "1" (unread count)
  - Click bell to open dropdown
  - See notification: "New Job Assigned - You have been assigned to Job #[jobId]"
```

#### 7. Mark Notification as Read
```
In Notification Dropdown:
  - Click checkmark (✓) on notification
Expected:
  - Notification disappears from dropdown
  - Badge count decreases
  - Database: isRead = 1
```

#### 8. Mark All as Read
```
In Notification Dropdown:
  - Click "Mark all as read" button
Expected:
  - All notifications disappear
  - Badge disappears
  - Database: All notifications have isRead = 1
```

## API Testing with cURL

### Get Unread Notifications
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/notifications/unread
```

Expected Response:
```json
{
  "notifications": [
    {
      "notificationId": 1,
      "userId": 123,
      "type": "JOB_ASSIGNED",
      "title": "New Job Assigned",
      "message": "You have been assigned to Job #456",
      "relatedId": 456,
      "relatedType": "JOB",
      "isRead": false,
      "createdDate": "2026-05-24T10:30:00Z"
    }
  ],
  "unreadCount": 1
}
```

### Mark Notification as Read
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/notifications/1/read
```

### Mark All as Read
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/notifications/mark-all-read
```

## Database Queries for Testing

### Check Notifications Table
```sql
SELECT * FROM Notifications
ORDER BY createdDate DESC;
```

### Check Unread Notifications for User
```sql
SELECT * FROM Notifications 
WHERE userId = 123 AND isRead = 0
ORDER BY createdDate DESC;
```

### Check Job Assignment Notifications
```sql
SELECT * FROM Notifications 
WHERE type = 'JOB_ASSIGNED'
ORDER BY createdDate DESC;
```

### Count Unread Notifications by User
```sql
SELECT userId, COUNT(*) as unreadCount
FROM Notifications
WHERE isRead = 0
GROUP BY userId;
```

### Mark All Notifications as Read for User
```sql
UPDATE Notifications
SET isRead = 1
WHERE userId = 123 AND isRead = 0;
```

## Browser Console Testing

### Check Notification Service
```javascript
// In browser console
import { notificationService } from './api/services/notificationService';

// Get unread notifications
notificationService.getUnreadNotifications()
  .then(data => console.log('Unread:', data))
  .catch(err => console.error('Error:', err));

// Mark as read
notificationService.markAsRead(1)
  .then(data => console.log('Marked as read:', data))
  .catch(err => console.error('Error:', err));
```

## Common Issues & Solutions

### Issue: Notification bell shows no badge
**Solution:**
1. Check if user is logged in
2. Verify JWT token is valid
3. Check browser console for API errors
4. Verify backend is running
5. Check if Notifications table exists in database

### Issue: Notification appears but doesn't disappear after marking as read
**Solution:**
1. Check if API call succeeded (check network tab)
2. Verify database was updated (run SQL query)
3. Try refreshing the page
4. Check browser console for errors

### Issue: Job assignment succeeds but no notification created
**Solution:**
1. Check backend logs for notification creation errors
2. Verify Notifications table exists
3. Verify user ID is correct
4. Check if createNotification use case is properly injected
5. Verify database connection is working

### Issue: Multiple notifications appearing for same job
**Solution:**
1. Check if job was assigned multiple times
2. Verify database doesn't have duplicate records
3. Check if notification creation is being called multiple times

## Performance Testing

### Load Test: Create 100 Notifications
```bash
# Run this in backend
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/notifications \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": 123, \"type\": \"JOB_ASSIGNED\", \"title\": \"Test $i\", \"message\": \"Test message $i\"}"
done
```

### Check Performance
```sql
-- Check notification count
SELECT COUNT(*) FROM Notifications;

-- Check average query time
SELECT * FROM Notifications 
WHERE userId = 123 AND isRead = 0
ORDER BY createdDate DESC;
```

## Regression Testing

After any changes, verify:
- [ ] Job assignment still works
- [ ] Notifications are created for each assigned user
- [ ] Notification bell displays correctly
- [ ] Unread count is accurate
- [ ] Mark as read functionality works
- [ ] Mark all as read functionality works
- [ ] Notifications persist after page refresh
- [ ] Notifications appear for multiple users
- [ ] No duplicate notifications created
- [ ] No errors in browser console
- [ ] No errors in backend logs

## Success Criteria

✅ **Test Passed When:**
1. Job is assigned to waff clerk
2. Notification appears in bell dropdown within 30 seconds
3. Unread count badge shows correct number
4. Clicking checkmark marks notification as read
5. Notification disappears from dropdown
6. Database shows isRead = 1
7. Refreshing page doesn't recreate notification
8. Multiple users can receive notifications independently
9. No errors in console or logs
10. System remains responsive

---

**Last Updated:** May 24, 2026
**Version:** 1.0.0
