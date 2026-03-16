# How to Fix Office Executive Registration Error

## Quick Fix

The database constraint `CK_Users_Role` doesn't include "Office Executive" role.

### Run This SQL Script

Execute the file: `backend-api/src/config/FIX_OFFICE_EXECUTIVE_CONSTRAINT.sql`

**Using SSMS**: Open file → Execute (F5)

**Using sqlcmd**:
```bash
sqlcmd -S SASMIKA\SQLEXPRESS -d SuperShineCargoDb -i "backend-api/src/config/FIX_OFFICE_EXECUTIVE_CONSTRAINT.sql"
```

## What It Does

1. Drops old constraint: `CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk'))`
2. Creates new constraint: `CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Office Executive', 'Waff Clerk'))`

## After Fix

You can now create Office Executive users in User Management.

## Verify

```sql
SELECT definition FROM sys.check_constraints 
WHERE name = 'CK_Users_Role' AND parent_object_id = OBJECT_ID('Users');
```

Should show: `Office Executive` in the constraint definition.
