# Notification System - Visual Guide

## 🎨 UI Components

### 1. Notification Bell in Navbar
```
┌─────────────────────────────────────────────────────────────┐
│  🚚 Super Shine Cargo Service                               │
│  ─────────────────────────────                              │
│  Dashboard | Jobs | Petty Cash | Billing    🔔¹  👤 Admin  │
│                                               └─ Badge       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Notification Dropdown
```
                                    ┌──────────────────────────┐
                                    │ Notifications  Mark all  │
                                    ├──────────────────────────┤
                                    │ 💰 Petty Cash Assigned   │
                                    │ Petty cash of LKR 5,000  │
                                    │ has been assigned...     │
                                    │ 5 mins ago          •    │
                                    ├──────────────────────────┤
                                    │ 📋 Job Assigned          │
                                    │ You have been assigned   │
                                    │ to Job #JOB0042          │
                                    │ 1 hour ago               │
                                    ├──────────────────────────┤
                                    │ 🔄 Job Updated           │
                                    │ Job #JOB0041 status      │
                                    │ changed to Completed     │
                                    │ 2 hours ago              │
                                    ├──────────────────────────┤
                                    │   View all notifications │
                                    └──────────────────────────┘
```

### 3. Full Notifications Page
```
┌─────────────────────────────────────────────────────────────┐
│  Notifications                          Mark all as read    │
├─────────────────────────────────────────────────────────────┤
│  [ All ]  [ Unread (3) ]  [ Read ]                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 💰  Petty Cash Assigned                            •  │ │
│  │     Petty cash of LKR 5,000 has been assigned to you │ │
│  │     for Job #JOB0042                                  │ │
│  │     🕐 5 mins ago    PETTY CASH ASSIGNED              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📋  Job Assigned                                   •  │ │
│  │     You have been assigned to Job #JOB0042            │ │
│  │     🕐 1 hour ago    JOB ASSIGNED                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🔄  Job Updated                                       │ │
│  │     Job #JOB0041 status changed to Completed          │ │
│  │     🕐 2 hours ago    JOB UPDATED                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 User Flow Diagram

### Scenario: Petty Cash Assignment Notification

```
┌─────────────┐
│   Admin     │
│  (USER0006) │
└──────┬──────┘
       │
       │ 1. Assigns petty cash
       │    to Waff Clerk
       ▼
┌─────────────────────────┐
│   Backend Server        │
│                         │
│  CreatePettyCashAssignment
│         ↓               │
│  Create Notification    │
│  - Type: PETTY_CASH_ASSIGNED
│  - User: USER0003       │
│  - Amount: LKR 5,000    │
│  - Job: JOB0042         │
└──────────┬──────────────┘
           │
           │ 2. Saves to database
           ▼
┌─────────────────────────┐
│   Database              │
│                         │
│  Notifications Table    │
│  ┌──────────────────┐   │
│  │ NOTIF00003       │   │
│  │ USER0003         │   │
│  │ PETTY_CASH_...   │   │
│  │ isRead: false    │   │
│  └──────────────────┘   │
└──────────┬──────────────┘
           │
           │ 3. Frontend polls
           │    (every 30 seconds)
           ▼
┌─────────────────────────┐
│   Waff Clerk            │
│   (USER0003)            │
│                         │
│   Navbar                │
│   ┌──────────────────┐  │
│   │  🔔 ¹           │  │ ← 4. Badge appears
│   └──────────────────┘  │
└──────────┬──────────────┘
           │
           │ 5. Clicks bell
           ▼
┌─────────────────────────┐
│   Dropdown Opens        │
│                         │
│   💰 Petty Cash Assigned│
│   Petty cash of LKR     │
│   5,000 assigned...     │
│   5 mins ago        •   │
└──────────┬──────────────┘
           │
           │ 6. Clicks notification
           ▼
┌─────────────────────────┐
│   Actions               │
│                         │
│  1. Mark as read        │
│  2. Navigate to         │
│     /petty-cash         │
│  3. Pass state:         │
│     - assignmentId: 178 │
│     - jobId: JOB0042    │
└──────────┬──────────────┘
           │
           │ 7. Redirects
           ▼
┌─────────────────────────┐
│   Petty Cash Page       │
│                         │
│   Assignment #178       │
│   Job: JOB0042          │
│   Amount: LKR 5,000     │
│   ↑                     │
│   └─ Can highlight this │
└─────────────────────────┘
```

## 🎯 Notification Type Flow

### Job Assignment
```
Admin assigns job
       ↓
Backend creates notification
  Type: JOB_ASSIGNED
  Icon: 📋
       ↓
User clicks notification
       ↓
Redirects to: /jobs
  State: { highlightJobId, scrollToJob }
       ↓
Jobs page highlights the job
```

### Petty Cash Assignment
```
Admin assigns petty cash
       ↓
Backend creates notification
  Type: PETTY_CASH_ASSIGNED
  Icon: 💰
       ↓
User clicks notification
       ↓
Redirects to: /petty-cash
  State: { highlightAssignmentId, jobId }
       ↓
Petty Cash page highlights assignment
```

### Bill Generated
```
System generates bill
       ↓
Backend creates notification
  Type: BILL_GENERATED
  Icon: 📄
       ↓
User clicks notification
       ↓
Redirects to: /billing
  State: { highlightBillId, scrollToBill }
       ↓
Billing page highlights the bill
```

## 📊 State Management

