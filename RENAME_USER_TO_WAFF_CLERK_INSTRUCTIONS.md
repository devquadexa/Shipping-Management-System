# Rename "User" Role to "Waff Clerk" - Instructions

## Overview
This document provides instructions for renaming the "User" role to "Waff Clerk" throughout the Super Shine Cargo Service Management System.

---

## Step 1: Update Database

Run the SQL script to update the database:

```sql
-- Execute this script in SQL Server Management Studio or Azure Data Studio
-- File: backend-api/src/config/RENAME_USER_TO_WAFF_CLERK.sql
```

**What this script does:**
1. Updates all existing users with 'User' role to 'Waff Clerk'
2. Drops the old role constraint
3. Adds new constraint with 'Waff Clerk' instead of 'User'
4. Verifies the changes

**To execute:**
1. Open SQL Server Management Studio or Azure Data Studio
2. Connect to your database: `SuperShineCargoDb`
3. Open the file: `backend-api/src/config/RENAME_USER_TO_WAFF_CLERK.sql`
4. Execute the script (F5 or click Execute)
5. Verify the output shows success messages

---

## Step 2: Restart Backend Server

After updating the database, restart your backend server:

```bash
cd backend-api
# Stop the current server (Ctrl + C)
npm start
```

---

## Step 3: Clear Frontend Cache and Restart

Clear the frontend cache and restart:

```bash
cd frontend
# Stop the current server (Ctrl + C)
rm -rf node_modules/.cache
npm start
```

---

## Step 4: Clear Browser Cache

In your browser:
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

---

## Changes Made

### Database Changes:
- ✅ Updated Users table role constraint
- ✅ Changed all existing 'User' records to 'Waff Clerk'
- ✅ Updated COMPLETE_DATABASE_SETUP.sql
- ✅ Updated FIX_WITHOUT_DROP.sql

### Backend Changes:
- ✅ AuthController.js - Default role changed to 'Waff Clerk'

### Frontend Changes:
- ✅ Jobs.js - All role checks updated
- ✅ Dashboard.js - All role checks updated
- ✅ PettyCash.js - All role checks updated
- ✅ Billing.js - All role checks updated
- ✅ Settings.js - All role checks updated
- ✅ UserManagement.js - Role dropdown and default value updated

---

## Verification

After completing all steps, verify the changes:

### 1. Check Database
```sql
-- Check constraint
SELECT * FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('Users') 
AND definition LIKE '%Waff Clerk%';

-- Check user records
SELECT role, COUNT(*) as count 
FROM Users 
GROUP BY role 
ORDER BY role;
```

### 2. Check Frontend
1. Login as Super Admin
2. Go to User Management
3. Click "Create New User"
4. Verify the Role dropdown shows "Waff Clerk" instead of "User"
5. Create a test user with "Waff Clerk" role
6. Logout and login as the new Waff Clerk user
7. Verify the dashboard shows "Assigned to you" labels
8. Verify only assigned jobs are visible

### 3. Check All Pages
- ✅ Dashboard - Shows correct labels for Waff Clerk
- ✅ Jobs - Waff Clerk sees only assigned jobs
- ✅ Petty Cash - Waff Clerk sees only their assignments
- ✅ Billing - Waff Clerk has restricted access
- ✅ Settings - Waff Clerk has restricted access
- ✅ User Management - Role dropdown shows "Waff Clerk"

---

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Rollback script
USE SuperShineCargoDb;
GO

-- Update users back to 'User' role
UPDATE Users 
SET role = 'User' 
WHERE role = 'Waff Clerk';

-- Drop constraint
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('Users') 
AND definition LIKE '%Role%';

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @DropSQL NVARCHAR(500);
    SET @DropSQL = 'ALTER TABLE Users DROP CONSTRAINT ' + @ConstraintName;
    EXEC sp_executesql @DropSQL;
END

-- Add old constraint
ALTER TABLE Users ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'User'));

PRINT 'Rollback complete';
GO
```

---

## Support

If you encounter any issues:
1. Check the database constraint is updated correctly
2. Verify all servers are restarted
3. Clear browser cache completely
4. Check browser console for any errors (F12)
5. Check backend server logs for any errors

---

## Summary

The "User" role has been successfully renamed to "Waff Clerk" throughout the entire system:
- Database schema updated
- All code references updated
- UI labels updated
- Role dropdown updated

All existing users with "User" role are now "Waff Clerk" users.
