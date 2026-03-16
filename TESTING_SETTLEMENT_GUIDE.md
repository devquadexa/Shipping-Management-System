# Testing Settlement Flow - Quick Reference

## What Was Fixed

1. **View Details Button** - Now appears for settled assignments
2. **Multi-User Visibility** - Waff Clerk 02 can see items paid by Waff Clerk 01
3. **Invoicing Integration** - Management can see all settlement items

## How to Test

### Step 1: Create Test Data
```sql
-- Run this in SQL Server Management Studio
USE SuperShineCargoDb;

-- Create a new job
INSERT INTO Jobs (jobId, customerId, shipmentCategory, status, pettyCashStatus, openDate)
VALUES ('JOB0007', 'CUST001', 'TIEP', 'Open', 'Assigned', GETDATE());

-- Assign to Waff Clerk 01 and 02
INSERT INTO JobAssignments (jobId, userId, assignedDate)
VALUES ('JOB0007', 'WC001', GETDATE());

INSERT INTO JobAssignments (jobId, userId, assignedDate)
VALUES ('JOB0007', 'WC002', GETDATE());

-- Assign petty cash
INSERT INTO PettyCashAssignments (jobId, assignedTo, assignedAmount, status, assignedDate, assignedBy)
VALUES ('JOB0007', 'WC001', 30000, 'Assigned', GETDATE(), 'ADMIN001');

INSERT INTO PettyCashAssignments (jobId, assignedTo, assignedAmount, status, assignedDate, assignedBy)
VALUES ('JOB0007', 'WC002', 20000, 'Assigned', GETDATE(), 'ADMIN001');
```

### Step 2: Test Waff Clerk 01 Settlement
1. Login as Waff Clerk 01
2. Go to Petty Cash Management
3. Find assignment for JOB0007
4. Click "Settle" button
5. Fill in settlement items (e.g., items 1, 3, 4, 5)
6. Click "Settle Petty Cash"
7. **Expected**: 
   - Settlement succeeds
   - Assignment status changes to "Settled"
   - "View Details" button appears

### Step 3: Check Backend Logs
Look for these log messages in the backend console:
```
=== CONTROLLER SETTLE START ===
controller settle - id: [assignmentId]
controller settle - settlementData: [data]
=== SETTLE START ===
settle - transaction begun
settle - inserting item: [item]
settle - item inserted, rowsAffected: 1
settle - calculated totals: [totals]
settle - assignment updated, rowsAffected: 1
settle - transaction committed
settle - returning updated assignment: [assignment with status: 'Settled']
=== SETTLE END ===
=== CONTROLLER SETTLE END ===
```

### Step 4: Test Waff Clerk 02 Settlement
1. Login as Waff Clerk 02
2. Go to Petty Cash Management
3. Find assignment for JOB0007
4. Click "Settle" button
5. **Expected**:
   - Items 1, 3, 4, 5 show as read-only with "Paid by Waff Clerk 01"
   - Can fill in items 2, 6, 7, 8, 9, 10
   - Cannot edit items already paid by Waff Clerk 01
6. Fill in remaining items and settle
7. **Expected**:
   - Settlement succeeds
   - Assignment status changes to "Settled"
   - Job status changes to "Settled" (all assignments settled)

### Step 5: Test Invoicing
1. Login as Admin/Manager
2. Go to Invoicing
3. Select JOB0007
4. **Expected**:
   - System detects pettyCashStatus = "Settled"
   - Auto-loads all settlement items from both Waff Clerks
   - Shows complete cost breakdown
   - Can generate invoice with accurate costs

### Step 6: Verify Database
```sql
-- Check assignment status
SELECT assignmentId, jobId, assignedTo, status, actualSpent, settlementDate
FROM PettyCashAssignments
WHERE jobId = 'JOB0007';

-- Check settlement items
SELECT si.settlementItemId, si.assignmentId, si.itemName, si.actualCost, si.paidBy, u.fullName
FROM PettyCashSettlementItems si
LEFT JOIN Users u ON si.paidBy = u.userId
WHERE si.assignmentId IN (
  SELECT assignmentId FROM PettyCashAssignments WHERE jobId = 'JOB0007'
);

-- Check job status
SELECT jobId, pettyCashStatus FROM Jobs WHERE jobId = 'JOB0007';
```

## Debugging Tips

### If View Details Button Doesn't Appear
1. Check backend logs for settle() execution
2. Verify assignment status in database: `SELECT status FROM PettyCashAssignments WHERE assignmentId = [id]`
3. Check if transaction committed: Look for "transaction committed" in logs
4. Refresh browser and check again

### If Waff Clerk 02 Can't See Paid Items
1. Check backend logs for getByJob() execution
2. Verify settlement items exist in database for both assignments
3. Check if getByJob() is collecting items from all assignments
4. Look for "total settlement items:" in logs

### If Invoicing Doesn't Show Settlement Items
1. Check if job pettyCashStatus = "Settled"
2. Verify settlement items exist in database
3. Check browser console for API errors
4. Check backend logs for getByJob() execution
5. Verify auto-save of pay items is working

## Key Log Messages to Look For

| Message | Meaning |
|---------|---------|
| `settle - transaction begun` | Settlement process started |
| `settle - item inserted, rowsAffected: 1` | Settlement item saved |
| `settle - assignment updated, rowsAffected: 1` | Assignment status updated |
| `settle - transaction committed` | Changes saved to database |
| `settle - returning updated assignment: [status: 'Settled']` | Settlement complete |
| `MSSQLPettyCashAssignmentRepository.getByJob - total settlement items: X` | All items loaded for job |

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| View button doesn't appear | Check backend logs, verify transaction committed |
| Can't see other clerk's items | Verify getByJob() is collecting all items |
| Invoicing shows no items | Check if job pettyCashStatus = "Settled" |
| Settlement fails | Check validation errors in response |
| Items show as editable when should be read-only | Check frontend logic for alreadyPaid flag |

## Performance Notes

- Settlement items are loaded from database each time
- For jobs with many items, consider pagination in future
- Logging is verbose for debugging - can be reduced in production
