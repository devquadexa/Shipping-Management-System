# Remove assignedTo Column - Fixed Scripts

## Issue
The original migration script had an error with the foreign key detection query.

## Solution
I've created 3 versions of the migration script. Use them in this order:

### Version 1: BASIC (Recommended - Start Here)
**File**: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_BASIC.sql`

This is the simplest version:
- Tries to drop the column directly
- If it fails due to foreign key, drops the foreign key first
- Then drops the column
- **Recommended for most cases**

### Version 2: SIMPLE
**File**: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_SIMPLE.sql`

This version:
- Lists all foreign keys on the Jobs table
- Drops all foreign keys
- Then drops the column
- **Use if BASIC version fails**

### Version 3: ORIGINAL (Fixed)
**File**: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN.sql`

This version:
- Uses corrected foreign key detection
- Drops specific foreign key if found
- Then drops the column
- **Use if SIMPLE version fails**

## How to Use

### Step 1: Try BASIC Version First
1. Open SQL Server Management Studio
2. Open: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_BASIC.sql`
3. Execute (F5)
4. Check for success message

### Step 2: If BASIC Fails, Try SIMPLE
1. Open: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_SIMPLE.sql`
2. Execute (F5)
3. Check for success message

### Step 3: If SIMPLE Fails, Try ORIGINAL
1. Open: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN.sql`
2. Execute (F5)
3. Check for success message

## Expected Output

Successful execution will show:
```
============================================
REMOVING ASSIGNED_TO COLUMN FROM JOBS TABLE
============================================

Found assignedTo column.
Attempting to drop column...
✓ assignedTo column dropped successfully

Current Jobs table columns:
COLUMN_NAME          DATA_TYPE        IS_NULLABLE
jobId                varchar          NO
customerId           varchar          NO
shipmentCategory     nvarchar         NO
openDate             datetime         YES
status               nvarchar         YES
pettyCashStatus      nvarchar         YES
blNumber             varchar          YES
cusdecNumber         varchar          YES
exporter             varchar          YES
lcNumber             varchar          YES
containerNumber      varchar          YES
createdDate          datetime         YES
completedDate        datetime         YES

============================================
OPERATION COMPLETE
============================================
```

Note: `assignedTo` should NOT appear in the columns list.

## Troubleshooting

### If you get an error:
1. Check the error message
2. Try the next version in the list
3. If all fail, contact support with the error message

### If the column still exists after running:
1. Run the script again
2. Try the next version
3. Verify the column name is exactly "assignedTo" (case-sensitive)

## After Successful Execution

### Step 1: Restart Backend
```bash
npm start
```

### Step 2: Test Job Creation
1. Go to Jobs page
2. Create new job
3. Assign multiple users
4. Verify it works

### Step 3: Verify in Database
```sql
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;
```

The `assignedTo` column should NOT appear.

## Summary

| Script | Complexity | When to Use |
|--------|-----------|-----------|
| BASIC | Simple | First attempt |
| SIMPLE | Medium | If BASIC fails |
| ORIGINAL | Complex | If SIMPLE fails |

**Recommendation**: Start with BASIC version. It has error handling built in.

---

**Status**: Fixed and ready to use
**Recommended Script**: REMOVE_ASSIGNED_TO_COLUMN_BASIC.sql
