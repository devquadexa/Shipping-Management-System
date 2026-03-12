# Multiple Petty Cash Assignments Per Job - Implementation

## Overview
This document describes the changes made to support multiple petty cash assignments per job (one for each assigned user).

---

## Requirements Implemented

### 1. Manager Access to Job Creation ✅
- Managers can now create new jobs
- Managers can assign Waff Clerks to jobs
- Managers have same job management access as Admin/Super Admin

### 2. Multiple Petty Cash Assignments Per Job ✅
- If a job is assigned to 2 users, both can receive petty cash
- Job appears in petty cash dropdown until ALL assigned users have received petty cash
- Users who already have petty cash for a job are filtered out from the user dropdown
- Clear warning message when all users have received petty cash

---

## Changes Made

### Frontend Changes

#### 1. Jobs.js (3 changes)
**Manager Access Added:**
```javascript
// Line ~40: Fetch users for Manager role
if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
  fetchUsers();
}

// Line ~336: Show "New Job" button for Manager
{(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
  <button onClick={() => setShowModal(true)} className="btn btn-primary">
    + New Job
  </button>
)}

// Line ~423: Allow Manager to assign users
{(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
```

#### 2. PettyCash.js (3 major changes)

**A. New Function: `getAvailableJobs()`**
```javascript
// Shows jobs that have users without petty cash
const getAvailableJobs = () => {
  return jobs.filter(job => {
    // Skip jobs with no assignments
    if (!jobAssignments[job.jobId] || jobAssignments[job.jobId].length === 0) {
      return false;
    }
    
    // Get assigned users
    const assignedUserIds = jobAssignments[job.jobId].map(a => a.userId);
    
    // Get users who already have petty cash
    const usersWithPettyCash = assignments
      .filter(a => a.jobId === job.jobId && a.status !== 'Returned')
      .map(a => a.assignedTo);
    
    // Check if any assigned user doesn't have petty cash
    const hasUsersWithoutPettyCash = assignedUserIds.some(
      userId => !usersWithPettyCash.includes(userId)
    );
    
    return hasUsersWithoutPettyCash;
  });
};
```

**B. Updated Function: `getAvailableUsersForJob()`**
```javascript
// Now filters out users who already have petty cash for this job
const getAvailableUsersForJob = (jobId) => {
  if (!jobId || !jobAssignments[jobId]) {
    return [];
  }
  
  // Get assigned users
  const assignedUserIds = jobAssignments[jobId].map(a => a.userId);
  
  // Get users with petty cash (excluding Returned)
  const usersWithPettyCash = assignments
    .filter(a => a.jobId === jobId && a.status !== 'Returned')
    .map(a => a.assignedTo);
  
  // Return only assigned users without petty cash
  return users.filter(user => 
    assignedUserIds.includes(user.userId) && 
    !usersWithPettyCash.includes(user.userId)
  );
};
```

**C. Updated Job Dropdown**
```javascript
// Changed from filtering by pettyCashStatus to using getAvailableJobs()
<select>
  <option value="">-- Select Job --</option>
  {getAvailableJobs().map(job => (
    <option key={job.jobId} value={job.jobId}>
      {job.jobId} - {getCustomerName(job.customerId)} - {job.shipmentCategory}
    </option>
  ))}
</select>
```

**D. Added Helper Message**
```javascript
{assignFormData.jobId && getAvailableUsersForJob(assignFormData.jobId).length === 0 && (
  <p className="helper-text warning">
    All assigned users for this job have already received petty cash.
  </p>
)}
```

#### 3. PettyCash.css (1 addition)
**Added Helper Text Styling:**
```css
.helper-text {
  margin: 0.5rem 0 0 0;
  padding: 0.75rem;
  font-size: 0.875rem;
  border-radius: 6px;
  line-height: 1.4;
}

.helper-text.warning {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
}
```

---

## How It Works

### Scenario: Job with 2 Assigned Users

