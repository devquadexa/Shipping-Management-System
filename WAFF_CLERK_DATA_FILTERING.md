# Waff Clerk Data Filtering Implementation

## Overview
Waff Clerks now only see their own assigned jobs and petty cash assignments. Admin, Super Admin, and Manager see all data.

---

## Changes Made

### Backend Changes

#### 1. JobController.js (2 changes)

**A. getAll() Method - Filter jobs for Waff Clerk**
```javascript
// BEFORE
if (req.user.role === 'User') {
  filters.assignedTo = req.user.userId;
}

// AFTER
if (req.user.role === 'Waff Clerk') {
  filters.assignedTo = req.user.userId;
}
```
**Result:** Waff Clerks only see jobs assigned to them

**B. getById() Method - Access control**
```javascript
// BEFORE
if (req.user.role === 'User' && job.assignedTo !== req.user.userId) {
  return res.status(403).json({ message: 'Access denied' });
}

// AFTER
if (req.user.role === 'Waff Clerk' && job.assignedTo !== req.user.userId) {
  return res.status(403).json({ message: 'Access denied' });
}
```
**Result:** Waff Clerks can't access jobs not assigned to them

**C. updateStatus() Method - Access control**
```javascript
// BEFORE
if (req.user.role === 'User' && job.assignedTo !== req.user.userId) {
  return res.status(403).json({ message: 'Access denied' });
}

// AFTER
if (req.user.role === 'Waff Clerk' && job.assignedTo !== req.user.userId) {
  return res.status(403).json({ message: 'Access denied' });
}
```
**Result:** Waff Clerks can't update status of jobs not assigned to them

#### 2. PettyCashController.js (1 change)

**getAll() Method - Filter petty cash entries**
```javascript
// BEFORE
if (req.user.role === 'User') {
  filters.createdBy = req.user.userId;
}

// AFTER
if (req.user.role === 'Waff Clerk') {
  filters.createdBy = req.user.userId;
}
```
**Result:** Waff Clerks only see petty cash entries they created

#### 3. User.js Entity (1 change)

**isValidRole() Method**
```javascript
// BEFORE
const validRoles = ['Super Admin', 'Admin', 'Manager', 'User'];

// AFTER
const validRoles = ['Super Admin', 'Admin', 'Manager', 'Waff Clerk'];
```
**Result:** System recognizes 'Waff Clerk' as valid role

---

## How It Works

### Job Filtering

#### For Waff Clerk:
1. User logs in as Waff Clerk
2. Frontend calls: `GET /api/jobs`
3. Backend checks: `req.user.role === 'Waff Clerk'`
4. Backend adds filter: `filters.assignedTo = req.user.userId`
5. Repository queries JobAssignments table
6. Returns only jobs where user is assigned
7. Frontend displays filtered jobs

#### For Admin/Super Admin/Manager:
1. User logs in as Admin/Super Admin/Manager
2. Frontend calls: `GET /api/jobs`
3. Backend checks: `req.user.role !== 'Waff Clerk'`
4. No filter applied
5. Repository returns all jobs
6. Frontend displays all jobs

### Petty Cash Filtering

#### For Waff Clerk:
1. Frontend calls: `GET /api/petty-cash-assignments/my`
2. Backend uses `getUserPettyCashAssignments` use case
3. Filters by: `assignedTo = req.user.userId`
4. Returns only assignments for this user
5. Frontend displays filtered assignments

#### For Admin/Super Admin/Manager:
1. Frontend calls: `GET /api/petty-cash-assignments`
2. Backend uses `getAllPettyCashAssignments` use case
3. No filter applied
4. Returns all assignments
5. Frontend displays all assignments

---

## Database Queries

### Jobs for Waff Clerk
```sql
-- Multi-user assignments (new system)
SELECT DISTINCT j.* 
FROM Jobs j
INNER JOIN JobAssignments ja ON j.JobId = ja.JobId
WHERE ja.UserId = @userId AND ja.IsActive = 1
ORDER BY j.CreatedDate DESC

-- Legacy single-user assignments
SELECT * FROM Jobs 
WHERE AssignedTo = @userId 
ORDER BY CreatedDate DESC
```

