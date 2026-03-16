# Office Executive Registration Fix - Implementation Checklist

## Pre-Implementation
- [ ] Backup database (recommended)
- [ ] Verify SQL Server connection
- [ ] Confirm database name: `SuperShineCargoDb`
- [ ] Confirm server: `SASMIKA\SQLEXPRESS`

## Implementation Steps

### Step 1: Execute Migration Script
- [ ] Open SQL Server Management Studio (SSMS)
- [ ] Connect to `SASMIKA\SQLEXPRESS`
- [ ] Select database `SuperShineCargoDb`
- [ ] Open file: `backend-api/src/config/FIX_OFFICE_EXECUTIVE_CONSTRAINT.sql`
- [ ] Execute script (F5 or Execute button)
- [ ] Verify output shows "✓ New constraint added successfully"

### Step 2: Verify Constraint Update
- [ ] Run verification query:
  ```sql
  SELECT definition FROM sys.check_constraints 
  WHERE name = 'CK_Users_Role' AND parent_object_id = OBJECT_ID('Users');
  ```
- [ ] Confirm output contains: `'Office Executive'`
- [ ] Confirm output contains all 5 roles:
  - Super Admin
  - Admin
  - Manager
  - Office Executive
  - Waff Clerk

## Testing

### Test 1: Create Office Executive User
- [ ] Login to application as Super Admin
- [ ] Navigate to User Management
- [ ] Click "+ New User" button
- [ ] Fill form:
  - Username: `office_exec_test`
  - Full Name: `Office Executive Test`
  - Email: `office@example.com`
  - Password: `TestPassword123`
  - Role: Select "Office Executive"
- [ ] Click "Create User"
- [ ] Verify: User created successfully (no error)
- [ ] Verify: User appears in User Management table
- [ ] Verify: Role shows as "Office Executive"

### Test 2: Login as Office Executive
- [ ] Logout from Super Admin account
- [ ] Login with Office Executive credentials
- [ ] Verify: Login successful
- [ ] Verify: Dashboard accessible
- [ ] Verify: Can see navigation menu

### Test 3: Verify Office Executive Permissions
- [ ] Dashboard: ✓ Accessible
- [ ] Customers: ✓ Can view, add, edit, delete
- [ ] Jobs: ✓ Can view, create, edit
- [ ] Office Pay Items: ✓ Can add payments
- [ ] Billing: ✗ Should NOT be accessible
- [ ] User Management: ✗ Should NOT be accessible

### Test 4: Create Other Roles
- [ ] Create Super Admin user: ✓ Success
- [ ] Create Admin user: ✓ Success
- [ ] Create Manager user: ✓ Success
- [ ] Create Waff Clerk user: ✓ Success

## Post-Implementation

### Verification
- [ ] All 5 roles can be created without errors
- [ ] Office Executive users have correct permissions
- [ ] No database errors in application logs
- [ ] No constraint violations in error logs

### Documentation
- [ ] Update team documentation
- [ ] Notify team of fix
- [ ] Archive migration script location
- [ ] Document any custom configurations

## Rollback Plan (If Needed)

If issues occur, run this to revert:
```sql
ALTER TABLE Users DROP CONSTRAINT CK_Users_Role;
ALTER TABLE Users ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk'));
```

## Sign-Off

- [ ] Implementation completed
- [ ] All tests passed
- [ ] No errors in logs
- [ ] Ready for production

---

**Date**: March 16, 2026  
**Issue**: Office Executive Registration Error  
**Fix**: Database Constraint Update  
**Status**: Ready for Implementation
