# Quick Guide - Remove assignedTo Column

## ⚠️ Why Remove It?
The `assignedTo` column is always NULL for new jobs because we use `JobAssignments` table for multiple user assignments.

## ✅ What to Do

### Step 1: Run Migration Script (1 min)
Execute this file in SQL Server Management Studio:
```
backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN.sql
```

### Step 2: Restart Backend (1 min)
```bash
npm start
```

### Step 3: Test (5 min)
1. Create new job
2. Assign multiple users
3. Verify it works

## ✅ Done!

The `assignedTo` column is now removed from the Jobs table.

---

**Total Time**: ~7 minutes
**Risk**: Low (backward compatible)
**Benefit**: Cleaner schema
