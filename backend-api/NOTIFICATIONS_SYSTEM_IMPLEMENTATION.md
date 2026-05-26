# Notifications System Implementation Guide

## Overview

The Notifications System is a comprehensive solution for sending real-time notifications to users when important events occur in the Shipping Management System. This includes:

- **Job Assignments**: When a job is assigned to a Waff Clerk
- **Petty Cash Assignments**: When petty cash is assigned to a Waff Clerk
- **Job Updates**: When job status changes
- **Payment Notifications**: When payments are received
- **Bill Generation**: When bills are generated
- **Settlement Completion**: When petty cash settlements are completed

## Database Schema

### Notifications Table

```sql
CREATE TABLE Notifications (
    notificationId VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    relatedId VARCHAR(50) NULL,
    relatedType VARCHAR(50) NULL,
    isRead BIT DEFAULT 0,
    readDate DATETIME NULL,
    metadata NVARCHAR(MAX) NULL,
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    createdBy VARCHAR(50) NULL,
    CONSTRAINT FK_Notifications_UserId FOREIGN KEY (userId) REFERENCES Users(UserId) ON DELETE CASCADE
);
```

### Indexes

- `IX_Notifications_UserId`: Fast lookup by user
- `IX_Notifications_IsRead`: Filter unread notifications
- `IX_Notifications_UserId_IsRead`: Combined index for common queries
- `IX_Notifications_CreatedDate`: Sort by date
- `IX_Notifications_Type`: Filter by notification type
- `IX_Notifications_RelatedId`: Find notifications related to specific entities

## Notification Types

```
JOB_ASSIGNED              - When a job is assigned to a user
PETTY_CASH_ASSIGNED       - When petty cash is assigned to a user
JOB_UPDATED               - When a job is updated
PAYMENT_RECEIVED          - When a payment is received
BILL_GENERATED            - When a bill is generated
SETTLEMENT_COMPLETED      - When petty cash settlement is completed
PASSWORD_RESET_APPROVED   - When password reset is approved
PASSWORD_RESET_REJECTED   - When password reset is rejected
USER_CREATED              - When a new user is created
SYSTEM_ALERT              - General system alerts
```

## Backend Architecture

### Domain Layer

**Notification Entity** (`src/domain/entities/Notification.js`)
- Represents a notification with all its properties
- Validates notification data
- Provides methods to mark as read/unread

### Application Layer (Use Cases)

1. **CreateNotification** - Creates a new notification
2. **GetUserNotifications** - Retrieves all notifications for a user
3. **GetUnreadNotifications** - Retrieves unread notifications for a user
4. **MarkNotificationAsRead** - Marks a single notification as read
5. **MarkAllNotificationsAsRead** - Marks all notifications as read for a user

### Infrastructure Layer

**MSSQLNotificationRepository** (`src/infrastructure/repositories/MSSQLNotificationRepository.js`)
- Implements all data access operations
- Methods:
  - `create()` - Create notification
  - `findById()` - Get notification by ID
  - `findByUserId()` - Get all notifications for user
  - `findUnreadByUserId()` - Get unread notifications
  - `getUnreadCount()` - Count unread notifications
  - `findByRelatedId()` - Find notifications related to entity
  - `findByType()` - Find notifications by type
  - `markAsRead()` - Mark as read
  - `markAsUnread()` - Mark as unread
  - `markAllAsRead()` - Mark all as read
  - `delete()` - Delete notification
  - `deleteByUserId()` - Delete all for user
  - `deleteOldNotifications()` - Clean up old notifications

### Presentation Layer

**NotificationController** (`src/presentation/controllers/NotificationController.js`)
- Handles HTTP requests
- Methods:
  - `create()` - POST /api/notifications
  - `getMyNotifications()` - GET /api/notifications
  - `getMyUnreadNotifications()` - GET /api/notifications/unread
  - `markAsRead()` - PATCH /api/notifications/:notificationId/read
  - `markAllAsRead()` - PATCH /api/notifications/mark-all-read

**Notification Routes** (`src/presentation/routes/notifications.js`)
- Defines all notification endpoints
- All endpoints require authentication

## API Endpoints

### Get Notifications

