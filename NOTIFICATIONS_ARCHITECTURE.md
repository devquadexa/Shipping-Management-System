# Notifications System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Navbar Component                                   │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │              NotificationBell Component                        │  │   │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │   │
│  │  │  │  🔔 Badge (unreadCount)                                 │ │  │   │
│  │  │  │  ┌────────────────────────────────────────────────────┐ │ │  │   │
│  │  │  │  │  Notification Dropdown                            │ │ │  │   │
│  │  │  │  │  ┌──────────────────────────────────────────────┐ │ │ │  │   │
│  │  │  │  │  │ Notification Item 1                          │ │ │ │  │   │
│  │  │  │  │  │ Title: "New Job Assigned"                    │ │ │ │  │   │
│  │  │  │  │  │ Message: "You have been assigned to Job..."  │ │ │ │  │   │
│  │  │  │  │  │ [✓ Mark as Read]                            │ │ │ │  │   │
│  │  │  │  │  └──────────────────────────────────────────────┘ │ │ │  │   │
│  │  │  │  │  ┌──────────────────────────────────────────────┐ │ │ │  │   │
│  │  │  │  │  │ Notification Item 2                          │ │ │ │  │   │
│  │  │  │  │  │ Title: "Petty Cash Assigned"                 │ │ │ │  │   │
│  │  │  │  │  │ Message: "Petty cash of LKR 5,000 assigned"  │ │ │ │  │   │
│  │  │  │  │  │ [✓ Mark as Read]                            │ │ │ │  │   │
│  │  │  │  │  └──────────────────────────────────────────────┘ │ │ │  │   │
│  │  │  │  │  [Mark All as Read]                              │ │ │  │   │
│  │  │  │  └────────────────────────────────────────────────────┘ │ │  │   │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              notificationService (API Client)                        │   │
│  │  • getNotifications()                                               │   │
│  │  • getUnreadNotifications()                                         │   │
│  │  • markAsRead()                                                     │   │
│  │  • markAllAsRead()                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTP
                            (Axios with JWT)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js/Express)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER                                │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │              NotificationController                           │ │   │
│  │  │  • create()                                                   │ │   │
│  │  │  • getMyNotifications()                                       │ │   │
│  │  │  • getMyUnreadNotifications()                                 │ │   │
│  │  │  • markAsRead()                                               │ │   │
│  │  │  • markAllAsRead()                                            │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │              Notification Routes                              │ │   │
│  │  │  GET    /api/notifications                                    │ │   │
│  │  │  GET    /api/notifications/unread                             │ │   │
│  │  │  PATCH  /api/notifications/:id/read                           │ │   │
│  │  │  PATCH  /api/notifications/mark-all-read                      │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   APPLICATION LAYER (Use Cases)                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  CreateNotification                                           │ │   │
│  │  │  • Validates notification data                                │ │   │
│  │  │  • Generates notification ID                                  │ │   │
│  │  │  • Calls repository to persist                                │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  GetUserNotifications                                         │ │   │
│  │  │  • Retrieves all notifications for user                       │ │   │
│  │  │  • Supports pagination                                        │ │   │
│  │  │  • Returns unread count                                       │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  GetUnreadNotifications                                       │ │   │
│  │  │  • Retrieves unread notifications only                        │ │   │
│  │  │  • Supports pagination                                        │ │   │
│  │  │  • Returns unread count                                       │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  MarkNotificationAsRead                                       │ │   │
│  │  │  • Marks single notification as read                          │ │   │
│  │  │  • Sets readDate timestamp                                    │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  MarkAllNotificationsAsRead                                   │ │   │
│  │  │  • Marks all notifications as read for user                   │ │   │
│  │  │  • Sets readDate for all                                      │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     DOMAIN LAYER (Entities)                          │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │              Notification Entity                              │ │   │
│  │  │  • notificationId                                             │ │   │
│  │  │  • userId                                                     │ │   │
│  │  │  • type (JOB_ASSIGNED, PETTY_CASH_ASSIGNED, etc.)            │ │   │
│  │  │  • title                                                      │ │   │
│  │  │  • message                                                    │ │   │
│  │  │  • relatedId (jobId, assignmentId)                            │ │   │
│  │  │  • relatedType (Job, PettyCashAssignment)                     │ │   │
│  │  │  • isRead                                                     │ │   │
│  │  │  • readDate                                                   │ │   │
│  │  │  • metadata (JSON)                                            │ │   │
│  │  │  • createdDate                                                │ │   │
│  │  │  • createdBy                                                  │ │   │
│  │  │                                                                │ │   │
│  │  │  Methods:                                                     │ │   │
│  │  │  • validate()                                                 │ │   │
│  │  │  • markAsRead()                                               │ │   │
│  │  │  • markAsUnread()                                             │ │   │
│  │  │  • getMetadata()                                              │ │   │
│  │  │  • toJSON()                                                   │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                  INFRASTRUCTURE LAYER (Repository)                   │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │        MSSQLNotificationRepository                            │ │   │
│  │  │  • create()                                                   │ │   │
│  │  │  • findById()                                                 │ │   │
│  │  │  • findByUserId()                                             │ │   │
│  │  │  • findUnreadByUserId()                                       │ │   │
│  │  │  • getUnreadCount()                                           │ │   │
│  │  │  • findByRelatedId()                                          │ │   │
│  │  │  • findByType()                                               │ │   │
│  │  │  • markAsRead()                                               │ │   │
│  │  │  • markAsUnread()                                             │ │   │
│  │  │  • markAllAsRead()                                            │ │   │
│  │  │  • delete()                                                   │ │   │
│  │  │  • deleteByUserId()                                           │ │   │
│  │  │  • deleteOldNotifications()                                   │ │   │
│  │  │  • mapToEntity()                                              │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ SQL
                            (Parameterized Queries)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQL Server / MSSQL)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Notifications Table                               │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  notificationId (PK)                                           │ │   │
