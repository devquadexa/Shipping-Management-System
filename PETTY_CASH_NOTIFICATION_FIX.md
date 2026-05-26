# Petty Cash Assignment Notification Fix

## Issue
Petty cash assignments are not sending notifications to users when they are assigned petty cash.

## Root Cause
The backend server is running **old code** that doesn't include the notification feature. The code has been updated to include notification support, but the server needs to be restarted to load the new code.

## Evidence
1. ✅ **Code is correct**: The `CreatePettyCashAssignment` and `CreateSubAssignment` use cases have notification creation logic
2. ✅ **DI container is properly wired**: Both use cases receive the `createNotification` dependency
3. ✅ **Notification system works**: When tested directly (via simulation script), notifications are created successfully
4. ❌ **Recent assignments have no notifications**: Assignments 172-176 created on May 25-26, 2026 have no associated notifications
5. ✅ **Test notification works**: Manual notification creation succeeds

## Solution
**Restart the backend server** to load the updated code with notification support.

### Steps to Fix:

#### 1. Stop the Backend Server
Find the terminal/command prompt where the backend server is running and press `Ctrl+C` to stop it.

#### 2. Restart the Backend Server
```bash
cd "d:\Work and Learn\Quadexa\Shipping Management System\backend-api"
npm start
```

Wait for the message: `Server running on port 5000`

#### 3. Verify the Fix
After restarting, create a new petty cash assignment through the UI and verify:

**Option A: Check via UI**
- The assigned user should see a notification in their notification panel
- The notification should say "Petty cash of LKR X has been assigned to you for Job #JOBXXXX"

**Option B: Check via Database**
Run this SQL query:
```sql
SELECT TOP 5
    n.notificationId,
    n.userId,
    n.type,
    n.title,
    n.message,
    n.createdDate,
    n.isRead
FROM Notifications n
WHERE n.type = 'PETTY_CASH_ASSIGNED'
ORDER BY n.createdDate DESC
```

**Option C: Check via Debug Script**
```bash
cd "d:\Work and Learn\Quadexa\Shipping Management System\backend-api"
node debug-petty-cash-assignment.js
```

Look for the section "Step 3: Checking notifications for recent assignments" - it should show notifications for recent assignments.

## Technical Details

### Notification Flow
1. User creates petty cash assignment via UI
2. Frontend sends POST request to `/api/petty-cash-assignments`
3. `PettyCashAssignmentController.create()` is called
4. Controller resolves `createPettyCashAssignment` from DI container
5. `CreatePettyCashAssignment.execute()` is called
6. Assignment is created in database
7. **Notification is created** with type `PETTY_CASH_ASSIGNED`
8. Notification is stored in `Notifications` table
9. User can see notification in their notification panel

### Notification Data Structure
```javascript
{
  userId: 'USER0003',                    // Assigned user
  type: 'PETTY_CASH_ASSIGNED',
  title: 'Petty Cash Assigned',
  message: 'Petty cash of LKR 5,000 has been assigned to you for Job #JOB0042',
  relatedId: '178',                      // Assignment ID
  relatedType: 'PETTY_CASH_ASSIGNMENT',
  metadata: {
    assignmentId: 178,
    jobId: 'JOB0042',
    assignedAmount: 5000,
    assignedBy: 'USER0006',
    notes: 'For transportation costs'
  },
  createdBy: 'USER0006'                  // Admin who created the assignment
}
```

### Files Involved
- **Use Case**: `backend-api/src/application/use-cases/pettycashassignment/CreatePettyCashAssignment.js`
- **Sub-Assignment Use Case**: `backend-api/src/application/use-cases/pettycashassignment/CreateSubAssignment.js`
- **Notification Use Case**: `backend-api/src/application/use-cases/notification/CreateNotification.js`
- **DI Container**: `backend-api/src/infrastructure/di/container.js`
- **Controller**: `backend-api/src/presentation/controllers/PettyCashAssignmentController.js`
- **Repository**: `backend-api/src/infrastructure/repositories/MSSQLNotificationRepository.js`

### Database Table
```sql
-- Notifications table structure
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

## Testing Scripts Available

### 1. Debug Script
```bash
node debug-petty-cash-assignment.js
```
Checks container setup, recent assignments, and notifications.

### 2. Simulation Script
```bash
node simulate-petty-cash-assignment.js
```
Creates a test assignment and verifies notification creation (cleans up after).

### 3. Test Notification Script
```bash
node test-petty-cash-notification.js
```
Tests notification creation directly.

## Expected Behavior After Fix

### When Creating Main Assignment:
- ✅ Assignment is created in `PettyCashAssignments` table
- ✅ Job status changes from "Open" to "In Progress"
- ✅ Notification is created with type `PETTY_CASH_ASSIGNED`
- ✅ Notification appears in assigned user's notification panel
- ✅ Notification shows: "Petty cash of LKR X has been assigned to you for Job #JOBXXXX"

### When Creating Sub-Assignment:
- ✅ Sub-assignment is created under parent assignment
- ✅ Notification is created with type `PETTY_CASH_ASSIGNED`
- ✅ Notification title: "Additional Petty Cash Assigned"
- ✅ Notification shows: "Additional petty cash of LKR X has been assigned to you for Job #JOBXXXX"

## Troubleshooting

### If notifications still don't work after restart:

1. **Check server logs** for `[NOTIFICATION]` messages when creating assignment
2. **Verify database table exists**:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Notifications'
   ```
3. **Check for errors** in browser console (F12)
4. **Verify user exists** in Users table
5. **Run simulation script** to test directly

### Common Issues:

**Issue**: "createNotification is NOT available"
- **Cause**: DI container not properly initialized
- **Fix**: Restart server

**Issue**: "Foreign key constraint error"
- **Cause**: User ID doesn't exist in Users table
- **Fix**: Verify user exists before assigning

**Issue**: "Notification created but not visible in UI"
- **Cause**: Frontend not fetching notifications
- **Fix**: Check frontend notification component and API calls

## Status
- ✅ Code implementation: **COMPLETE**
- ✅ Database schema: **COMPLETE**
- ✅ DI container wiring: **COMPLETE**
- ✅ Testing scripts: **COMPLETE**
- ⚠️ Server restart: **REQUIRED**

## Next Steps
1. **Restart the backend server** (see Steps to Fix above)
2. **Test by creating a new petty cash assignment**
3. **Verify notification appears** for the assigned user
4. **Mark this issue as resolved** once verified

---

**Last Updated**: May 26, 2026
**Status**: Ready for server restart