```
GET /api/notifications
Query Parameters:
  - limit: number (default: 50)
  - offset: number (default: 0)

Response:
{
  "notifications": [
    {
      "notificationId": "NOTIF00001",
      "userId": "USER0002",
      "type": "JOB_ASSIGNED",
      "title": "New Job Assigned",
      "message": "You have been assigned to Job JOB0001",
      "relatedId": "JOB0001",
      "relatedType": "Job",
      "isRead": false,
      "readDate": null,
      "metadata": {...},
      "createdDate": "2026-05-18T10:30:00Z",
      "createdBy": "USER0001"
    }
  ],
  "unreadCount": 5,
  "total": 50
}
```

### Get Unread Notifications

```
GET /api/notifications/unread
Query Parameters:
  - limit: number (default: 50)
  - offset: number (default: 0)

Response:
{
  "notifications": [...],
  "unreadCount": 5,
  "total": 5
}
```

### Mark Notification as Read

```
PATCH /api/notifications/:notificationId/read

Response:
{
  "notificationId": "NOTIF00001",
  "userId": "USER0002",
  "type": "JOB_ASSIGNED",
  "title": "New Job Assigned",
  "message": "You have been assigned to Job JOB0001",
  "isRead": true,
  "readDate": "2026-05-18T10:35:00Z",
  ...
}
```

### Mark All Notifications as Read

```
PATCH /api/notifications/mark-all-read

Response:
{
  "success": true
}
```

## Integration Points

### 1. Job Assignment Notification

**When**: A job is assigned to a user
**Where**: `AssignMultipleUsersToJob` use case
**Trigger**:

```javascript
// In AssignMultipleUsersToJob.execute()
for (const userId of userIds) {
  // Assign user to job...
  
  // Create notification
  await createNotification.execute({
    userId: userId,
    type: 'JOB_ASSIGNED',
    title: 'New Job Assigned',
    message: `You have been assigned to Job ${job.jobId} - BL: ${job.blNumber}`,
    relatedId: job.jobId,
    relatedType: 'Job',
    createdBy: assignedBy,
    metadata: {
      jobId: job.jobId,
      blNumber: job.blNumber,
      customerId: job.customerId,
      shipmentCategory: job.shipmentCategory
    }
  });
}
```

### 2. Petty Cash Assignment Notification

**When**: Petty cash is assigned to a user
**Where**: `CreatePettyCashAssignment` use case
**Trigger**:

```javascript
// In CreatePettyCashAssignment.execute()
const assignment = await this.pettyCashAssignmentRepository.create(assignmentData);

// Create notification
await createNotification.execute({
  userId: assignmentData.assignedTo,
  type: 'PETTY_CASH_ASSIGNED',
  title: 'Petty Cash Assigned',
  message: `Petty cash of LKR ${assignmentData.assignedAmount.toFixed(2)} has been assigned for Job ${assignmentData.jobId}`,
  relatedId: assignment.assignmentId,
  relatedType: 'PettyCashAssignment',
  createdBy: assignmentData.assignedBy,
  metadata: {
    assignmentId: assignment.assignmentId,
    jobId: assignmentData.jobId,
    assignedAmount: assignmentData.assignedAmount,
    assignedBy: assignmentData.assignedBy
  }
});
```

### 3. Job Status Update Notification

**When**: Job status changes
**Where**: `UpdateJobStatus` use case
**Trigger**:

```javascript
// In UpdateJobStatus.execute()
const oldStatus = job.status;
job.updateStatus(newStatus);
await this.jobRepository.updateStatus(jobId, newStatus);

// Notify assigned users
for (const userId of job.getAssignedUserIds()) {
  await createNotification.execute({
    userId: userId,
    type: 'JOB_UPDATED',
    title: 'Job Status Updated',
    message: `Job ${jobId} status has been updated from ${oldStatus} to ${newStatus}`,
    relatedId: jobId,
    relatedType: 'Job',
    createdBy: req.user.userId,
    metadata: {
      jobId: jobId,
      oldStatus: oldStatus,
      newStatus: newStatus
    }
  });
}
```

## Frontend Implementation

### Notification Service