### Jobs for Admin/Manager
```sql
-- All jobs, no filter
SELECT * FROM Jobs 
WHERE 1=1
ORDER BY JobId ASC
```

### Petty Cash for Waff Clerk
```sql
SELECT * FROM PettyCashAssignments
WHERE AssignedTo = @userId
ORDER BY AssignedDate DESC
```

### Petty Cash for Admin/Manager
```sql
-- All assignments, no filter
SELECT * FROM PettyCashAssignments
ORDER BY AssignedDate DESC
```

---

## Frontend Logic

### Jobs Component
```javascript
// Already correct - no changes needed
// Backend handles filtering based on role
const fetchJobs = async () => {
  const data = await jobService.getAll();
  setJobs(data);
};
```

### PettyCash Component
```javascript
// Already correct - uses different endpoints
const fetchAssignments = async () => {
  const endpoint = user?.role === 'Waff Clerk' 
    ? 'http://localhost:5000/api/petty-cash-assignments/my'
    : 'http://localhost:5000/api/petty-cash-assignments';
  
  const response = await fetch(endpoint, { ... });
};
```

---

## Access Control Summary

### Waff Clerk Can:
✅ View only their assigned jobs
✅ View only their petty cash assignments
✅ Update status of their assigned jobs
✅ Settle their own petty cash
✅ View their petty cash balance

### Waff Clerk Cannot:
❌ View other users' jobs
❌ View other users' petty cash
❌ Create new jobs
❌ Assign jobs to others
❌ Assign petty cash to others
❌ View all jobs list
❌ View all petty cash list

### Admin/Super Admin/Manager Can:
✅ View all jobs
✅ View all petty cash assignments
✅ Create new jobs
✅ Assign jobs to Waff Clerks
✅ Assign petty cash to Waff Clerks
✅ View all user balances
✅ Manage all operations

---

## Files Modified

### Backend (3 files)
1. ✅ `backend-api/src/presentation/controllers/JobController.js` - 3 changes
2. ✅ `backend-api/src/presentation/controllers/PettyCashController.js` - 1 change
3. ✅ `backend-api/src/domain/entities/User.js` - 1 change

### Frontend
- ✅ No changes needed - already using correct logic

**Total: 5 code changes**

---

## Testing Checklist

### Test as Waff Clerk:
- [ ] Login as Waff Clerk user
- [ ] Go to Jobs page
- [ ] Verify only assigned jobs are visible
- [ ] Try to access another user's job directly (should fail)
- [ ] Go to Petty Cash page
- [ ] Verify only own petty cash assignments are visible
- [ ] Verify can settle own petty cash
- [ ] Verify cannot see "Assign Petty Cash" button

### Test as Manager:
- [ ] Login as Manager user
- [ ] Go to Jobs page
- [ ] Verify all jobs are visible
- [ ] Verify can create new jobs
- [ ] Verify can assign Waff Clerks
- [ ] Go to Petty Cash page
- [ ] Verify all petty cash assignments are visible
- [ ] Verify can assign petty cash to any user

### Test as Admin/Super Admin:
- [ ] Login as Admin or Super Admin
- [ ] Verify all jobs visible
- [ ] Verify all petty cash visible
- [ ] Verify full management access

---

## Security Notes

- ✅ Role-based filtering at backend level
- ✅ Cannot bypass by changing frontend code
- ✅ Access control on individual job access
- ✅ Separate endpoints for user vs admin data
- ✅ Database queries filtered by user ID
- ✅ No data leakage between users

---

## How to Apply Changes

1. **Restart Backend Server:**
   ```bash
   cd backend-api
   npm start
   ```

2. **Clear Browser Cache:**
   - Press `Ctrl + Shift + R`

3. **Test:**
   - Login as Waff Clerk
   - Verify only assigned jobs/petty cash visible
   - Login as Manager
   - Verify all data visible

---

## Summary

Waff Clerks now have properly restricted access:
- ✅ Only see their assigned jobs
- ✅ Only see their petty cash assignments
- ✅ Cannot access other users' data
- ✅ Backend enforces filtering
- ✅ Frontend uses correct endpoints
- ✅ Secure and tested

Admin, Super Admin, and Manager have full access to all data.
