# Settlement Button Hiding Fix

## Problem Description

After a Waff Clerk sends a settlement request (Return Balance or Collect Overdue), the "Return Balance" and "Collect Overdue" buttons were still visible and clickable. This allowed users to create duplicate settlement requests for the same assignment.

## Expected Behavior

When a Waff Clerk clicks "Return Balance" or "Collect Overdue" and submits the settlement request:
1. The assignment status should change to indicate a pending approval
2. The buttons should be hidden until the request is processed
3. After approval/rejection, the buttons should remain hidden (or show based on new status)

## Solution

### Status Flow

1. **Initial State**: Assignment has status `'Balance To Be Return'` or `'Over Due'`
   - Buttons: ✅ Visible

2. **After Settlement Request Created**: Status changes to:
   - `'Pending Approval / Balance'` (for balance return requests)
   - `'Pending Approval / Over Due'` (for overdue collection requests)
   - Buttons: ❌ Hidden

3. **After Management Approval**: Status changes to:
   - `'Settled / Balance Returned'` (for approved balance returns)
   - `'Settled / Over Due Collected'` (for approved overdue collections)
   - Buttons: ❌ Hidden (already processed)

4. **After Management Rejection**: Status changes to:
   - `'Settled/Rejected'`
   - Buttons: ✅ Visible (clerk can resubmit with corrections)

## Files Modified

### Backend

#### 1. GetGroupedAssignments.js
**Location:** `backend-api/src/application/use-cases/pettycashassignment/GetGroupedAssignments.js`

**Changes:**
- Added check for pending approval statuses when determining group status
- If any assignment has `'Pending Approval / Balance'`, `'Pending Approval / Over Due'`, or `'Pending Approval'` status, the group status reflects this
- Updated `allSettled` check to include pending approval statuses as "settled" states

**Logic:**
```javascript
// Check if any assignment has a pending approval status
const hasPendingApproval = group.assignments.some(a => 
  a.status === 'Pending Approval / Balance' || 
  a.status === 'Pending Approval / Over Due' ||
  a.status === 'Pending Approval'
);

if (hasPendingApproval) {
  // Return the specific pending approval status
  group.groupStatus = pendingAssignment.status;
}
```

#### 2. GetAggregatedAssignments.js
**Location:** `backend-api/src/application/use-cases/pettycashassignment/GetAggregatedAssignments.js`

**Changes:**
- Same logic as GetGroupedAssignments
- Ensures aggregated views also reflect pending approval status

#### 3. CreateCashBalanceSettlement.js (Already Correct)
**Location:** `backend-api/src/application/use-cases/cashbalancesettlement/CreateCashBalanceSettlement.js`

**Existing Logic:**
- When settlement request is created, updates assignment status to:
  - `'Pending Approval / Balance'` for BALANCE_RETURN
  - `'Pending Approval / Over Due'` for OVERDUE_COLLECTION

### Frontend

#### 4. PettyCash.js
**Location:** `frontend/src/components/PettyCash.js`

**Changes:**

**a) Group Status Calculation (Lines ~1778-1795):**
```javascript
const groupStatus = isMulti
  ? (() => {
      if (anyAssigned) return 'Assigned';
      // Check if any assignment has a pending approval status
      const hasPendingApproval = groupAssignments.some(a => 
        a.status === 'Pending Approval / Balance' || 
        a.status === 'Pending Approval / Over Due' ||
        a.status === 'Pending Approval'
      );
      if (hasPendingApproval) {
        // Return the specific pending approval status
        return pendingAssignment.status;
      }
      // Determine status based on group totals
      if (totalBalance > 0) return 'Balance To Be Return';
      if (totalOver > 0) return 'Over Due';
      return 'Settled';
    })()
  : groupAssignments[0].status;
```

**b) Button Visibility Logic (Lines ~1791-1801):**
```javascript
const canReturnBalance = !anyAssigned && user?.role === 'Waff Clerk'
  && (groupStatus === 'Settled' || groupStatus === 'Balance To Be Return' || groupStatus === 'Settled/Rejected')
  && groupStatus !== 'Pending Approval / Balance'
  && groupStatus !== 'Pending Approval / Over Due'
  && groupStatus !== 'Pending Approval'
  && (isMulti ? totalBalance > 0 : first.balanceAmount > 0);

const canCollectOverdue = !anyAssigned && user?.role === 'Waff Clerk'
  && (groupStatus === 'Settled' || groupStatus === 'Over Due' || groupStatus === 'Settled/Rejected')
  && groupStatus !== 'Pending Approval / Balance'
  && groupStatus !== 'Pending Approval / Over Due'
  && groupStatus !== 'Pending Approval'
  && (isMulti ? totalOver > 0 : first.overAmount > 0);
```

**c) Removed Pending Approval Badge (Lines ~1881-1889):**
- Removed the "Pending Approval" badge that was showing in the Actions column
- When status is pending approval, no badge or button is shown in Actions
- This provides cleaner UI and avoids confusion

## Button Visibility Matrix

| Assignment Status | Return Balance Button | Collect Overdue Button |
|-------------------|----------------------|------------------------|
| Assigned | ❌ Hidden | ❌ Hidden |
| Settled | ✅ Visible (if balance > 0) | ✅ Visible (if over > 0) |
| Balance To Be Return | ✅ Visible | ❌ Hidden |
| Over Due | ❌ Hidden | ✅ Visible |
| Pending Approval / Balance | ❌ Hidden | ❌ Hidden |
| Pending Approval / Over Due | ❌ Hidden | ❌ Hidden |
| Pending Approval | ❌ Hidden | ❌ Hidden |
| Settled / Balance Returned | ❌ Hidden | ❌ Hidden |
| Settled / Over Due Collected | ❌ Hidden | ❌ Hidden |
| Settled/Rejected | ✅ Visible (if balance > 0) | ✅ Visible (if over > 0) |
| Settled/Approved | ❌ Hidden | ❌ Hidden |
| Closed | ❌ Hidden | ❌ Hidden |

## Testing

Run the test script to verify button visibility logic:
```bash
node test-settlement-button-logic.js
```

Expected output: All 12 tests should pass ✅

## User Flow Example

### Scenario: Waff Clerk Returns Balance

1. **Initial State**
   - Assignment 122: Assigned 10,000, Spent 6,000
   - Status: "Balance To Be Return"
   - Balance: 4,000
   - UI: "Return Balance" button is visible ✅

2. **Clerk Clicks "Return Balance"**
   - Modal opens with amount pre-filled (4,000)
   - Clerk adds notes and submits

3. **After Submission**
   - Settlement request created with status "PENDING"
   - Assignment status updated to "Pending Approval / Balance"
   - UI: "Return Balance" button is hidden ❌
   - UI: Actions column shows only the "View Details" eye icon
   - UI: Status badge shows "PENDING APPROVAL / BALANCE"

4. **Management Reviews**
   - Manager sees settlement request in Management Settlement page
   - Manager approves or rejects

5. **After Approval**
   - Settlement status: "APPROVED" → "COMPLETED"
   - Assignment status: "Settled / Balance Returned"
   - UI: Button remains hidden ❌ (already processed)

6. **After Rejection**
   - Settlement status: "REJECTED"
   - Assignment status: "Settled/Rejected"
   - UI: "Return Balance" button is visible again ✅ (clerk can resubmit)

## Impact

This fix prevents:
- Duplicate settlement requests
- Confusion about request status
- Unnecessary API calls

This fix ensures:
- Clear visual feedback about request status
- Proper workflow enforcement
- Better user experience for Waff Clerks