```javascript
// src/api/services/notificationService.js
export const notificationService = {
  getNotifications: async (limit = 50, offset = 0) => {
    const response = await apiClient.get('/notifications', {
      params: { limit, offset }
    });
    return response.data;
  },

  getUnreadNotifications: async (limit = 50, offset = 0) => {
    const response = await apiClient.get('/notifications/unread', {
      params: { limit, offset }
    });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  }
};
```

### Notification Component

```javascript
// src/components/NotificationBell.js
import React, { useState, useEffect } from 'react';
import { notificationService } from '../api/services/notificationService';
import { useAuth } from '../context/AuthContext';

function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const result = await notificationService.getUnreadNotifications(10);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setIsOpen(!isOpen)} className="bell-button">
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-btn">
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No unread notifications</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.notificationId} className="notification-item">
                  <div className="notification-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <small>{new Date(notif.createdDate).toLocaleString()}</small>
                  </div>
                  <button
                    onClick={() => handleMarkAsRead(notif.notificationId)}
                    className="mark-read-btn"
                  >
                    ✓
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
```

### Notification Context (Optional)

```javascript
// src/context/NotificationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { notificationService } from '../api/services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const result = await notificationService.getUnreadNotifications(50);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
```

## Implementation Steps

### Step 1: Database Setup
```bash
# Run the SQL script to create the Notifications table
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P your_password -d SuperShineCargoDb -i create-notifications-system.sql
```

### Step 2: Backend Setup
1. Create all files in `src/domain/entities/`, `src/infrastructure/repositories/`, `src/application/use-cases/notification/`, `src/presentation/controllers/`, and `src/presentation/routes/`
2. Update `src/infrastructure/di/container.js` to register notification dependencies
3. Update `src/index.js` to include notification routes
4. Restart backend server

### Step 3: Frontend Setup
1. Create `src/api/services/notificationService.js`
2. Create `src/components/NotificationBell.js`
3. (Optional) Create `src/context/NotificationContext.js`
4. Add NotificationBell to Navbar component
5. Build and deploy frontend

### Step 4: Integration
1. Update `AssignMultipleUsersToJob` use case to create notifications
2. Update `CreatePettyCashAssignment` use case to create notifications
3. Update `UpdateJobStatus` use case to create notifications
4. Test all notification triggers

## Testing

### Manual Testing

1. **Job Assignment Notification**
   - Create a job
   - Assign it to a Waff Clerk
   - Check if notification appears in Waff Clerk's notification list

2. **Petty Cash Assignment Notification**
   - Create a petty cash assignment
   - Check if notification appears for assigned user

3. **Mark as Read**
   - Click on notification to mark as read
   - Verify unread count decreases

### API Testing

```bash
# Get notifications
curl -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications

# Get unread notifications
curl -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications/unread

# Mark as read
curl -X PATCH -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications/{notificationId}/read

# Mark all as read
curl -X PATCH -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications/mark-all-read
```

## Performance Considerations

1. **Indexes**: All important queries have indexes for fast retrieval
2. **Pagination**: Use limit/offset for large notification lists
3. **Cleanup**: Periodically delete old notifications (older than 30 days)
4. **Polling**: Frontend polls every 30 seconds (can be optimized with WebSockets)

## Future Enhancements

1. **WebSocket Support**: Real-time notifications instead of polling
2. **Email Notifications**: Send email for important notifications
3. **SMS Notifications**: Send SMS for urgent notifications
4. **Notification Preferences**: Allow users to customize notification settings
5. **Notification Templates**: Create reusable notification templates
6. **Notification History**: Archive old notifications
7. **Notification Analytics**: Track notification engagement

## Troubleshooting

### Notifications not appearing
1. Check if notification repository is registered in DI container
2. Verify notification routes are registered in index.js
3. Check browser console for API errors
4. Verify user ID is correct in JWT token

### Unread count not updating
1. Check if polling interval is working
2. Verify API endpoint returns correct unreadCount
3. Check if markAsRead endpoint is working

### Database errors
1. Verify Notifications table exists
2. Check if indexes are created
3. Verify foreign key constraint to Users table

## Support

For issues or questions, refer to:
- Database schema: `create-notifications-system.sql`
- Backend code: `src/` directory
- Frontend code: `frontend/src/` directory
