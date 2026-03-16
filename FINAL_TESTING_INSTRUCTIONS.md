# Final Testing Instructions

## Backend Status
✅ Running on port 5000
✅ Database connected
✅ All services initialized
✅ Comprehensive logging enabled

---

## Test 1: Job Creation

### Steps
1. Open browser and go to http://localhost:3000
2. Login as Admin/Manager
3. Go to Jobs page
4. Click "+ New Job" button
5. Fill in the form:
   - **Customer**: Select any customer (e.g., CUST001)
   - **Shipment Category**: Select TIEP
   - **Open Date**: Select today's date
   - **Assign To Users**: Select Waff Clerk 01 and Waff Clerk 02
6. Click "Create Job"

### Expected Result
- Job created successfully
- Job appears in the jobs list
- Backend logs show:
  ```
  === CREATE JOB START ===
  create - req.body: { customerId: '...', shipmentCategory: 'TIEP', ... }
  create - job created: { jobId: 'JOB0007', ... }
  === CREATE JOB END ===
  ```

### If Error
- Check backend logs for error message
- Refer to JOB_CREATION_DEBUG.md for solutions

---

## Test 2: Petty Cash Assignment

### Steps
1. Go to Petty Cash Management page
2. Click "+ Assign Petty Cash" button
3. Fill in the form:
   - **Select Job**: Select the job created in Test 1
   - **Assign To**: Select Waff Clerk 01
   - **Amount**: Enter 30000
4. Click "Assign Petty Cash"

### Expected Result
- Assignment created successfully
- Assignment appears in the list with status "Assigned"
- Backend logs show successful creation

### Repeat for Waff Clerk 02
1. Click "+ Assign Petty Cash" again
2. Select same job
3. Select Waff Clerk 02
4. Enter 20000
5. Click "Assign Petty Cash"

---

## Test 3: Waff Clerk 01 Settlement

### Steps
1. Login as Waff Clerk 01
2. Go to Petty Cash Management
3. Find the assignment for the job created in Test 1
4. Click "Settle" button
5. Fill in settlement items:
   - Item 1: 5000
   - Item 3: 6000
   - Item 4: 5000
   - Item 5: 7000
   - Total: 23000
6. Click "Settle Petty Cash"

### Expected Result
- Settlement succeeds
- Backend logs show:
  ```
  === SETTLE START ===
  settle - transaction begun
  settle - item inserted, rowsAffected: 1
  settle - calculated totals: { actualSpent: 23000, ... }
  settle - assignment updated, rowsAffected: 1
  settle - transaction committed
  settle - returning updated assignment: { status: 'Settled', ... }
  === SETTLE END ===
  ```
- Assignment status changes to "Settled"
- "View Details" button appears

### If View Details Button Doesn't Appear
1. Check backend logs for "transaction committed"
2. Refresh browser
3. Check database: `SELECT status FROM PettyCashAssignments WHERE assignmentId = [id]`
4. Refer to TESTING_SETTLEMENT_GUIDE.md for solutions

---

## Test 4: Waff Clerk 02 Settlement (Multi-User Visibility)

### Steps
1. Login as Waff Clerk 02
2. Go to Petty Cash Management
3. Find the assignment for the same job
4. Click "Settle" button

### Expected Result
- Settlement modal opens
- Items 1, 3, 4, 5 show as read-only with "Paid by Waff Clerk 01" badge
- Items 2, 6, 7, 8, 9, 10 are editable
- Backend logs show:
  ```
  MSSQLPettyCashAssignmentRepository.getByJob - total settlement items: 8
  ```

### Continue Settlement
1. Fill in remaining items:
   - Item 2: 4000
   - Item 6: 3000
   - Item 7: 2000
   - Item 8: 2000
   - Item 9: 2000
   - Item 10: 2000
   - Total: 17000
2. Click "Settle Petty Cash"

### Expected Result
- Settlement succeeds
- Assignment status changes to "Settled"
- Job status changes to "Settled" (all assignments settled)
- Backend logs show job status update

---

## Test 5: Invoicing Integration

### Steps
1. Login as Admin/Manager
2. Go to Invoicing page
3. Click "Select Job" dropdown
4. Select the job from Test 1

### Expected Result
- System detects pettyCashStatus = "Settled"
- All settlement items from both Waff Clerks appear
- Shows:
  - Items 1, 3, 4, 5 from Waff Clerk 01 (23000)
  - Items 2, 6, 7, 8, 9, 10 from Waff Clerk 02 (17000)
  - Total: 40000
- Backend logs show:
  ```
  MSSQLPettyCashAssignmentRepository.getByJob - total settlement items: 10
  ```

### Generate Invoice
1. Click "Generate Invoice" button
2. Verify invoice is created with correct amounts

### Expected Result
- Invoice created successfully
- Shows all settlement items with correct costs
- Profit calculation is accurate

---

## Test 6: View Details for Settled Assignment

### Steps
1. Login as Waff Clerk 01
2. Go to Petty Cash Management
3. Find the settled assignment
4. Click "View Details" button

### Expected Result
- Modal opens showing settlement details
- Shows all items paid by Waff Clerk 01
- Shows "Paid by Waff Clerk 01" for each item
- Shows total spent: 23000

