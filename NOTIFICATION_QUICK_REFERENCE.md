# Notification System - Quick Reference

## Notification Types at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TYPES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 INVOICE REVIEW SENT                                         │
│  ├─ Type: invoice_review                                        │
│  ├─ Recipient: Waff Clerk                                       │
│  ├─ Trigger: Admin sends review                                 │
│  ├─ Message: "{Admin} sent you a new invoice review..."         │
│  └─ Color: Blue background                                      │
│                                                                 │
│  ✅ INVOICE REVIEW APPROVED                                     │
│  ├─ Type: invoice_review_approved                               │
│  ├─ Recipient: Admin/Manager                                    │
│  ├─ Trigger: Clerk approves review                              │
│  ├─ Message: "{Clerk} approved the invoice review..."           │
│  └─ Color: Green background + green border                      │
│                                                                 │
│  ❌ INVOICE REVIEW REJECTED                                     │
│  ├─ Type: invoice_review_rejected                               │
│  ├─ Recipient: Admin/Manager                                    │
│  ├─ Trigger: Clerk rejects review                               │
│  ├─ Message: "{Clerk} rejected... Reason: {reason}"             │
│  └─ Color: Red background + red border                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Notification Flow Diagram

```
SCENARIO 1: APPROVAL FLOW
═════════════════════════

Admin/Manager                          Waff Clerk
     │                                    │
     ├─ Send Invoice Review ────────────→ │
     │                                    │
     │                    📋 Notification │
     │                    (Unread)        │
     │                                    │
     │                    ✓ Approve ←─────┤
     │                                    │
     ✅ Notification                      │
     (Approved)                           │


SCENARIO 2: REJECTION FLOW
══════════════════════════

Admin/Manager                          Waff Clerk
     │                                    │
     ├─ Send Invoice Review ────────────→ │
     │                                    │
     │                    📋 Notification │
     │                    (Unread)        │
     │                                    │
     │                    ✗ Reject ←──────┤
     │                    + Reason        │
     │                                    │
     ❌ Notification                      │
     (Rejected + Reason)                  │
```

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Super Shine Cargo Service                    🔄  🔔  👤   │
│                                                  ↓           │
│                                          ┌──────────────────┐│
│                                          │ Notifications    ││
│                                          │ Mark all as read ││
│                                          ├──────────────────┤│
│                                          │ 📋 New Invoice   ││
│                                          │ John sent you... ││
│                                          │ 5m ago      ●    ││
│                                          ├──────────────────┤│
│                                          │ ✅ Approved      ││
│                                          │ Sarah approved.. ││
│                                          │ 2h ago           ││
│                                          ├──────────────────┤│
│                                          │ ❌ Rejected      ││
│                                          │ Mike rejected... ││
│                                          │ Reason: Missing..││
│                                          │ 1d ago           ││
│                                          └──────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Badge Behavior

```
No Notifications          1 Notification           Multiple
─────────────────         ──────────────           ──────────
      🔔                        🔔                      🔔
                                1                      99+
```

## Notification Item States

```
UNREAD NOTIFICATION              READ NOTIFICATION
─────────────────────            ─────────────────
┌─────────────────────┐          ┌─────────────────────┐
│ 📋 Title            │          │ 📋 Title            │
│ Message text here   │          │ Message text here   │
│ 5m ago          ●   │          │ 5m ago              │
│ (Blue background)   │          │ (White background)  │
└─────────────────────┘          └─────────────────────┘
```

## Color Coding

```
NOTIFICATION TYPE              COLOR CODE           BORDER
─────────────────────────────────────────────────────────────
Invoice Review Sent            #f0f7ff (Blue)       None
Invoice Review Approved        #f0fdf4 (Green)      Green
Invoice Review Rejected        #fef2f2 (Red)        Red
```

## Workflow Timeline

```
TIME    ADMIN/MANAGER              WAFF CLERK              NOTIFICATIONS
────────────────────────────────────────────────────────────────────────
T0      Send Review ──────────────→ Receives Review        📋 (Clerk)
        
T1                                 Approves Review ──────→ ✅ (Admin)
        
        OR
        
T1                                 Rejects Review ───────→ ❌ (Admin)
                                    + Reason              + Reason
```

## Database Schema (Simplified)

```
notifications
├─ notificationId (UUID)
├─ userId (FK to Users)
├─ type (enum: invoice_review, invoice_review_approved, invoice_review_rejected)
├─ title (string)
├─ message (string - includes rejection reason)
├─ relatedId (FK to invoice_reviews)
├─ isRead (boolean)
├─ createdDate (datetime)
└─ readDate (datetime)
```

## API Endpoints Summary

```
GET    /api/notifications                    → Get all notifications
GET    /api/notifications/unread-count       → Get unread count
PATCH  /api/notifications/:id/read           → Mark as read
PATCH  /api/notifications/read-all           → Mark all as read
```

## Key Statistics

```
Notification Types:        3
  - Sent
  - Approved
  - Rejected

Recipients:               2
  - Waff Clerk (for sent)
  - Admin/Manager (for approved/rejected)

Auto-refresh Interval:    30 seconds
Max Badge Display:        99+
Database Indexes:         4
  - userId
  - isRead
  - userId + isRead
  - createdDate
```

## Common Actions

```
ACTION                          RESULT
──────────────────────────────────────────────────────────
Click bell icon                 Open/close dropdown
Click notification              Mark as read
Click "Mark all as read"        Mark all as read
Refresh page                    Notifications persist
Wait 30 seconds                 Auto-refresh notifications
```

## Troubleshooting Quick Links

```
Issue                           Solution
─────────────────────────────────────────────────────────
No badge showing                Check backend logs
No notifications in dropdown    Verify userId in database
Rejection reason missing        Check message field in DB
Badge count wrong               Click "Mark all as read"
Notifications not updating      Rebuild frontend
```

## Testing Checklist

```
□ Send review → Clerk gets 📋 notification
□ Approve review → Admin gets ✅ notification
□ Reject review → Admin gets ❌ notification with reason
□ Click notification → Marks as read
□ Badge updates → Count decreases
□ Mark all as read → All marked as read
□ Refresh page → Notifications persist
□ No console errors → Check browser console
```

## File Structure

```
backend-api/
├─ src/
│  ├─ presentation/
│  │  ├─ controllers/
│  │  │  └─ NotificationController.js (NEW)
│  │  └─ routes/
│  │     └─ notificationRoutes.js (NEW)
│  └─ index.js (MODIFIED)
└─ create-notifications-table.sql (NEW)

frontend/
├─ src/
│  ├─ components/
│  │  ├─ NotificationBell.js (NEW)
│  │  └─ TopBar.js (MODIFIED)
│  ├─ api/
│  │  └─ services/
│  │     └─ notificationService.js (NEW)
│  └─ styles/
│     └─ NotificationBell.css (NEW)
```

## Quick Start

1. Run SQL script: `create-notifications-table.sql`
2. Restart backend: `npm start`
3. Rebuild frontend: `npm run build`
4. Test: Send review → Approve/Reject → Check notifications
5. Verify: Badge shows, dropdown displays, rejection reason included

## Success Indicators

✅ Bell icon visible in top navigation
✅ Badge shows unread count
✅ Dropdown opens on click
✅ Three notification types display correctly
✅ Icons show (📋 ✅ ❌)
✅ Colors are correct (blue/green/red)
✅ Rejection reason appears in message
✅ Mark as read works
✅ Notifications persist after refresh
✅ No console errors
