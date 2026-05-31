# Notification Trigger Implementation - Job Assignment

## Overview
The notification system has been successfully integrated with the job assignment workflow. When an admin or manager assigns a job to a waff clerk, the assigned user automatically receives a notification.

## Implementation Details

### 1. Backend Changes

#### Modified Files:
- **`backend-api/src/application/use-cases/job/AssignMultipleUsersToJob.js`**
  - Added `createNotification` parameter to constructor
  - Added notification creation logic after successful job assignment
  - Creates a `JOB_ASSIGNED` notification for each assigned user
  - Includes error handling to prevent notification failures from blocking job assignment

- **`backend-api/src/infrastructure/di/container.js`**
  - Reorganized dependency injection to set up notification use cases BEFORE job use cases
  - Passes `createNotification` use case to `AssignMultipleUsersToJob` constructor
  - Ensures notifications are created whenever jobs are assigned

### 2. Notification Flow

```
Admin/Manager Creates Job
    ↓
Admin/Manager Assigns Job to Waff Clerk(s)
    ↓
AssignMultipleUsersToJob.execute() is called
    ↓
Job is assigned in database
    ↓
For each assigned user:
    - CreateNotification.execute() is called
    - Notification is stored in database
    ↓
Waff Clerk logs in
    ↓
NotificationBell component fetches unread notifications
    ↓
Notification appears in notification dropdown
```

### 3. Notification Details

**Notification Type:** `JOB_ASSIGNED`

**Notification Structure:**
```javascript
{
  userId: "assigned_user_id",
  type: "JOB_ASSIGNED",
  title: "New Job Assigned",
  message: "You have been assigned to Job #[jobId]",
  relatedId: jobId,
  relatedType: "JOB",
  metadata: {
    jobId: jobId,
    assignedBy: admin_user_id,
    assignmentNotes: notes_if_any
  },
  createdBy: admin_user_id
}
```

### 4. Frontend Components

#### NotificationBell Component (`frontend/src/components/NotificationBell.js`)
- Displays bell icon in navbar
- Shows unread count badge
- Fetches unread notifications every 30 seconds
- Allows users to mark notifications as read
- Displays notification details (title, message, timestamp)

#### Notification Service (`frontend/src/api/services/notificationService.js`)
- `getNotifications()` - Fetch all notifications
- `getUnreadNotifications()` - Fetch unread notifications only
- `markAsRead()` - Mark single notification as read
- `markAllAsRead()` - Mark all notifications as read

### 5. API Endpoints

All endpoints require authentication (Bearer token in Authorization header)

**GET /api/notifications**
- Fetch all notifications for the logged-in user
- Query params: `limit`, `offset`
- Returns: Array of notifications

**GET /api/notifications/unread**
- Fetch unread notifications for the logged-in user
- Query params: `limit`, `offset`
- Returns: Array of unread notifications with unread count

**PATCH /api/notifications/:notificationId/read**
- Mark a specific notification as read
- Returns: Updated notification

**PATCH /api/notifications/mark-all-read**
- Mark all notifications as read for the user
- Returns: Success message

### 6. Database Schema

**Notifications Table:**
```sql
CREATE TABLE Notifications (
  notificationId BIGINT PRIMARY KEY,
  userId BIGINT NOT NULL,
  type NVARCHAR(50) NOT NULL,
  title NVARCHAR(255) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  relatedId BIGINT,
  relatedType NVARCHAR(50),
  metadata NVARCHAR(MAX),
  isRead BIT DEFAULT 0,
  createdDate DATETIME DEFAULT GETDATE(),
  createdBy BIGINT,
  FOREIGN KEY (userId) REFERENCES Users(userId)
)
```

### 7. Testing the Notification System

#### Step 1: Create a Job
1. Login as Admin or Manager
2. Navigate to Jobs section
3. Create a new job with required details
4. Save the job

#### Step 2: Assign Job to Waff Clerk
1. In the job details, click "Assign Users"
2. Select one or more Waff Clerks
3. Click "Assign"
4. Confirm the assignment

#### Step 3: Verify Notification
1. Login as the assigned Waff Clerk
2. Look at the notification bell icon in the navbar
3. The bell should show a red badge with the unread count
4. Click the bell to open the notification dropdown
5. You should see "New Job Assigned" notification with the job ID

#### Step 4: Mark as Read
1. Click the checkmark (✓) on the notification to mark it as read
2. Or click "Mark all as read" to mark all notifications as read
3. The notification should disappear from the unread list

### 8. Error Handling

- If notification creation fails, the job assignment still succeeds
- Errors are logged to console but don't block the assignment
- This ensures the system is resilient to notification service issues

### 9. Future Enhancements

The notification system is designed to support additional notification types:

- `PETTY_CASH_ASSIGNED` - When petty cash is assigned to a user
- `JOB_UPDATED` - When job status changes
- `PAYMENT_RECEIVED` - When payment is received
- `BILL_GENERATED` - When a bill is created
- `SETTLEMENT_COMPLETED` - When petty cash settlement is completed
- `PASSWORD_RESET_APPROVED` - When password reset is approved
- `PASSWORD_RESET_REJECTED` - When password reset is rejected
- `USER_CREATED` - When a new user is created
- `SYSTEM_ALERT` - For system-wide alerts

### 10. Configuration

**Notification Polling Interval:** 30 seconds (configurable in NotificationBell.js)
**Unread Notifications Limit:** 10 per fetch (configurable in notificationService.js)

### 11. Files Modified

**Backend:**
- `backend-api/src/application/use-cases/job/AssignMultipleUsersToJob.js`
- `backend-api/src/infrastructure/di/container.js`

**Frontend:**
- `frontend/src/components/Navbar.js` (removed duplicate notification bell)
- `frontend/src/components/NotificationBell.js` (updated icon styling)
- `frontend/src/styles/NotificationBell.css` (professional styling)

### 12. Deployment Instructions

1. **Backend:**
   ```bash
   cd backend-api
   npm install
   docker compose build --no-cache backend
   docker compose up -d backend
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm run build
   cp -r build/* ../backend-api/public/
   ```

3. **Database:**
   - Notification table already created via `create-notifications-system.sql`
   - No additional migrations needed

### 13. Verification Checklist

- [x] Backend syntax validated
- [x] DI container properly configured
- [x] Notification creation logic implemented
- [x] Frontend notification bell component created
- [x] Notification service API layer created
- [x] Professional SVG icon implemented
- [x] Duplicate notification bell removed
- [x] Frontend built successfully
- [x] Build files deployed to backend-api/public/

### 14. Support & Troubleshooting

**Notifications not appearing:**
1. Check browser console for API errors
2. Verify user is logged in
3. Check backend logs for notification creation errors
4. Verify database Notifications table exists
5. Check if user ID in JWT token matches database

**Unread count not updating:**
1. Check if polling is working (30 second interval)
2. Verify API endpoint returns correct data
3. Check browser network tab for API calls

**Database errors:**
1. Run: `SELECT * FROM sys.tables WHERE name = 'Notifications'`
2. Verify foreign key to Users table
3. Check if notification repository is properly initialized

---

**Status:** ✅ Ready for Production
**Last Updated:** May 24, 2026
**Version:** 1.0.0
