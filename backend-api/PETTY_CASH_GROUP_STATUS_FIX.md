# Petty Cash Assignment Group Status Fix

## Problem Description

When viewing grouped petty cash assignments, the status was showing incorrectly. For example:

**Assignment Group (JOB0001_USER0003):**
- Assignment 115: Assigned 10,000, Spent 0
- Assignment 117: Assigned 5,000, Spent 13,000

**Expected Group Totals:**
- Total Assigned: 15,000
- Total Spent: 13,000
- Total Balance: 2,000
- Status: "Balance To Be Return"

**Actual (Before Fix):**
- Total Balance: 10,000 (incorrect - was summing individual balances)
- Total Over: 8,000 (incorrect - was summing individual overs)
- Status: "Over Due" (incorrect)

## Root Cause

The grouped assignment use cases were calculating `totalBalance` and `totalOver` by SUMMING the individual assignment's `balanceAmount` and `overAmount` fields, rather than calculating them from the group totals.

This caused incorrect results when one assignment in a group had a balance and another had an overdue amount.

## Files Fixed

### 1. GetGroupedAssignments.js (Backend)
**Location:** `backend-api/src/application/use-cases/pettycashassignment/GetGroupedAssignments.js`

**Changes:**
- Removed summing of individual `balanceAmount` and `overAmount`
- Added calculation of group balance/over from group totals after all assignments are processed
- Updated status detection to include "Balance To Be Return" and "Over Due" as settled states
- Added proper group status determination based on group totals

### 2. GetAggregatedAssignments.js (Backend)
**Location:** `backend-api/src/application/use-cases/pettycashassignment/GetAggregatedAssignments.js`

**Changes:**
- Removed summing of individual `balanceAmount` and `overAmount`
- Added calculation of group balance/over from group totals after all assignments are processed
- Updated status detection to include "Balance To Be Return" and "Over Due" as settled states
- Added proper group status determination based on group totals

### 3. MSSQLPettyCashAssignmentRepository.js (Backend)
**Location:** `backend-api/src/infrastructure/repositories/MSSQLPettyCashAssignmentRepository.js`

**Changes:**
- Updated `recalculateAssignmentTotals` method to also update the status field
- Status is now automatically determined based on balance/over amounts:
  - If `balanceAmount > 0`: Status = "Balance To Be Return"
  - If `overAmount > 0`: Status = "Over Due"
  - Otherwise: Status = "Settled"

### 4. PettyCash.js (Frontend)
**Location:** `frontend/src/components/PettyCash.js`

**Changes:**
- Fixed group status calculation to use group totals instead of picking highest-priority individual status
- Group status is now determined by:
  - If any assignment is "Assigned": Group Status = "Assigned"
  - If `totalBalance > 0`: Group Status = "Balance To Be Return"
  - If `totalOver > 0`: Group Status = "Over Due"
  - Otherwise: Group Status = "Settled"

## How It Works Now

### Group Balance/Over Calculation
```javascript
// CORRECT: Calculate from group totals
group.totalBalance = Math.max(0, group.totalAssigned - group.totalSpent);
group.totalOver = Math.max(0, group.totalSpent - group.totalAssigned);

// INCORRECT (old way): Sum individual balances
// group.totalBalance += assignment.balanceAmount; // ❌ WRONG
```

### Group Status Determination
```javascript
if (group.hasUnsettled) {
  group.groupStatus = 'Assigned';
} else if (group.totalBalance > 0) {
  group.groupStatus = 'Balance To Be Return';
} else if (group.totalOver > 0) {
  group.groupStatus = 'Over Due';
} else {
  group.groupStatus = 'Settled';
}
```

## Testing

Run the utility script to verify any assignment:
```bash
node recalculate-assignment-status.js [assignmentId]
```

Or fix all assignments:
```bash
node recalculate-assignment-status.js
```

## API Endpoint

There's also an API endpoint to recalculate status (requires Admin/Manager auth):
```
PATCH /api/petty-cash-assignments/:id/recalculate-status
```

## Verification

After the fix, Assignment Group 122 (and 117) now correctly shows:
- Assignment 121: Assigned 10,000, Spent 0
- Assignment 122: Assigned 10,000, Spent 16,000
- Total Assigned: 20,000 ✅
- Total Spent: 16,000 ✅
- Total Balance: 4,000 ✅
- Total Over: 0 ✅
- Group Status: "Balance To Be Return" ✅

## Impact

This fix affects:
- Grouped assignment views in the frontend (PettyCash.js)
- Grouped assignment API endpoints (GetGroupedAssignments, GetAggregatedAssignments)
- PettyCashGrouped component (uses API data directly)
- Any reports or calculations based on grouped petty cash assignments
- Settlement workflows that depend on group status

## Notes

- Individual assignments still maintain their own status for tracking purposes
- The group status is calculated dynamically based on the sum of all assignments in the group
- When settlement items are edited/deleted, the individual assignment status is automatically recalculated
- The group status is recalculated whenever the grouped assignments are fetched
