# Notification System Implementation

## Overview
A user-specific notification system has been implemented with a bell icon in the navigation bar that displays a dropdown with notifications. Unread notifications show a badge count and are visually distinguished.

## Database Setup

### New Table: `notifications`
Run the SQL script to create the notifications table:
```bash
# Execute: backend-api/create-notifications-table.sql
```

**Table Structure:**
- `notificationId` (VARCHAR 50, PK) - Unique identifier
- `userId` (VARCHAR 50, FK) - User receiving the notification
- `type` (VARCHAR 50) - Notification type (e.g., 'invoice_review')
- `title` (NVARCHAR 255) - Notification title
- `message` (NVARCHAR MAX) - Notification message
- `relatedId` (VARCHAR 50) - Related entity ID (e.g., reviewId)
- `isRead` (BIT) - Read status (0 = unread, 1 = read)
- `createdDate` (DATETIME) - Creation timestamp
- `readDate` (DATETIME) - When marked as read

**Indexes:**
- userId
- isRead
- userId + isRead (composite)
- createdDate

## Backend Implementation

### New Files
1. **NotificationController.js** - Handles notification operations
   - `getNotifications()` - Fetch all notifications for user
   - `getUnreadCount()` - Get count of unread notifications
   - `markAsRead()` - Mark single notification as read
   - `markAllAsRead()` - Mark all notifications as read
   - `createNotification()` - Create new notification (static method)

2. **notificationRoutes.js** - API endpoints
   - `GET /api/notifications` - Get all notifications
   - `GET /api/notifications/unread-count` - Get unread count
   - `PATCH /api/notifications/:notificationId/read` - Mark as read
   - `PATCH /api/notifications/read-all` - Mark all as read

### Modified Files
1. **InvoiceReviewController.js**
   - Updated `sendReview()` to create a notification when sending invoice review to clerk
   - Notification includes sender name and job ID

2. **index.js**
   - Added notification routes to Express app

## Frontend Implementation

### New Files
1. **NotificationBell.js** - Main notification component
   - Bell icon with unread count badge
   - Dropdown showing all notifications
   - Click to mark individual notification as read
   - "Mark all as read" button
   - Auto-refresh every 30 seconds
   - Click outside to close dropdown

2. **notificationService.js** - API service
   - `getNotifications()` - Fetch notifications
   - `getUnreadCount()` - Get unread count
   - `markAsRead()` - Mark notification as read
   - `markAllAsRead()` - Mark all as read

3. **NotificationBell.css** - Styling
   - Bell button with badge
   - Dropdown styling
   - Notification item styling
   - Responsive design for mobile

### Modified Files
1. **TopBar.js**
   - Added NotificationBell component
   - Replaced static notification button with functional component

## Features

### Current Implementation
- ✅ Bell icon in top navigation bar
- ✅ Unread notification count badge
- ✅ Dropdown showing all notifications
- ✅ Notifications for new invoice reviews sent to specific users
- ✅ Mark individual notification as read
- ✅ Mark all notifications as read
- ✅ Visual distinction for unread notifications (blue background + indicator dot)
- ✅ Auto-refresh every 30 seconds
- ✅ Click outside to close dropdown
- ✅ Responsive design

### Notification Types
Currently implemented:
- `invoice_review` - When a new invoice review is sent to a clerk
- `JOB_ASSIGNED` - When a user is assigned to a job ✅ NEW
- `PETTY_CASH_ASSIGNED` - When petty cash is assigned to a user ✅ NEW

### Future Enhancement Opportunities
- Real-time notifications using WebSockets
- Email notifications
- Notification preferences/settings
- Notification categories/filtering
- Delete notifications
- Notification history/archive
- Sound/browser notifications

## Usage

### For Users
1. Click the bell icon in the top navigation bar
2. View all notifications in the dropdown
3. Unread notifications show a blue dot indicator
4. Click a notification to mark it as read
5. Click "Mark all as read" to mark all notifications as read
6. Notifications auto-refresh every 30 seconds

### For Developers
To create a notification when an action occurs:

```javascript
const NotificationController = require('../controllers/NotificationController');

// Create notification
await NotificationController.createNotification(
  userId,
  'notification_type',
  'Notification Title',
  'Notification message with details',
  relatedId // optional
);
```

Example from InvoiceReviewController:
```javascript
await NotificationController.createNotification(
  clerkId,
  'invoice_review',
  'New Invoice Review',
  `${sender?.FullName || 'Admin'} sent you a new invoice review for job ${jobId}`,
  reviewId
);
```

## Testing

### Manual Testing Steps
1. Login as Admin/Manager
2. Create an invoice review and send it to a Waff Clerk
3. Login as the Waff Clerk
4. Check the bell icon - should show unread count badge
5. Click bell icon to open dropdown
6. Verify notification appears with correct message
7. Click notification to mark as read
8. Verify badge count decreases
9. Verify notification no longer shows blue indicator

### API Testing
```bash
# Get notifications
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/notifications

# Get unread count
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/notifications/unread-count

# Mark as read
curl -X PATCH -H "Authorization: Bearer <token>" http://localhost:5000/api/notifications/<notificationId>/read

# Mark all as read
curl -X PATCH -H "Authorization: Bearer <token>" http://localhost:5000/api/notifications/read-all
```

## Notes
- Notifications are user-specific and only visible to the recipient
- Unread count is calculated in real-time from the database
- Notifications persist in the database for historical reference
- The system is designed to be extensible for additional notification types
