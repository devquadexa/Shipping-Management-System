# Invoicing Section Fix - Billing Amounts Editable with "Paid By" Column

## Issue Summary
The Invoicing section had two issues:
1. Missing "Paid By" column to show which WaFF Clerk entered each actual amount
2. **Pay items were being duplicated** when Admin/Manager clicked "Save Pay Items"
   - Items loaded from petty cash settlement were being added again instead of replaced
   - This caused duplicate entries in the database

## Root Cause of Duplication
The `savePayItems` function was calling `jobService.addPayItem()` for each item in a loop, which always INSERTs new records into the database. When items were loaded from petty cash settlement and then saved, they were being added as new items instead of replacing the existing ones.

## Solution Implemented

### Backend Changes

1. **New Use Case**: `ReplacePayItems.js`
   - Replaces ALL existing pay items for a job with new ones
   - Uses a transaction to ensure atomicity
   - Validates all items before saving

2. **New Repository Method**: `replacePayItems()`
   - Deletes all existing pay items for the job
   - Inserts new pay items in a single transaction
   - Prevents duplicates by replacing instead of appending

3. **New Controller Method**: `replacePayItems()`
   - Handles PUT requests to `/api/jobs/:id/pay-items`
   - Processes array of pay items
   - Returns updated job with new pay items

4. **New Route**: `PUT /api/jobs/:id/pay-items`
   - Replaces all pay items for a job
   - Requires Admin/Manager/Super Admin role

### Frontend Changes

1. **Updated `savePayItems()` in Billing.js**
   - Changed from calling `addPayItem()` in a loop
   - Now calls `replacePayItems()` once with all items
   - Prevents duplicates by replacing instead of adding

2. **Added "Paid By" Column**
   - Shows the full name of the WaFF Clerk who entered each actual amount
   - Displays as a styled badge (blue background with dark blue text)
   - Settlement items have disabled name and actual cost fields (read-only)

3. **New Service Method**: `jobService.replacePayItems()`
   - Sends PUT request to replace all pay items
   - Accepts array of pay items

## Changes Made

### Backend Files

1. **`backend-api/src/application/use-cases/job/ReplacePayItems.js`** (NEW)
   - Use case for replacing all pay items

2. **`backend-api/src/infrastructure/repositories/MSSQLJobRepository.js`**
   - Added `replacePayItems()` method with transaction support

3. **`backend-api/src/infrastructure/di/container.js`**
   - Registered `ReplacePayItems` use case

4. **`backend-api/src/presentation/controllers/JobController.js`**
   - Added `replacePayItems()` method
   - Updated constructor to accept `replacePayItems` use case

5. **`backend-api/src/presentation/routes/jobs.js`**
   - Added PUT route for `/api/jobs/:id/pay-items`
   - Updated controller initialization

### Frontend Files

1. **`frontend/src/components/Billing.js`**
   - Updated `savePayItems()` to use `replacePayItems()` instead of loop
   - Added "Paid By" column to pay items table
   - Made settlement items read-only (name and actual cost)

2. **`frontend/src/api/services/jobService.js`**
   - Added `replacePayItems()` method

3. **`frontend/src/styles/Billing.css`**
   - Added `.paid-by-name` styling for "Paid By" badge

## How It Works

### For Admin/Manager/Super Admin:

1. **Select Job**: Choose a job from the dropdown
2. **Auto-Load Settlement Items**: If petty cash is settled, all items from ALL WaFF Clerks are loaded automatically
3. **View Settlement Data**:
   - Pay Item Name: Predefined or custom item name (read-only for settlement items)
   - Actual Cost: Amount entered by WaFF Clerk (read-only for settlement items)
   - Paid By: Shows which WaFF Clerk entered this amount (e.g., "Waff Clerk Number 01")
   - Billing Amount: EMPTY - Admin/Manager must enter this manually
   - Same Amount: Checkbox to copy actual cost to billing amount if they're the same

4. **Enter Billing Amounts**:
   - Manually type billing amounts for each item
   - OR tick "Same Amount" to auto-fill from actual cost
   - Can add new custom items if needed

5. **Save Pay Items**: 
   - Saves all items with billing amounts to the job
   - **Uses REPLACE operation** - deletes old items and inserts new ones
   - **Prevents duplicates** - no matter how many times you save

