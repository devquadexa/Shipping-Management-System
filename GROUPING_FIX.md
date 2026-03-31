# 🔧 Grouping Fix - Show One Row Per Job+User

## Problem

The Petty Cash page is showing multiple separate rows instead of grouping them:

**Current (Wrong):**
```
#90 | JOB0003 | Quadexa | LKR 10,000
#89 | JOB0003 | Quadexa | LKR 10,000
#88 | JOB0002 | Customer | LKR 10,000
#87 | JOB0002 | Customer | LKR 10,000
```

**Expected (Correct):**
```
#90 | JOB0003 | Quadexa | LKR 20,000  ← Grouped (2 assignments)
#88 | JOB0002 | Customer | LKR 20,000  ← Grouped (2 assignments)
```

## Root Cause

The `groupId` column might not exist in the database, or existing assignments don't have `groupId` values set. The grouping logic in the frontend depends on this field.

## Solution

### Step 1: Add groupId Column and Backfill Data

Run this SQL script in SQL Server Management Studio:

**File:** `backend-api/src/config/ADD_GROUPID_COLUMN.sql`

```sql
-- Add groupId column if it doesn't exist
IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'groupId'
)
BEGIN
  ALTER TABLE PettyCashAssignments ADD groupId NVARCHAR(100) NULL;
  PRINT '✓ Added groupId column';
END

-- Backfill groupId for existing records
UPDATE PettyCashAssignments
SET groupId = jobId + '_' + assignedTo
WHERE groupId IS NULL;

PRINT '✓ Backfilled groupId for existing assignments';
```

### Step 2: Verify Grouping Logic

The frontend already has the correct grouping logic:

```javascript
// In PettyCash.js
const groupMap = new Map();
assignments.forEach(a => {
  const gid = a.groupId || `${a.jobId}_${a.assignedTo}`;
  if (!groupMap.has(gid)) groupMap.set(gid, []);
  groupMap.get(gid).push(a);
});
```

This groups assignments by:
- `groupId` if it exists in the database
- OR `jobId_assignedTo` as a fallback

### Step 3: Sub-Assignment ID Format

The sub-assignment ID format is already implemented:

```javascript
const subAssignmentId = index === 0 
  ? `#${assignment.assignmentId}`      // First: #88
  : `#${first.assignmentId}-${index}`; // Others: #88-1, #88-2
```

## How to Apply the Fix

### 1. Run SQL Migration

```bash
# In SQL Server Management Studio:
# 1. Connect to: localhost:50156
# 2. Select database: SuperShineCargoDb
# 3. Open file: backend-api/src/config/ADD_GROUPID_COLUMN.sql
# 4. Execute (F5)
```

**Expected Output:**
```
✓ Added groupId column (or already exists)
✓ Backfilled groupId for existing assignments
✓ Migration completed successfully
```

### 2. Restart Backend (if running)

```bash
cd backend-api
# Press Ctrl+C to stop
npm start
```

### 3. Clear Browser Cache and Refresh

```bash
# In browser:
# Press Ctrl+Shift+R (hard refresh)
```

### 4. Test

1. Login to the application
2. Navigate to "Petty Cash"
3. Verify assignments are grouped:
   - JOB0003 + Quadexa should show ONE row with total LKR 20,000
   - JOB0002 + Customer should show ONE row with total LKR 20,000
4. Click expand (▼) to see sub-assignments:
   - First: #90
   - Second: #90-1
5. Verify all data is visible (IDs, amounts, dates)

## Expected Result

### Main View (Collapsed)
```
┌────┬─────┬─────────┬──────────┬─────────┬────────┬──────────┐
│ ▶  │ #90 │ JOB0003 │ Quadexa  │ ASSIGNED│ 20,000 │ 3/30/26  │
│ ▶  │ #88 │ JOB0002 │ Customer │ ASSIGNED│ 20,000 │ 3/30/26  │
│ ▶  │ #86 │ JOB0001 │ Quadexa  │ ASSIGNED│ 20,000 │ 3/30/26  │
└────┴─────┴─────────┴──────────┴─────────┴────────┴──────────┘
```

### Expanded View (JOB0003)
```
┌────┬─────┬─────────┬──────────┬─────────┬────────┬──────────┐
│ ▼  │ #90 │ JOB0003 │ Quadexa  │ ASSIGNED│ 20,000 │ 3/30/26  │
├────┼─────┼─────────┼──────────┼─────────┼────────┼──────────┤
│  ▶ │ #90 │ JOB0003 │ Quadexa  │ ASSIGNED│ 10,000 │ 3/30/26  │ ← Main
│  ▶ │#90-1│ JOB0003 │ Quadexa  │ ASSIGNED│ 10,000 │ 3/30/26  │ ← Sub 1
└────┴─────┴─────────┴──────────┴─────────┴────────┴──────────┘
```

## Verification Checklist

After applying the fix, verify:

- [ ] SQL migration ran successfully
- [ ] groupId column exists in PettyCashAssignments table
- [ ] All existing assignments have groupId values
- [ ] Backend restarted (if it was running)
- [ ] Browser cache cleared
- [ ] Petty Cash page shows grouped assignments
- [ ] One row per job+user combination
- [ ] Total amounts are correct
- [ ] Expand button works
- [ ] Sub-assignment IDs show as #88-1, #88-2
- [ ] All data is visible (IDs, amounts, dates)

## Troubleshooting

### Issue: Still showing multiple rows

**Check 1: Verify groupId column exists**
```sql
SELECT TOP 10 
  assignmentId, 
  jobId, 
  assignedTo, 
  groupId,
  assignedAmount
