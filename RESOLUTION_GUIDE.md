# Office Executive Registration - Resolution Guide

## Issue
Registration error when creating Office Executive user:
```
RequestError: The INSERT statement conflicted with the CHECK constraint "CK_Users_Role"
```

## Root Cause
Database constraint missing "Office Executive" role in allowed values.

## Solution

### Step 1: Execute Migration Script
File: `backend-api/src/config/FIX_OFFICE_EXECUTIVE_CONSTRAINT.sql`

**Option A - SQL Server Management Studio (SSMS)**
1. Open SSMS
2. Connect to: `SASMIKA\SQLEXPRESS`
3. Select database: `SuperShineCargoDb`
4. Open file: `backend-api/src/config/FIX_OFFICE_EXECUTIVE_CONSTRAINT.sql`
5. Click Execute (F5)
6. Check output for "✓ New constraint added successfully"

**Option B - Command Line**
```bash
sqlcmd -S SASMIKA\SQLEXPRESS -d SuperShineCargoDb -i "backend-api/src/config/FIX_OFFICE_EXECUTIVE_CONSTRAINT.sql"
```

### Step 2: Verify Fix
Run this query in SSMS:
```sql
SELECT definition FROM sys.check_constraints 
WHERE name = 'CK_Users_Role' AND parent_object_id = OBJECT_ID('Users');
```

Should contain: `'Office Executive'`

### Step 3: Test Registration
1. Go to User Management (Super Admin)
2. Click "+ New User"
3. Select "Office Executive" from Role dropdown
4. Create user
5. Should succeed ✓

## What Changed
- **Before**: `CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk'))`
- **After**: `CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Office Executive', 'Waff Clerk'))`

## Verification Checklist
- [ ] SQL script executed successfully
- [ ] Constraint verification query shows Office Executive
- [ ] Can create Office Executive user
- [ ] Office Executive user appears in User Management table
- [ ] Office Executive user can login
- [ ] Office Executive has correct permissions

## Status
✅ READY TO APPLY