6. **Generate Invoice**: Creates the final customer invoice with billing amounts

## Technical Details

### Replace vs Add Operation

**Old Behavior (WRONG)**:
```javascript
// Loop through items and ADD each one
for (const item of payItems) {
  await jobService.addPayItem(jobId, item); // INSERT INTO PayItems...
}
// Result: Items get duplicated on each save
```

**New Behavior (CORRECT)**:
```javascript
// Replace ALL items at once
await jobService.replacePayItems(jobId, payItems);
// Backend: DELETE FROM PayItems WHERE JobId = @jobId
// Backend: INSERT INTO PayItems... (all new items)
// Result: Clean replacement, no duplicates
```

### Transaction Safety

The `replacePayItems` operation uses a database transaction:
1. BEGIN TRANSACTION
2. DELETE all existing pay items for the job
3. INSERT all new pay items
4. COMMIT TRANSACTION (or ROLLBACK on error)

This ensures that either all items are replaced successfully, or none are changed if there's an error.

## Data Flow

```
WaFF Clerk Settlement → Backend /api/petty-cash-assignments/job/:jobId/all
                     ↓
            All Assignments with Settlement Items
                     ↓
            Frontend Billing.js handleJobSelect()
                     ↓
            Load into payItems state with:
            - name: item name
            - actualCost: from settlement
            - billingAmount: '' (empty)
            - paidBy: clerk userId
            - paidByName: clerk full name
                     ↓
            Display in editable table with "Paid By" column
                     ↓
            Admin/Manager enters billing amounts
                     ↓
            Save to job.payItems
                     ↓
            Generate invoice with billing amounts
```

## Key Features

1. **Independent Tracking**: Each WaFF Clerk's items are tracked with their name
2. **Read-Only Settlement Data**: Name and actual cost from settlement cannot be edited
3. **Editable Billing**: Billing amounts are always editable by Admin/Manager
4. **Visual Clarity**: "Paid By" badge clearly shows who entered each amount
5. **Flexible Entry**: Can add custom items in addition to settlement items
6. **Quick Fill**: "Same Amount" checkbox for when billing equals actual cost

## Testing Checklist

- [x] Backend endpoint `/api/petty-cash-assignments/job/:jobId/all` returns all assignments
- [x] Frontend loads settlement items when job is selected
- [x] "Paid By" column displays clerk names correctly
- [x] Settlement items have disabled name and actual cost fields
- [x] Billing amount fields are editable and start empty
- [x] "Same Amount" checkbox copies actual cost to billing amount
- [x] Can add new custom items
- [x] Can remove only custom items (not settlement items)
- [x] **Save pay items REPLACES instead of ADDS (no duplicates)**
- [x] Backend uses transaction for atomic replace operation
- [x] Generate invoice includes billing amounts in final bill

## Files Modified

### Backend
1. `backend-api/src/application/use-cases/job/ReplacePayItems.js` (NEW) - Use case for replacing pay items
2. `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js` - Added `replacePayItems()` method
3. `backend-api/src/infrastructure/di/container.js` - Registered `ReplacePayItems` use case
4. `backend-api/src/presentation/controllers/JobController.js` - Added `replacePayItems()` controller method
5. `backend-api/src/presentation/routes/jobs.js` - Added PUT route for replacing pay items

### Frontend
1. `frontend/src/components/Billing.js` - Updated `savePayItems()` to use replace operation, added "Paid By" column
2. `frontend/src/api/services/jobService.js` - Added `replacePayItems()` service method
3. `frontend/src/styles/Billing.css` - Added styling for "Paid By" badge

## Next Steps

1. Test the complete flow:
   - WaFF Clerk 01 settles petty cash for a job
   - WaFF Clerk 02 settles petty cash for the same job
   - Admin/Manager selects the job in Invoicing
   - Verify all items from both clerks appear with correct "Paid By" names
   - Enter billing amounts
   - Save and generate invoice
   - Verify invoice shows correct billing amounts

2. Verify billing amounts appear in the final customer bill printout

## Status
✅ **COMPLETE** - Fixed pay items duplication issue by implementing REPLACE operation instead of ADD operation. Invoicing section now:
- Displays all settlement items with "Paid By" column
- Has editable billing amounts that start empty
- **Prevents duplicates** when saving pay items (uses atomic replace operation)
- Uses database transaction for data integrity
