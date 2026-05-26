# Petty Cash Notification Implementation

## Overview
Implemented automatic notifications when petty cash is assigned to users. Users will now receive notifications when:
1. Petty cash is assigned to them for a job
2. Additional petty cash (sub-assignment) is assigned to them

## Changes Made

### 1. Updated Use Cases

#### CreatePettyCashAssignment.js
**Location:** `src/application/use-cases/pettycashassignment/CreatePettyCashAssignment.js`

**Changes:**
- Added `createNotification` parameter to constructor
- Added notification creation logic after petty cash assignment
- Notification includes:
  - Title: "Petty Cash Assigned"
  - Message: "Petty cash of LKR [amount] has been assigned to you for Job #[jobId]"
  - Type: `PETTY_CASH_ASSIGNED`
  - Related ID: Assignment ID
  - Related Type: `PETTY_CASH_ASSIGNMENT`
  - Metadata: Assignment details (amount, job, notes, etc.)

#### CreateSubAssignment.js
**Location:** `src/application/use-cases/pettycashassignment/CreateSubAssignment.js`

**Changes:**
- Added `createNotification` parameter to constructor
- Added notification creation logic after sub-assignment creation
- Notification includes:
  - Title: "Additional Petty Cash Assigned"
  - Message: "Additional petty cash of LKR [amount] has been assigned to you for Job #[jobId]"
  - Type: `PETTY_CASH_ASSIGNED`
  - Related ID: Sub-assignment ID
  - Related Type: `PETTY_CASH_ASSIGNMENT`
  - Metadata: Sub-assignment details (includes parent assignment ID)

### 2. Updated Dependency Injection

#### container.js
**Location:** `src/infrastructure/di/container.js`

**Changes:**
- Updated `createPettyCashAssignment` initialization to inject `createNotification`
- Updated `createSubAssignment` initialization to inject `createNotification`

```javascript
// Before:
this.dependencies.createPettyCashAssignment = new CreatePettyCashAssignment(
  pettyCashAssignmentRepository, 
  billRepository, 
  jobRepository
);

// After:
this.dependencies.createPettyCashAssignment = new CreatePettyCashAssignment(
  pettyCashAssignmentRepository, 
  billRepository, 
  jobRepository, 
  createNotification
);
```

## Notification Details

### Notification Type
- **Type:** `PETTY_CASH_ASSIGNED`
- **Category:** Petty Cash Management

### Notification Content

#### Main Assignment
```javascript
{
  userId: "USER0002",
  type: "PETTY_CASH_ASSIGNED",
  title: "Petty Cash Assigned",
  message: "Petty cash of LKR 5,000 has been assigned to you for Job #JOB0001",
  relatedId: "ASSIGN0001",
  relatedType: "PETTY_CASH_ASSIGNMENT",
  metadata: {
    assignmentId: "ASSIGN0001",
    jobId: "JOB0001",
    assignedAmount: 5000,
    assignedBy: "ADMIN",
    notes: "For transportation and customs clearance"
  },
  createdBy: "ADMIN"
}
```

#### Sub-Assignment (Additional Petty Cash)
```javascript
{
  userId: "USER0002",
  type: "PETTY_CASH_ASSIGNED",
  title: "Additional Petty Cash Assigned",
  message: "Additional petty cash of LKR 2,000 has been assigned to you for Job #JOB0001",
  relatedId: "ASSIGN0002",
  relatedType: "PETTY_CASH_ASSIGNMENT",
  metadata: {
    assignmentId: "ASSIGN0002",
    parentAssignmentId: "ASSIGN0001",
    jobId: "JOB0001",
    assignedAmount: 2000,
    assignedBy: "ADMIN",
    notes: "Additional funds for unexpected expenses",
    isSubAssignment: true
  },
  createdBy: "ADMIN"
}
```

## Testing

### Automated Test
Run the test script to verify the implementation:
```bash
cd backend-api
node test-petty-cash-notification.js
```

**Expected Output:**
```
✅ PETTY CASH NOTIFICATION TEST COMPLETE

Summary:
  ✅ createPettyCashAssignment has notification support
  ✅ createSubAssignment has notification support
  ✅ Notifications can be created for petty cash assignments
  ✅ Notifications are saved to database
  ✅ Unread count is working
```

### Manual Testing

#### Test Main Assignment
1. **Restart backend server** (if running)
2. **Login as Admin or Manager**
3. **Go to Petty Cash section**
4. **Create a petty cash assignment:**
   - Select a job
   - Select a user (e.g., waff clerk 01)
   - Enter amount (e.g., 5000)
   - Add notes (optional)
   - Click "Assign"
5. **Logout and login as the assigned user**
6. **Check the notification bell:**
   - Should show a red badge with count
   - Click bell to see notification
   - Message: "Petty cash of LKR 5,000 has been assigned to you for Job #[JOB_ID]"

#### Test Sub-Assignment
1. **Login as Admin or Manager**
2. **Go to Petty Cash section**
3. **Find an existing assignment**
4. **Create a sub-assignment (additional petty cash):**
   - Click "Add More" or similar button
   - Enter additional amount
   - Add notes (optional)
   - Click "Assign"
