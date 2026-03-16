# Remove assignedTo Column - Index Issue Fixed

## Problem
When trying to drop the `assignedTo` column, we got this error:
```
Msg 5074: The index 'IX_Jobs_AssignedTo' is dependent on column 'assignedTo'.
Msg 4922: ALTER TABLE DROP COLUMN assignedTo failed because one or more objects access this column.
```

## Root Cause
There's an index (`IX_Jobs_AssignedTo`) on the `assignedTo` column. We need to drop the index BEFORE dropping the column.

## Solution
Use the new FINAL script that:
1. Drops all indexes on the `assignedTo` column
2. Drops all foreign keys
3. Then drops the column

## How to Use

### Step 1: Run the FINAL Script
**File**: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_FINAL.sql`

1. Open SQL Server Management Studio
2. Open the file: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_FINAL.sql`
3. Execute (F5)
4. Wait for completion

### Expected Output
```
============================================
REMOVING ASSIGNED_TO COLUMN FROM JOBS TABLE
============================================

Found assignedTo column.

Step 1: Dropping indexes on assignedTo column...
  Found index: IX_Jobs_AssignedTo
  ✓ Dropped index: IX_Jobs_AssignedTo

Step 2: Dropping foreign keys on assignedTo column...
  Found foreign key: FK_Jobs_Users
  ✓ Dropped foreign key: FK_Jobs_Users

Step 3: Dropping assignedTo column...
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
ASSIGNED_TO COLUMN REMOVAL COMPLETE
============================================

Note: All user assignments are now stored in the JobAssignments table
```

**Important**: `assignedTo` should NOT appear in the columns list.

## What the Script Does

### Step 1: Drop Indexes
- Finds all indexes with "AssignedTo" in the name
- Drops each index
- Prints confirmation for each

### Step 2: Drop Foreign Keys
- Finds all foreign keys on the Jobs table
- Drops each foreign key
- Prints confirmation for each

### Step 3: Drop Column
- Drops the `assignedTo` column
- Prints success message

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
-- Check that assignedTo column is gone
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

-- Check that index is gone
SELECT name
FROM sys.indexes
WHERE object_id = OBJECT_ID('Jobs')
AND name LIKE '%AssignedTo%';
```

Both queries should return no results for `assignedTo`.

## Troubleshooting

### If you still get an error:
1. Check the error message
2. It might mention a different object (view, stored procedure, etc.)
3. The script will show what it found and dropped
4. Try running the script again

### If the column still exists:
1. Run the script again
2. Check the output for any errors
3. Verify the column name is exactly "assignedTo"

## Files Involved

### Database
- `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_FINAL.sql` - **USE THIS ONE**

### Backend Code
- `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js` - Already updated

## Summary

| Issue | Solution |
|-------|----------|
| Index on column | Drop index first |
| Foreign key on column | Drop foreign key |
| Column still in use | Drop all dependent objects |

**The FINAL script handles all of these automatically.**

---

**Status**: Fixed and ready to use
**Recommended Script**: REMOVE_ASSIGNED_TO_COLUMN_FINAL.sql
**Time**: ~2 minutes
