# 🚀 RUN THIS NOW - Quick Fix

## The Problem

You're seeing 6 separate rows when you should see 3 grouped rows.

## The Solution (3 Simple Steps)

### Step 1: Run SQL Script (2 minutes)

1. Open **SQL Server Management Studio**
2. Connect to: `localhost:50156`
3. Select database: `SuperShineCargoDb`
4. Open file: `backend-api/src/config/FIX_GROUPING_COMPLETE.sql`
5. Press **F5** to execute

**Expected Output:**
```
✓ Added groupId column (or already exists)
✓ Updated X assignments with groupId
=== VERIFICATION ===
TotalAssignments: 6
WithGroupId: 6
MissingGroupId: 0

Grouping Summary shows your groups
=== FIX COMPLETED SUCCESSFULLY ===
```

### Step 2: Restart Backend (30 seconds)

```bash
cd backend-api
# Press Ctrl+C to stop
npm start
```

Wait for: "Server running on port 5000"

### Step 3: Refresh Browser (10 seconds)

Press `Ctrl + Shift + R` in your browser

## Expected Result

**Before (6 rows):**
```
#92 | JOB0004 | TDP Thermoline | LKR 10,000
#91 | JOB0004 | TDP Thermoline | LKR 10,000
#88 | JOB0002 | Garusingei | LKR 10,000
#87 | JOB0002 | Garusingei | LKR 10,000
#86 | JOB0001 | Quadexa | LKR 10,000
#85 | JOB0001 | Quadexa | LKR 10,000
```

**After (3 rows):**
```
#92 | JOB0004 | TDP Thermoline | LKR 20,000  ← Click ▼ to expand
#88 | JOB0002 | Garusingei | LKR 20,000     ← Click ▼ to expand
#86 | JOB0001 | Quadexa | LKR 20,000        ← Click ▼ to expand
```

**When you click expand on #92:**
```
#92  | JOB0004 | TDP Thermoline | LKR 10,000
#92-1| JOB0004 | TDP Thermoline | LKR 10,000
```

## That's It!

Just run the SQL script, restart backend, and refresh browser.

---

**File to Run:** `backend-api/src/config/FIX_GROUPING_COMPLETE.sql`
**Time:** 3 minutes total
**Difficulty:** Very Easy
