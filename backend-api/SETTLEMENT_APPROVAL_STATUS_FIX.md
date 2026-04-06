# Settlement Approval Status Implementation

## Requirement

After a manager approves a settlement request, the assignment status should be set based on the settlement type:
- **BALANCE_RETURN** → Status: `'Settled / Balance Returned'`
- **OVERDUE_COLLECTION** → Status: `'Settled / Over Due Collected'`

This provides clear indication of what type of settlement was approved.

## Solution

### Status Flow After Approval

**Balance Return Flow:**
1. Clerk sends balance return request → Status: `'Pending Approval / Balance'`
2. Manager approves → Status: `'Settled / Balance Returned'` ✅

**Overdue Collection Flow:**
1. Clerk sends overdue collection request → Status: `'Pending Approval / Over Due'`
2. Manager approves → Status: `'Settled / Over Due Collected'` ✅

## Files Modified

### Backend

#### 1. ApproveCashBalanceSettlement.js
**Location:** `backend-api/src/application/use-cases/cashbalancesettlement/ApproveCashBalanceSettlement.js`

**Change:**
```javascript
// Set status based on settlement type
const finalStatus = settlement.settlementType === 'BALANCE_RETURN'
  ? 'Settled / Balance Returned'
  : 'Settled / Over Due Collected';
```

**Impact:** Approved settlements have type-specific statuses that clearly indicate what was approved.

#### 2. GetGroupedAssignments.js
**Location:** `backend-api/src/application/use-cases/pettycashassignment/GetGroupedAssignments.js`

**Change:** Added logic to detect when all assignments in a group have the same approved status:
```javascript
// Check if all assignments have the same approved status
const allBalanceReturned = group.assignments.every(a => a.status === 'Settled / Balance Returned');
const allOverDueCollected = group.assignments.every(a => a.status === 'Settled / Over Due Collected');
const allApproved = group.assignments.every(a => a.status === 'Settled/Approved');

if (allBalanceReturned) {
  group.groupStatus = 'Settled / Balance Returned';
} else if (allOverDueCollected) {
  group.groupStatus = 'Settled / Over Due Collected';
} else if (allApproved) {
  group.groupStatus = 'Settled/Approved';
}
```

**Impact:** Group status correctly reflects the specific type of approval when all assignments have the same approved status.

#### 3. GetAggregatedAssignments.js
**Location:** `backend-api/src/application/use-cases/pettycashassignment/GetAggregatedAssignments.js`

**Change:** Same logic as GetGroupedAssignments to handle approved status in aggregated views.

### Frontend

#### 4. PettyCash.js
**Location:** `frontend/src/components/PettyCash.js`

**Change:** Added check for type-specific approved statuses in group status calculation:
```javascript
// Check if all assignments have the same approved status
const allBalanceReturned = groupAssignments.every(a => a.status === 'Settled / Balance Returned');
const allOverDueCollected = groupAssignments.every(a => a.status === 'Settled / Over Due Collected');
const allApproved = groupAssignments.every(a => a.status === 'Settled/Approved');
if (allBalanceReturned) return 'Settled / Balance Returned';
if (allOverDueCollected) return 'Settled / Over Due Collected';
if (allApproved) return 'Settled/Approved';
```

**Impact:** Frontend group status matches backend calculation and shows type-specific approved statuses.

## Status Priority Logic

The group status is determined in this order:

1. **Assigned** - If any assignment has "Assigned" status
2. **Pending Approval** - If any assignment has pending approval status
3. **Settled / Balance Returned** - If ALL assignments have this status
4. **Settled / Over Due Collected** - If ALL assignments have this status
5. **Settled/Approved** - If ALL assignments have this status (legacy)
6. **Balance To Be Return** - If group has balance > 0
7. **Over Due** - If group has over amount > 0
8. **Settled** - Default for settled assignments with no balance/over

## Benefits

### 1. Clear Settlement Type Indication
- Status clearly shows whether balance was returned or overdue was collected
- Easier to track different types of settlements
- Better audit trail of settlement actions

### 2. Type-Specific Reporting
- Can generate separate reports for balance returns vs overdue collections
- Better analytics on settlement patterns
- Clear distinction between settlement types

### 3. Better User Experience
- Users can immediately see what type of settlement was approved
- Status provides context about the transaction
- No ambiguity about settlement type

## Database Considerations

Both statuses are properly supported:
- `'Settled / Balance Returned'` - For approved balance returns
- `'Settled / Over Due Collected'` - For approved overdue collections
- Status column is wide enough (NVARCHAR(100))
- Frontend has styling for both statuses
- Backend logic includes both statuses in settled checks

## Legacy Status Support

The `'Settled/Approved'` status is still recognized for backward compatibility and can be used for generic approvals that don't fit the balance/overdue categories.

## Testing Scenarios

### Scenario 1: Balance Return Approval
1. Assignment has balance of 2000
2. Clerk sends balance return request
3. Status: `'Pending Approval / Balance'`
4. Manager approves
5. Status: `'Settled / Balance Returned'` ✅

### Scenario 2: Overdue Collection Approval
1. Assignment has overdue of 1000
2. Clerk sends overdue collection request
3. Status: `'Pending Approval / Over Due'`
4. Manager approves
5. Status: `'Settled / Over Due Collected'` ✅

### Scenario 3: Group Balance Return Approval
1. Group has 2 assignments (both settled with balance)
2. Clerk sends balance return request for group
3. Both assignments: `'Pending Approval / Balance'`
4. Manager approves
5. Both assignments: `'Settled / Balance Returned'` ✅
6. Group status: `'Settled / Balance Returned'` ✅

### Scenario 4: Mixed Group (One Approved, One Pending)
1. Group has 2 assignments
2. Assignment 1: `'Settled / Balance Returned'`
3. Assignment 2: `'Pending Approval / Balance'`
4. Group status: `'Pending Approval / Balance'` ✅ (pending takes priority)

### Scenario 5: All Balance Returned Group
1. Group has 2 assignments
2. Both assignments: `'Settled / Balance Returned'`
3. Group status: `'Settled / Balance Returned'` ✅

## UI Display

The approved statuses are displayed with:

**Settled / Balance Returned:**
- Badge class: `status-settled-balance-returned`
- Color: Green (success color)
- Icon: Checkmark with money icon
- Text: "Settled / Balance Returned"

**Settled / Over Due Collected:**
- Badge class: `status-settled-overdue-collected`
- Color: Green (success color)
- Icon: Checkmark with collection icon
- Text: "Settled / Over Due Collected"

## Impact on Existing Features

### Cash Balance Settlement
- Settlement request creation: No change
- Settlement approval: Status set based on settlement type
  - BALANCE_RETURN → `'Settled / Balance Returned'`
  - OVERDUE_COLLECTION → `'Settled / Over Due Collected'`
- Settlement completion: No change (already handled separately)

### Petty Cash Assignments
- Assignment listing: Shows type-specific approved statuses
- Group views: Correctly aggregates by approved status type
- Filtering: Can filter by specific approved status types

### Reporting
- Can generate separate reports for balance returns vs overdue collections
- Type-specific status queries
- Better settlement type analytics

## Migration Notes

No database migration is required as:
- Both status values are already supported
- The status column already supports these values (NVARCHAR(100))
- Both statuses are already used in the system
- Frontend already has styling for both statuses