---

## Verification Checklist

### Settlement Flow
- [ ] Waff Clerk 01 can settle items
- [ ] "View Details" button appears after settlement
- [ ] Backend logs show "transaction committed"
- [ ] Waff Clerk 02 sees items as read-only
- [ ] Waff Clerk 02 can settle remaining items
- [ ] Job status changes to "Settled"
- [ ] Management sees all items in Invoicing
- [ ] Invoice can be generated with correct amounts

### Job Creation
- [ ] Job created successfully
- [ ] Job appears in list
- [ ] Users assigned correctly
- [ ] Backend logs show success

### Database
- [ ] PettyCashAssignments.status = "Settled"
- [ ] PettyCashAssignments.actualSpent = correct amount
- [ ] PettyCashSettlementItems has all items with paidBy
- [ ] Jobs.pettyCashStatus = "Settled"
- [ ] PayItems table has entries for job

---

## Backend Logs to Monitor

### Settlement Success
```
=== SETTLE START ===
settle - transaction begun
settle - item inserted, rowsAffected: 1
settle - calculated totals: { actualSpent: 23000, assignedAmount: 30000, balanceAmount: 7000, overAmount: 0 }
settle - assignment updated, rowsAffected: 1
settle - transaction committed
settle - returning updated assignment: { status: 'Settled', actualSpent: 23000, ... }
=== SETTLE END ===
```

### Multi-User Items
```
MSSQLPettyCashAssignmentRepository.getByJob - jobId: JOB0007
MSSQLPettyCashAssignmentRepository.getByJob - result count: 2
MSSQLPettyCashAssignmentRepository.getByJob - assignment 18 items: [...]
MSSQLPettyCashAssignmentRepository.getByJob - assignment 19 items: [...]
MSSQLPettyCashAssignmentRepository.getByJob - total settlement items: 10
```

### Job Creation Success
```
=== CREATE JOB START ===
create - req.body: { customerId: 'CUST001', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
create - req.user: { userId: 'ADMIN001', role: 'Admin', ... }
create - jobData: { customerId: 'CUST001', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
create - job created: { jobId: 'JOB0007', customerId: 'CUST001', ... }
=== CREATE JOB END ===
```

---

## Troubleshooting

### View Details Button Doesn't Appear
1. Check backend logs for "transaction committed"
2. Verify database: `SELECT status FROM PettyCashAssignments WHERE assignmentId = [id]`
3. Refresh browser
4. Check if assignment status is actually "Settled" in database

### Can't See Other Clerk's Items
1. Check backend logs for "total settlement items:"
2. Verify settlement items exist in database for both assignments
3. Check if getByJob() is collecting items from all assignments

### Invoicing Shows No Items
1. Check if job pettyCashStatus = "Settled"
2. Verify settlement items exist in database
3. Check browser console for API errors
4. Check backend logs for getByJob() execution

### Job Creation Fails
1. Check backend logs for error message
2. Verify all required fields are filled
3. Verify customer exists in database
4. Check database connection

---

## Database Verification Queries

```sql
-- Check settlement status
SELECT assignmentId, jobId, assignedTo, status, actualSpent, settlementDate
FROM PettyCashAssignments
WHERE jobId = 'JOB0007'
ORDER BY assignmentId;

-- Check settlement items
SELECT si.settlementItemId, si.assignmentId, si.itemName, si.actualCost, si.paidBy, u.fullName
FROM PettyCashSettlementItems si
LEFT JOIN Users u ON si.paidBy = u.userId
WHERE si.assignmentId IN (
  SELECT assignmentId FROM PettyCashAssignments WHERE jobId = 'JOB0007'
)
ORDER BY si.assignmentId, si.settlementItemId;

-- Check job status
SELECT jobId, customerId, shipmentCategory, status, pettyCashStatus
FROM Jobs
WHERE jobId = 'JOB0007';

-- Check pay items
SELECT payItemId, jobId, description, actualCost, billingAmount
FROM PayItems
WHERE jobId = 'JOB0007'
ORDER BY addedDate;

-- Check job assignments
SELECT ja.jobId, ja.userId, u.fullName
FROM JobAssignments ja
LEFT JOIN Users u ON ja.userId = u.userId
WHERE ja.jobId = 'JOB0007'
ORDER BY ja.userId;
```

---

## Success Criteria

All tests pass when:
1. ✅ Jobs can be created with multiple user assignments
2. ✅ Petty cash can be assigned to jobs
3. ✅ Waff Clerk 01 can settle items
4. ✅ "View Details" button appears after settlement
5. ✅ Waff Clerk 02 sees items as read-only
6. ✅ Waff Clerk 02 can settle remaining items
7. ✅ Job status changes to "Settled"
8. ✅ Management sees all items in Invoicing
9. ✅ Invoice can be generated with correct amounts
10. ✅ Database shows correct data

---

## Support

If you encounter issues:
1. Check the relevant documentation file
2. Review backend logs
3. Run database verification queries
4. Refer to troubleshooting section
5. Check COMPLETE_WORK_SUMMARY.md for overview

---

**Ready for Testing!**

Backend is running and all logging is enabled. Follow these steps to verify all fixes are working correctly.