FROM PettyCashAssignments
ORDER BY assignedDate DESC;
```

Expected: groupId column should have values like "JOB0003_user123"

**Check 2: Verify groupId values are set**
```sql
SELECT 
  COUNT(*) as Total,
  COUNT(groupId) as WithGroupId,
  COUNT(*) - COUNT(groupId) as WithoutGroupId
FROM PettyCashAssignments;
```

Expected: WithoutGroupId should be 0

**Check 3: Check browser console**
- Press F12
- Go to Console tab
- Look for errors
- Check what data is being fetched

**Check 4: Verify same assignedTo values**
```sql
SELECT 
  jobId,
  assignedTo,
  COUNT(*) as AssignmentCount,
  SUM(assignedAmount) as TotalAmount
FROM PettyCashAssignments
GROUP BY jobId, assignedTo
HAVING COUNT(*) > 1;
```

This shows which jobs have multiple assignments that should be grouped.

### Issue: groupId column doesn't exist

Run the migration script again:
```sql
-- In SQL Server Management Studio
-- Execute: backend-api/src/config/ADD_GROUPID_COLUMN.sql
```

### Issue: Assignments have different assignedTo values

If assignments for the same job have different `assignedTo` values, they won't be grouped. This is by design - assignments are grouped by BOTH job AND user.

Example:
- JOB0003 + User A = Group 1
- JOB0003 + User B = Group 2 (different group)

## Database Schema

### PettyCashAssignments Table

| Column | Type | Description |
|--------|------|-------------|
| assignmentId | INT | Primary key |
| jobId | VARCHAR | Job reference |
| assignedTo | VARCHAR | User ID |
| assignedAmount | DECIMAL | Amount assigned |
| groupId | NVARCHAR(100) | Grouping key (jobId_assignedTo) |
| ... | ... | Other columns |

### Grouping Logic

```
groupId = jobId + '_' + assignedTo

Examples:
- JOB0003_user123 → All assignments for JOB0003 by user123
- JOB0002_user456 → All assignments for JOB0002 by user456
```

## Summary

✅ **SQL Migration**: Add groupId column and backfill data
✅ **Frontend Logic**: Already implemented (groups by groupId)
✅ **Sub-Assignment IDs**: Already implemented (#88-1, #88-2)
✅ **Display**: One row per job+user with total amount

---

**Status**: Ready to Apply
**Files Created**: 
- `backend-api/src/config/ADD_GROUPID_COLUMN.sql`
- `GROUPING_FIX.md` (this file)

**Next Step**: Run the SQL migration script