│  │  │  userId (FK → Users)                                           │ │   │
│  │  │  type (VARCHAR)                                                │ │   │
│  │  │  title (NVARCHAR)                                              │ │   │
│  │  │  message (NVARCHAR)                                            │ │   │
│  │  │  relatedId (VARCHAR)                                           │ │   │
│  │  │  relatedType (VARCHAR)                                         │ │   │
│  │  │  isRead (BIT)                                                  │ │   │
│  │  │  readDate (DATETIME)                                           │ │   │
│  │  │  metadata (NVARCHAR - JSON)                                    │ │   │
│  │  │  createdDate (DATETIME)                                        │ │   │
│  │  │  createdBy (VARCHAR)                                           │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                      │   │
│  │  Indexes:                                                           │   │
│  │  • IX_Notifications_UserId                                         │   │
│  │  • IX_Notifications_IsRead                                         │   │
│  │  • IX_Notifications_UserId_IsRead                                  │   │
│  │  • IX_Notifications_CreatedDate                                    │   │
│  │  • IX_Notifications_Type                                           │   │
│  │  • IX_Notifications_RelatedId                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Job Assignment Notification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER ACTION                                          │
│                    Admin assigns job to user                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                                        │
│  Jobs.js → jobService.assignUser(jobId, userId)                             │
│  POST /api/jobs/:id/assign                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                                       │
│  JobController.assign() → AssignMultipleUsersToJob.execute()                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGER                                      │
│  for each userId in assignedUsers:                                          │
│    CreateNotification.execute({                                             │
│      userId: userId,                                                        │
│      type: 'JOB_ASSIGNED',                                                  │
│      title: 'New Job Assigned',                                             │
│      message: 'You have been assigned to Job {jobId}',                       │
│      relatedId: jobId,                                                      │
│      relatedType: 'Job',                                                    │
│      metadata: { jobId, blNumber, customerId, ... }                         │
│    })                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE INSERT                                           │
│  INSERT INTO Notifications (                                                │
│    notificationId, userId, type, title, message,                            │
│    relatedId, relatedType, isRead, metadata, createdDate, createdBy         │
│  ) VALUES (...)                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND POLLING                                          │
│  NotificationBell.js polls every 30 seconds:                                │
│  GET /api/notifications/unread                                              │
│  → Fetches unread notifications for current user                            │
│  → Updates unreadCount badge                                                │
│  → Displays notification in dropdown                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                                          │
│  User clicks notification → markAsRead()                                    │
│  PATCH /api/notifications/{notificationId}/read                             │
│  → Updates isRead = 1, readDate = NOW()                                     │
│  → Refreshes notification list                                              │
│  → Updates unreadCount badge                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Petty Cash Assignment Notification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER ACTION                                          │
│                  Admin assigns petty cash to user                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                                        │
│  PettyCash.js → pettyCashService.create(assignmentData)                     │
│  POST /api/petty-cash-assignments                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                                       │
│  PettyCashAssignmentController.create()                                     │
│  → CreatePettyCashAssignment.execute()                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TRIGGER                                      │
│  CreateNotification.execute({                                               │
│    userId: assignmentData.assignedTo,                                       │
│    type: 'PETTY_CASH_ASSIGNED',                                             │
│    title: 'Petty Cash Assigned',                                            │
│    message: 'Petty cash of LKR {amount} assigned for Job {jobId}',           │
│    relatedId: assignmentId,                                                 │
│    relatedType: 'PettyCashAssignment',                                      │
│    metadata: { assignmentId, jobId, assignedAmount, ... }                   │
│  })                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE INSERT                                           │
│  INSERT INTO Notifications (...)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WAFF CLERK SEES NOTIFICATION                              │
│  Notification appears in NotificationBell dropdown                          │
│  Waff Clerk can click to mark as read                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Dependency Injection Container

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DI Container (container.js)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Repositories:                                                               │
│  ├─ notificationRepository: MSSQLNotificationRepository                     │
│  │                                                                           │
│  Use Cases:                                                                  │
│  ├─ createNotification: CreateNotification(notificationRepository)          │
│  ├─ getUserNotifications: GetUserNotifications(notificationRepository)      │
│  ├─ getUnreadNotifications: GetUnreadNotifications(notificationRepository)  │
│  ├─ markNotificationAsRead: MarkNotificationAsRead(notificationRepository)  │
│  └─ markAllNotificationsAsRead: MarkAllNotificationsAsRead(...)             │
│                                                                               │
│  Controllers:                                                                │
│  └─ NotificationController(                                                 │
│       createNotification,                                                   │
│       getUserNotifications,                                                 │
│       getUnreadNotifications,                                               │
│       markNotificationAsRead,                                               │
│       markAllNotificationsAsRead                                            │
│     )                                                                        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Notification Types & Triggers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION TYPES                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  JOB_ASSIGNED                                                                │
│  ├─ Trigger: AssignMultipleUsersToJob.execute()                             │
│  ├─ Recipient: Assigned user                                                │
│  ├─ Message: "You have been assigned to Job {jobId}"                        │
│  └─ Related: Job entity                                                     │
│                                                                               │
│  PETTY_CASH_ASSIGNED                                                         │
│  ├─ Trigger: CreatePettyCashAssignment.execute()                            │
│  ├─ Recipient: Assigned user                                                │
│  ├─ Message: "Petty cash of LKR {amount} assigned for Job {jobId}"          │
│  └─ Related: PettyCashAssignment entity                                     │
│                                                                               │
│  JOB_UPDATED                                                                 │
│  ├─ Trigger: UpdateJobStatus.execute()                                      │
│  ├─ Recipient: All assigned users                                           │
│  ├─ Message: "Job {jobId} status updated to {newStatus}"                    │
│  └─ Related: Job entity                                                     │
│                                                                               │
│  PAYMENT_RECEIVED                                                            │
│  ├─ Trigger: MarkBillAsPaid.execute()                                       │
│  ├─ Recipient: Job creator / Admin                                          │
│  ├─ Message: "Payment of LKR {amount} received for Job {jobId}"             │
│  └─ Related: Bill entity                                                    │
│                                                                               │
│  BILL_GENERATED                                                              │
│  ├─ Trigger: CreateBill.execute()                                           │
│  ├─ Recipient: All assigned users                                           │
│  ├─ Message: "Bill generated for Job {jobId}"                               │
│  └─ Related: Bill entity                                                    │
│                                                                               │
│  SETTLEMENT_COMPLETED                                                        │
│  ├─ Trigger: SettlePettyCashAssignment.execute()                            │
│  ├─ Recipient: Assigned user                                                │
│  ├─ Message: "Petty cash settlement completed"                              │
│  └─ Related: PettyCashAssignment entity                                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Query Performance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUERY PERFORMANCE                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Query                              Index Used              Est. Time        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Get all notifications for user     IX_Notifications_UserId        < 50ms   │
│  Get unread notifications           IX_Notifications_UserId_IsRead < 30ms   │
│  Count unread                       IX_Notifications_UserId_IsRead < 10ms   │
│  Mark as read                       PK (notificationId)           < 20ms   │
│  Find by related ID                 IX_Notifications_RelatedId     < 40ms   │
│  Find by type                       IX_Notifications_Type          < 50ms   │
│  Delete old notifications           IX_Notifications_CreatedDate   < 100ms  │
│                                                                               │
│  Pagination (limit 50, offset 0)    IX_Notifications_UserId        < 100ms  │
│  Pagination (limit 50, offset 1000) IX_Notifications_UserId        < 150ms  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Architecture Pattern**: Clean Architecture with SOLID Principles
**Database**: Microsoft SQL Server (MSSQL)
**Frontend**: React with Axios
**Backend**: Node.js with Express
**Authentication**: JWT (JSON Web Tokens)
