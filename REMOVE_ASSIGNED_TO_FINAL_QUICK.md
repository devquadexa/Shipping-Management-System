# Quick Fix - Remove assignedTo Column

## ✅ The Issue
Index `IX_Jobs_AssignedTo` is blocking the column deletion.

## ✅ The Solution
Use the FINAL script that drops the index first.

## ✅ What to Do

### Step 1: Run This Script (1 min)
**File**: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN_FINAL.sql`

1. Open SQL Server Management Studio
2. Open the file above
3. Execute (F5)
4. Wait for "ASSIGNED_TO COLUMN REMOVAL COMPLETE"

### Step 2: Restart Backend (1 min)
```bash
npm start
```

### Step 3: Test (2 min)
1. Create new job
2. Assign multiple users
3. Verify it works

## ✅ Done!

The `assignedTo` column is now removed.

---

**Total Time**: ~4 minutes
**Status**: Ready to execute
