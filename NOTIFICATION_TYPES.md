# Notification Types Documentation

## Overview
The notification system now supports three types of invoice review notifications:

## Notification Types

### 1. Invoice Review Sent
**Type:** `invoice_review`
**Icon:** 📋
**Color:** Blue background (#f0f7ff)
**Recipient:** Waff Clerk
**Trigger:** When Admin/Manager sends an invoice review to a clerk
**Message Format:** `{SenderName} sent you a new invoice review for job {JobId}`

**Example:**
```
Title: New Invoice Review
Message: John Admin sent you a new invoice review for job JOB-001
```

---

### 2. Invoice Review Approved
**Type:** `invoice_review_approved`
**Icon:** ✅
**Color:** Green background (#f0fdf4) with green left border
**Recipient:** Admin/Manager who sent the review
**Trigger:** When Waff Clerk approves an invoice review
**Message Format:** `{ClerkName} approved the invoice review for job {JobId}`

**Example:**
```
Title: Invoice Review Approved
Message: Sarah Clerk approved the invoice review for job JOB-001
```

---

### 3. Invoice Review Rejected
**Type:** `invoice_review_rejected`
**Icon:** ❌
**Color:** Red background (#fef2f2) with red left border
**Recipient:** Admin/Manager who sent the review
**Trigger:** When Waff Clerk rejects an invoice review
**Message Format:** `{ClerkName} rejected the invoice review for job {JobId}. Reason: {RejectionReason}`

**Example:**
```
Title: Invoice Review Rejected
Message: Sarah Clerk rejected the invoice review for job JOB-001. Reason: Missing payment details for transporter fees
```

---

## Notification Flow

### Scenario 1: Complete Approval Flow
1. Admin sends invoice review to Clerk
   - ✉️ Clerk receives: "New Invoice Review" notification
2. Clerk approves the review
   - ✉️ Admin receives: "Invoice Review Approved" notification

### Scenario 2: Rejection Flow
1. Admin sends invoice review to Clerk
   - ✉️ Clerk receives: "New Invoice Review" notification
2. Clerk rejects the review with reason
   - ✉️ Admin receives: "Invoice Review Rejected" notification (includes reason)

---

## Frontend Display

### Notification Badge
- Shows unread count on bell icon
- Hides when all notifications are read
- Max display: "99+"

### Notification Dropdown
- Shows all notifications (read and unread)
- Unread notifications have:
  - Colored background (blue/green/red)
  - Blue dot indicator on the right
  - Clickable to mark as read
- Read notifications have:
  - White background
  - No indicator dot
- Each notification shows:
  - Icon (📋/✅/❌)
  - Title
  - Message (including rejection reason if applicable)
  - Time (e.g., "5m ago", "2h ago")

### Mark as Read
- Click individual notification to mark as read
- Click "Mark all as read" button to mark all as read
- Badge count updates automatically

---

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  notificationId VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'invoice_review', 'invoice_review_approved', 'invoice_review_rejected'
  title NVARCHAR(255) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,  -- Includes rejection reason for rejected notifications
  relatedId VARCHAR(50),  -- reviewId
  isRead BIT DEFAULT 0,
  createdDate DATETIME DEFAULT GETDATE(),
  readDate DATETIME NULL
)
```

---

## API Endpoints

### Get Notifications
```
GET /api/notifications
Authorization: Bearer <token>

Response:
[
  {
    notificationId: "uuid",
    userId: "user-id",
    type: "invoice_review_rejected",
    title: "Invoice Review Rejected",
    message: "Sarah Clerk rejected the invoice review for job JOB-001. Reason: Missing payment details",
    relatedId: "review-id",
    isRead: 0,
    createdDate: "2024-05-15T10:30:00Z",
    readDate: null
  }
]
```

### Get Unread Count
```
GET /api/notifications/unread-count
Authorization: Bearer <token>

Response:
{
  unreadCount: 3
}
```

### Mark as Read
```
PATCH /api/notifications/{notificationId}/read
Authorization: Bearer <token>

Response:
{
  message: "Notification marked as read"
}
```

### Mark All as Read
```
PATCH /api/notifications/read-all
Authorization: Bearer <token>

Response:
{
  message: "All notifications marked as read"
}
```

---

## Testing Checklist

- [ ] Send invoice review - Clerk receives notification
- [ ] Approve review - Admin receives approval notification
- [ ] Reject review - Admin receives rejection notification with reason
- [ ] Click notification - Marks as read
- [ ] Badge count - Updates correctly
- [ ] Mark all as read - All notifications marked as read
- [ ] Notification persists - After page refresh
- [ ] Rejection reason - Appears in rejection notification message

---

## Future Enhancements

- Real-time notifications using WebSockets
- Email notifications for important actions
- Notification preferences (which types to receive)
- Notification history/archive
- Delete individual notifications
- Notification categories/filtering
- Sound/browser notifications
- Notification scheduling (quiet hours)