### NotificationBell Component State
```javascript
{
  notifications: [
    {
      notificationId: "NOTIF00003",
      userId: "USER0003",
      type: "PETTY_CASH_ASSIGNED",
      title: "Petty Cash Assigned",
      message: "Petty cash of LKR 5,000...",
      isRead: false,
      createdDate: "2026-05-26T...",
      metadata: {
        assignmentId: 178,
        jobId: "JOB0042",
        assignedAmount: 5000
      }
    }
  ],
  unreadCount: 1,
  isOpen: false,
  loading: false
}
```

### Navigation State
```javascript
// When clicking notification
navigate('/petty-cash', {
  state: {
    highlightAssignmentId: 178,
    scrollToAssignment: true,
    jobId: "JOB0042"
  }
});

// Target page receives
const location = useLocation();
const { 
  highlightAssignmentId,  // 178
  scrollToAssignment,     // true
  jobId                   // "JOB0042"
} = location.state || {};
```

## 🎨 CSS Animation Flow

### Highlight Animation
```
Item appears normally
       ↓
User clicks notification
       ↓
Page navigates
       ↓
useEffect triggers
       ↓
Find element by ID
       ↓
Scroll to element (smooth)
       ↓
Add 'highlight-item' class
       ↓
Animation plays (3 seconds)
  0s:   Yellow background + shadow
  1.5s: Lighter yellow + larger shadow
  3s:   Transparent + no shadow
       ↓
Remove 'highlight-item' class
       ↓
Item returns to normal
```

## 🔄 Auto-Refresh Flow

```
Component mounts
       ↓
Fetch notifications
       ↓
Set interval (30 seconds)
       ↓
┌──────────────────┐
│  Wait 30 seconds │
└────────┬─────────┘
         │
         ▼
Fetch notifications again
         │
         ▼
Update state
  - notifications
  - unreadCount
         │
         ▼
UI updates automatically
  - Badge count
  - Dropdown list
         │
         ▼
┌──────────────────┐
│  Wait 30 seconds │ ← Loop continues
└────────┬─────────┘
         │
         ▼
       ...
```

## 📱 Responsive Behavior

### Desktop (>768px)
```
┌─────────────────────────────────────────────────┐
│  Navbar                                         │
│  Dashboard | Jobs | Petty Cash    🔔¹  👤 Admin│
│                                    ↓            │
│                          ┌──────────────────┐   │
│                          │ Notifications    │   │
│                          │ (380px wide)     │   │
│                          └──────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Tablet (480-768px)
```
┌──────────────────────────────────────┐
│  Navbar                              │
│  Dashboard | Jobs    🔔¹  👤 Admin   │
│                      ↓               │
│              ┌──────────────┐        │
│              │ Notifications│        │
│              │ (320px wide) │        │
│              └──────────────┘        │
└──────────────────────────────────────┘
```

### Mobile (<480px)
```
┌────────────────────────┐
│  Navbar                │
│  ☰  🔔¹  👤            │
│     ↓                  │
│  ┌──────────────────┐  │
│  │  Notifications   │  │
│  │  (Full width)    │  │
│  │                  │  │
│  └──────────────────┘  │
└────────────────────────┘
```

## 🎯 Click Interaction

### Before Click
```
┌────────────────────────────┐
│ 💰 Petty Cash Assigned  •  │ ← Unread dot
│ Petty cash of LKR 5,000    │
│ has been assigned...       │
│ 5 mins ago                 │
└────────────────────────────┘
  ↑
  Cursor hovers (background changes)
```

### During Click
```
┌────────────────────────────┐
│ 💰 Petty Cash Assigned  •  │
│ Petty cash of LKR 5,000    │ ← Click!
│ has been assigned...       │
│ 5 mins ago                 │
└────────────────────────────┘
  ↓
  1. API call: PATCH /api/notifications/NOTIF00003/read
  2. Navigate: /petty-cash with state
  3. Close dropdown
```

### After Click
```
┌────────────────────────────┐
│ 💰 Petty Cash Assigned     │ ← No dot (read)
│ Petty cash of LKR 5,000    │
│ has been assigned...       │
│ 5 mins ago                 │
└────────────────────────────┘
  ↓
  User is now on Petty Cash page
  Assignment #178 is highlighted
```

## 🔔 Badge States

### No Notifications
```
🔔  (no badge)
```

### 1-9 Unread
```
🔔¹  🔔²  🔔³  ... 🔔⁹
```

### 10-99 Unread
```
🔔¹⁰  🔔²⁵  🔔⁹⁹
```

### 100+ Unread
```
🔔⁹⁹⁺
```

## 🎨 Color Scheme

### Unread Notification
- Background: `#eff6ff` (light blue)
- Hover: `#dbeafe` (lighter blue)
- Dot: `#2563eb` (blue)
- Icon background: `#dbeafe` (light blue)

### Read Notification
- Background: `white`
- Hover: `#f9fafb` (light gray)
- No dot
- Icon background: `#f3f4f6` (gray)

### Badge
- Background: `#ff4444` (red)
- Text: `white`
- Shadow: `0 2px 4px rgba(0,0,0,0.2)`

### Highlight Animation
- Start: `#fef3c7` (yellow)
- Mid: `#fde68a` (lighter yellow)
- End: `transparent`

## 📐 Layout Dimensions

### NotificationBell
- Bell icon: `24px`
- Badge: `18px` min-width, `11px` font
- Dropdown: `380px` width, `500px` max-height

### Notification Item
- Padding: `16px 20px`
- Icon: `32px × 32px`
- Title: `14px` font, `600` weight
- Message: `13px` font, 2 lines max
- Time: `12px` font

### Notifications Page
- Max width: `1200px`
- Card padding: `20px`
- Card icon: `48px × 48px`
- Card title: `16px` font

---

**This visual guide helps understand the notification system at a glance!**