**Initial State:**
- Job JOB0001 is assigned to User A and User B
- No petty cash assigned yet

**Step 1: First Petty Cash Assignment**
1. Admin/Manager clicks "Assign Petty Cash"
2. Job dropdown shows JOB0001
3. User dropdown shows: User A, User B
4. Admin assigns LKR 5,000 to User A
5. Assignment created successfully

**Step 2: Second Petty Cash Assignment**
1. Admin/Manager clicks "Assign Petty Cash" again
2. Job dropdown STILL shows JOB0001 (because User B hasn't received petty cash)
3. User dropdown shows: User B only (User A is filtered out)
4. Admin assigns LKR 3,000 to User B
5. Assignment created successfully

**Step 3: After All Users Have Petty Cash**
1. Admin/Manager clicks "Assign Petty Cash"
2. Job dropdown NO LONGER shows JOB0001 (all users have petty cash)
3. Job is complete for petty cash purposes

### Scenario: User Returns Petty Cash

If User A returns their petty cash (status = 'Returned'):
- Job JOB0001 appears in dropdown again
- User dropdown shows User A only
- Can assign new petty cash to User A

---

## Database Structure

No database changes required! The existing structure already supports multiple assignments:

```sql
CREATE TABLE PettyCashAssignments (
    assignmentId INT IDENTITY(1,1) PRIMARY KEY,
    jobId VARCHAR(50) NOT NULL,           -- Same job can appear multiple times
    assignedTo VARCHAR(50) NOT NULL,      -- Different users
    assignedAmount DECIMAL(18,2) NOT NULL,
    status NVARCHAR(50) DEFAULT 'Assigned',
    ...
);
```

**Key Points:**
- No unique constraint on (jobId, assignedTo)
- Multiple rows can have same jobId
- Each row represents one user's petty cash for one job

---

## Testing Checklist

### Manager Access
- [ ] Manager can see "New Job" button
- [ ] Manager can create new jobs
- [ ] Manager can assign multiple Waff Clerks to a job
- [ ] Manager can view all jobs

### Multiple Petty Cash Assignments
- [ ] Create a job and assign 2 users (User A, User B)
- [ ] Assign petty cash to User A
- [ ] Click "Assign Petty Cash" again
- [ ] Verify job still appears in dropdown
- [ ] Verify only User B appears in user dropdown
- [ ] Assign petty cash to User B
- [ ] Click "Assign Petty Cash" again
- [ ] Verify job NO LONGER appears in dropdown
- [ ] Verify both assignments appear in the table

### Edge Cases
- [ ] Job with 1 user: Works as before
- [ ] Job with 3+ users: All can receive petty cash
- [ ] User returns petty cash: Job appears again for that user
- [ ] Job with no assigned users: Doesn't appear in dropdown

---

## Benefits

1. **Flexible Assignment**: Each user gets their own petty cash amount
2. **Clear Tracking**: Separate records for each user's petty cash
3. **Independent Settlement**: Users can settle independently
4. **Accurate Reporting**: Know exactly who received what amount
5. **No Confusion**: Clear messages when all users have petty cash

---

## User Experience Improvements

1. **Smart Filtering**: Only shows relevant jobs and users
2. **Clear Feedback**: Warning message when no users available
3. **Prevents Errors**: Can't assign petty cash twice to same user
4. **Intuitive Flow**: Job appears until all users are covered

---

## No Breaking Changes

- ✅ Existing single-user assignments still work
- ✅ Database structure unchanged
- ✅ All existing functionality preserved
- ✅ Backward compatible

---

## Summary

The system now supports:
1. ✅ Manager can create jobs and assign Waff Clerks
2. ✅ Multiple petty cash assignments per job (one per assigned user)
3. ✅ Smart filtering to show only relevant jobs and users
4. ✅ Clear feedback when all users have received petty cash
5. ✅ Independent tracking and settlement for each user

All changes are in the frontend logic - no database migrations needed!
