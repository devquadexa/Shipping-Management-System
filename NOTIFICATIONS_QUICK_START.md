# Notifications System - Quick Start Guide

## 5-Minute Setup

### 1. Database Setup (1 minute)
```bash
cd backend-api
sqlcmd -S localhost:63951 -U SUPER_SHINE_CARGO -P your_password -d SuperShineCargoDb -i create-notifications-system.sql
```

### 2. Backend Ready (Already Done!)
✅ All backend files created
✅ DI container updated
✅ Routes registered
✅ Just restart server: `npm start`

### 3. Frontend Setup (3 minutes)

#### Create Notification Service
**File**: `frontend/src/api/services/notificationService.js`
```javascript
import apiClient from '../client';

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

#### Create Notification Bell Component
**File**: `frontend/src/components/NotificationBell.js`
```javascript
import React, { useState, useEffect } from 'react';
import { notificationService } from '../api/services/notificationService';
import { useAuth } from '../context/AuthContext';
import '../styles/NotificationBell.css';

function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
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
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="bell-button"
        title="Notifications"
      >
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
                    title="Mark as read"
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

#### Create Notification Styles
**File**: `frontend/src/styles/NotificationBell.css`
```css
.notification-bell {
  position: relative;
  display: flex;
  align-items: center;
}

.bell-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  position: relative;
  padding: 0.5rem;
  transition: transform 0.2s;
}

.bell-button:hover {
  transform: scale(1.1);
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #101036;
}

.mark-all-btn {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.mark-all-btn:hover {
  background: #f3f4f6;
}

.notification-list {
  overflow-y: auto;
  flex: 1;
}

.notification-item {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-content h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: #101036;
  font-weight: 600;
}

.notification-content p {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.notification-content small {
  font-size: 0.75rem;
  color: #9ca3af;
}

.mark-read-btn {
  background: none;
  border: none;
  color: #10b981;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.mark-read-btn:hover {
  color: #059669;
}

.no-notifications {
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
}
```

#### Add to Navbar
**File**: `frontend/src/components/Navbar.js`
```javascript
import NotificationBell from './NotificationBell';

// In the navbar JSX, add:
<NotificationBell />
```

### 4. Build & Deploy (1 minute)
```bash
cd frontend
npm run build
cd ../backend-api
# Copy build files
cp -r ../frontend/build/* public/
npm start
```

## Testing

### Test Job Assignment Notification
1. Login as Admin
2. Create a job
3. Assign to a Waff Clerk
4. Login as Waff Clerk
5. Check notification bell - should show "New Job Assigned"

### Test Petty Cash Notification
1. Login as Admin
2. Create petty cash assignment
3. Assign to a Waff Clerk
4. Login as Waff Clerk
5. Check notification bell - should show "Petty Cash Assigned"

## API Endpoints

```bash
# Get notifications
curl -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications

# Get unread
curl -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications/unread

# Mark as read
curl -X PATCH -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications/{id}/read

# Mark all as read
curl -X PATCH -H "Authorization: Bearer {token}" http://localhost:5000/api/notifications/mark-all-read
```

## Notification Types

| Type | Trigger | Message |
|------|---------|---------|
| JOB_ASSIGNED | Job assigned to user | "You have been assigned to Job {jobId}" |
| PETTY_CASH_ASSIGNED | Petty cash assigned | "Petty cash of LKR {amount} assigned for Job {jobId}" |
| JOB_UPDATED | Job status changes | "Job {jobId} status updated to {status}" |
| PAYMENT_RECEIVED | Payment received | "Payment of LKR {amount} received" |
| BILL_GENERATED | Bill created | "Bill generated for Job {jobId}" |
| SETTLEMENT_COMPLETED | Settlement done | "Petty cash settlement completed" |

## Troubleshooting

### Notifications not appearing
- [ ] Check database table exists: `SELECT * FROM Notifications`
- [ ] Check backend logs for errors
- [ ] Verify user ID in JWT token
- [ ] Check if routes are registered

### Unread count not updating
- [ ] Check if polling is working (30 second interval)
- [ ] Check browser console for API errors
- [ ] Verify API endpoint returns correct data

### Database errors
- [ ] Run SQL script again
- [ ] Check if table exists: `SELECT * FROM sys.tables WHERE name = 'Notifications'`
- [ ] Verify foreign key to Users table

## Files Created

### Backend
- `backend-api/create-notifications-system.sql`
- `backend-api/src/domain/entities/Notification.js`
- `backend-api/src/infrastructure/repositories/MSSQLNotificationRepository.js`
- `backend-api/src/application/use-cases/notification/*.js` (5 files)
- `backend-api/src/presentation/controllers/NotificationController.js`
- `backend-api/src/presentation/routes/notifications.js`

### Frontend
- `frontend/src/api/services/notificationService.js`
- `frontend/src/components/NotificationBell.js`
- `frontend/src/styles/NotificationBell.css`

### Documentation
- `NOTIFICATIONS_SYSTEM_IMPLEMENTATION.md` (Complete guide)
- `NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md` (Overview)
- `NOTIFICATIONS_QUICK_START.md` (This file)

## Next Steps

1. ✅ Run database migration
2. ✅ Create frontend components
3. ✅ Add to Navbar
4. ✅ Build and deploy
5. ✅ Test notifications
6. ✅ Monitor in production

## Support

- Full documentation: `NOTIFICATIONS_SYSTEM_IMPLEMENTATION.md`
- Database schema: `create-notifications-system.sql`
- Code examples: Backend and frontend files

---

**Status**: ✅ Ready for implementation
**Estimated Time**: 5-10 minutes
**Difficulty**: Easy
