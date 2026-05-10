# Petty Cash Assignment - Automatic Job Status Update

## Overview
When petty cash is assigned to a job, the system automatically updates the job status from "Open" to "In Progress".

## Implementation Details

### Files Modified

1. **CreatePettyCashAssignment.js** (Already implemented)
   - Location: `backend-api/src/application/use-cases/pettycashassignment/CreatePettyCashAssignment.js`
   - Lines 35-41: Auto-updates job status when petty cash is assigned
   - Logic:
     - After creating the petty cash assignment
     - Checks if the job exists and has status "Open"
     - Updates status to "In Progress" if condition is met

2. **CreateSubAssignment.js** (Updated)
   - Location: `backend-api/src/application/use-cases/pettycashassignment/CreateSubAssignment.js`
   - Added jobRepository dependency
   - Added same status update logic for edge cases
   - Ensures job status is "In Progress" even when creating sub-assignments

3. **container.js** (Updated)
   - Location: `backend-api/src/infrastructure/di/container.js`
   - Updated CreateSubAssignment instantiation to include jobRepository

### Logic Flow

```
User assigns petty cash to a job
    ↓
CreatePettyCashAssignment.execute() is called
    ↓
Validates assignment data
    ↓
Checks if bill already exists (prevents assignment if bill generated)
    ↓
Creates petty cash assignment record
    ↓
Checks if job status is "Open"
    ↓
If "Open", updates job status to "In Progress"
    ↓
Returns assignment
```

### Status Transition Rules

- **Trigger**: Petty cash assignment created for a job
- **Condition**: Job status must be "Open"
- **Action**: Update job status to "In Progress"
- **Applies to**:
  - Main petty cash assignments
  - Sub-assignments (for edge case handling)

### Benefits

1. **Automatic Workflow**: No manual status update needed
2. **Consistency**: Ensures jobs with petty cash are marked as in progress
3. **Visibility**: Managers can see which jobs are actively being worked on
4. **Audit Trail**: Status change is tracked in the system

### Edge Cases Handled

1. **Job already in progress**: No change made (only updates if status is "Open")
2. **Job completed**: No change made (only updates if status is "Open")
3. **Multiple assignments**: Status updated on first assignment, subsequent assignments don't affect it
4. **Sub-assignments**: Also checks and updates status if needed (handles cases where status might have been reverted)

### Database Impact

- Updates the `Status` column in the `Jobs` table
- SQL: `UPDATE Jobs SET Status = 'In Progress' WHERE JobId = @jobId`

### Testing Checklist

- [x] Create petty cash assignment for job with "Open" status → Status changes to "In Progress"
- [x] Create petty cash assignment for job already "In Progress" → No change
- [x] Create petty cash assignment for "Completed" job → No change
- [x] Create sub-assignment → Parent job status is "In Progress"
- [x] Verify status update is reflected in Jobs list
- [x] Verify status update is reflected in job details

## Related Files

- `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js` - Contains `updateStatus()` method
- `backend-api/src/presentation/controllers/PettyCashAssignmentController.js` - Handles API requests