5. **Logout and login as the assigned user**
6. **Check the notification bell:**
   - Should show updated count
   - New notification: "Additional petty cash of LKR [amount] has been assigned to you for Job #[JOB_ID]"

## Error Handling

The implementation includes robust error handling:

1. **Notification creation failures don't affect petty cash assignment**
   - If notification creation fails, the petty cash assignment still succeeds
   - Error is logged to console for debugging
   - User experience is not disrupted

2. **Logging for debugging**
   - All notification operations are logged with `[NOTIFICATION]` prefix
   - Success and failure messages are clearly indicated
   - Full error stack traces are logged for troubleshooting

3. **Graceful degradation**
   - If `createNotification` is not available, a warning is logged
   - System continues to function without notifications

## Console Logs

When a petty cash assignment is created, you'll see logs like:

```
[NOTIFICATION] Creating PETTY_CASH_ASSIGNED notification for user USER0002
[NOTIFICATION] Notification data: {"userId":"USER0002","type":"PETTY_CASH_ASSIGNED",...}
[CreateNotification] Creating notification for user USER0002, type: PETTY_CASH_ASSIGNED
[CreateNotification] Generated notification ID: NOTIF00003
[CreateNotification] Persisting notification to database
[CreateNotification] Notification created successfully: {...}
[NOTIFICATION] Successfully created notification for user USER0002, result: {...}
```

## Database Impact

### Notifications Table
New records will be created in the `Notifications` table with:
- `type` = 'PETTY_CASH_ASSIGNED'
- `relatedType` = 'PETTY_CASH_ASSIGNMENT'
- `relatedId` = Assignment ID

### Query Example
```sql
-- View all petty cash notifications
SELECT * FROM Notifications 
WHERE type = 'PETTY_CASH_ASSIGNED' 
ORDER BY createdDate DESC;

-- View unread petty cash notifications for a user
SELECT * FROM Notifications 
WHERE userId = 'USER0002' 
  AND type = 'PETTY_CASH_ASSIGNED' 
  AND isRead = 0
ORDER BY createdDate DESC;
```

## Integration with Existing System

### Job Assignment Notifications
The system now supports two types of notifications:
1. **JOB_ASSIGNED** - When a user is assigned to a job
2. **PETTY_CASH_ASSIGNED** - When petty cash is assigned to a user

Both notification types:
- Use the same notification infrastructure
- Appear in the same notification dropdown
- Support read/unread status
- Include metadata for context
- Are linked to related entities

### Notification Bell
The notification bell in the top navigation bar will show:
- Combined count of all unread notifications (jobs + petty cash)
- All notifications in chronological order
- Visual distinction between notification types
- Click to mark as read functionality

## Future Enhancements

Potential improvements for the future:
1. **Settlement notifications** - Notify when petty cash settlement is approved/rejected
2. **Reminder notifications** - Remind users about pending settlements
3. **Expiry notifications** - Notify about petty cash assignments nearing deadline
4. **Bulk notifications** - Notify multiple users at once
5. **Email notifications** - Send email in addition to in-app notifications
6. **Push notifications** - Browser push notifications for real-time updates

## Troubleshooting

### Notifications not appearing?

1. **Check backend server logs**
   ```bash
   # Look for [NOTIFICATION] logs in the console
   ```

2. **Verify notification was created**
   ```bash
   cd backend-api
   node show-notifications.js USER0002
   ```

3. **Check database directly**
   ```sql
   SELECT * FROM Notifications 
   WHERE userId = 'USER0002' 
     AND type = 'PETTY_CASH_ASSIGNED'
   ORDER BY createdDate DESC;
   ```

4. **Run the test script**
   ```bash
   cd backend-api
   node test-petty-cash-notification.js
   ```

### Backend server errors?

Check for these common issues:
- Missing `createNotification` dependency in container
- Database connection issues
- Missing columns in Notifications table (run `fix-notifications-table.js`)

## Files Modified

1. ✅ `src/application/use-cases/pettycashassignment/CreatePettyCashAssignment.js`
2. ✅ `src/application/use-cases/pettycashassignment/CreateSubAssignment.js`
3. ✅ `src/infrastructure/di/container.js`

## Files Created

1. ✅ `test-petty-cash-notification.js` - Test script
2. ✅ `PETTY_CASH_NOTIFICATION_IMPLEMENTATION.md` - This documentation

## Status

✅ **IMPLEMENTED AND TESTED**

All checks passed:
- ✅ CreatePettyCashAssignment has notification support
- ✅ CreateSubAssignment has notification support
- ✅ Notifications are created successfully
- ✅ Notifications are saved to database
- ✅ Unread count is working correctly
- ✅ Error handling is in place
- ✅ Logging is comprehensive

---

**Implementation Date:** May 24, 2026  
**Implemented By:** Kiro AI Assistant  
**Status:** ✅ COMPLETE AND TESTED  
**Tested With:** waff clerk 01 (USER0002)
