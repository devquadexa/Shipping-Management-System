# Manager Role Permissions Update

## Overview
Updated backend API permissions to allow Manager role to perform job and petty cash management operations.

---

## Backend Permission Changes

### 1. Auth Routes (`backend-api/src/presentation/routes/auth.js`)

**GET /api/auth/users**
```javascript
// BEFORE
checkRole('Admin', 'Super Admin')

// AFTER
checkRole('Admin', 'Super Admin', 'Manager')
```
**Purpose:** Allows Manager to fetch list of Waff Clerks for job assignment

---

### 2. Job Routes (`backend-api/src/presentation/routes/jobs.js`)

**POST /api/jobs** (Create Job)
```javascript
// BEFORE
checkRole('Admin', 'Super Admin')

// AFTER
checkRole('Admin', 'Super Admin', 'Manager')
```
**Purpose:** Allows Manager to create new jobs

**PATCH /api/jobs/:id/assign** (Assign User to Job)
```javascript
// BEFORE
checkRole('Admin', 'Super Admin')

// AFTER
checkRole('Admin', 'Super Admin', 'Manager')
```
**Purpose:** Allows Manager to assign Waff Clerks to jobs

**POST /api/jobs/:id/pay-items** (Add Pay Items)
```javascript
// BEFORE
checkRole('Admin', 'Super Admin')

// AFTER
checkRole('Admin', 'Super Admin', 'Manager')
```
**Purpose:** Allows Manager to add pay items to jobs

---

### 3. Petty Cash Assignment Routes (`backend-api/src/presentation/routes/pettyCashAssignmentRoutes.js`)

**POST /api/petty-cash-assignments** (Create Assignment)
```javascript
// BEFORE
checkRole('Admin', 'Super Admin')

// AFTER
checkRole('Admin', 'Super Admin', 'Manager')
```
**Purpose:** Allows Manager to assign petty cash to Waff Clerks

**GET /api/petty-cash-assignments** (Get All Assignments)
```javascript
// BEFORE
checkRole('Admin', 'Super Admin')

// AFTER
checkRole('Admin', 'Super Admin', 'Manager')
```
**Purpose:** Allows Manager to view all petty cash assignments

**GET /api/petty-cash-assignments/user-balances** (Get User Balances)
```javascript
// BEFORE
checkRole('Admin', 'Super Admin')

// AFTER
checkRole('Admin', 'Super Admin', 'Manager')
```
**Purpose:** Allows Manager to view user petty cash balances

---

## Summary of Manager Permissions

### Manager Can Now:
✅ View list of Waff Clerks
✅ Create new jobs
✅ Assign Waff Clerks to jobs
✅ Add pay items to jobs
✅ Assign petty cash to Waff Clerks
✅ View all petty cash assignments
✅ View user petty cash balances

### Manager Cannot:
❌ Create new users (Super Admin only)
❌ Access accounting dashboard (Super Admin only)
❌ Delete customers
❌ Manage pay item templates

---

## Files Modified

1. ✅ `backend-api/src/presentation/routes/auth.js` - 1 endpoint
2. ✅ `backend-api/src/presentation/routes/jobs.js` - 3 endpoints
3. ✅ `backend-api/src/presentation/routes/pettyCashAssignmentRoutes.js` - 3 endpoints

**Total: 7 endpoint permissions updated**

---

## Testing Checklist

### As Manager User:

#### Job Management
- [ ] Can view Jobs page
- [ ] Can see "New Job" button
- [ ] Can create new job
- [ ] Can see list of Waff Clerks in assignment dropdown
- [ ] Can assign multiple Waff Clerks to a job
- [ ] Can add pay items to jobs
- [ ] Can view all jobs

#### Petty Cash Management
- [ ] Can view Petty Cash page
- [ ] Can see "Assign Petty Cash" button
- [ ] Can assign petty cash to Waff Clerks
- [ ] Can view all petty cash assignments
- [ ] Can view user balances
- [ ] Can assign petty cash to multiple users for same job

#### Restrictions (Should Fail)
- [ ] Cannot access User Management page
- [ ] Cannot create new users
- [ ] Cannot access Accounting Dashboard
- [ ] Cannot manage pay item templates

---

## How to Apply Changes

1. **Restart Backend Server:**
   ```bash
   cd backend-api
   # Stop current server (Ctrl + C)
   npm start
   ```

2. **Clear Frontend Cache:**
   ```bash
   cd frontend
   # Stop current server (Ctrl + C)
   rm -rf node_modules/.cache
   npm start
   ```

3. **Clear Browser Cache:**
   - Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

4. **Test as Manager:**
   - Login with a Manager account
   - Navigate to Jobs page
   - Verify Waff Clerks load in dropdown
   - Create a test job
   - Assign petty cash

---

## Error Resolution

### Before Fix:
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
Error fetching users: AxiosError: Request failed with status code 403
```

### After Fix:
- Manager can successfully fetch users
- Waff Clerks appear in assignment dropdown
- No 403 errors in console
- Full job and petty cash management access

---

## Security Notes

- Manager role has operational permissions
- Manager cannot create/delete users (Super Admin only)
- Manager cannot access financial reports (Super Admin only)
- All endpoints still require authentication
- Role-based access control (RBAC) properly enforced

---

## Related Documentation

- See `MULTI_USER_PETTY_CASH_IMPLEMENTATION.md` for petty cash features
- See `RENAME_USER_TO_WAFF_CLERK_INSTRUCTIONS.md` for role rename details
