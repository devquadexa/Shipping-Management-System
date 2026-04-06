# 🔍 Debug Grouping Issue

## You've run the SQL script, but frontend still shows separate rows

Let's debug this step by step.

## Step 1: Verify Database Has groupId

Run this in SQL Server Management Studio:

```sql
USE SuperShineCargoDb;
GO

SELECT 
    assignmentId,
    jobId,
    assignedTo,
    groupId,
    assignedAmount
FROM PettyCashAssignments
ORDER BY assignmentId DESC;
```

**What to check:**
- ✅ All rows should have `groupId` values
- ✅ groupId should look like: "JOB0001_user123" or "JOB0002_user456"
- ❌ If groupId is NULL or empty, the SQL script didn't work

**If groupId is NULL:**
Run this to fix it:
```sql
UPDATE PettyCashAssignments
SET groupId = jobId + '_' + assignedTo
WHERE groupId IS NULL OR groupId = '';
```

## Step 2: Restart Backend Server

**IMPORTANT:** You MUST restart the backend after running SQL changes!

```bash
# Stop backend (Ctrl+C)
cd backend-api
npm start
```

Wait for: "Server running on port 5000"

## Step 3: Check Browser Console

1. Open your browser
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. **Refresh** the Petty Cash page (Ctrl+R)
5. Look for debug messages starting with "=== GROUPING DEBUG ==="

**You should see:**
```
=== GROUPING DEBUG ===
Total assignments: 6
Assignments data: [...]
Assignment 92: jobId=JOB0004, assignedTo=user123, groupId=JOB0004_user123, calculated=JOB0004_user123
Assignment 91: jobId=JOB0004, assignedTo=user123, groupId=JOB0004_user123, calculated=JOB0004_user123
...
Total groups: 3
Groups: [
  { groupId: "JOB0004_user123", count: 2, ids: [92, 91] },
  { groupId: "JOB0002_user456", count: 2, ids: [88, 87] },
  { groupId: "JOB0001_user789", count: 2, ids: [86, 85] }
]
=== END DEBUG ===
```

## Step 4: Check API Response

1. In Developer Tools, go to **Network** tab
2. **Refresh** the page
3. Look for request to `/api/petty-cash-assignments` or `/api/petty-cash-assignments/my`
4. Click on it
5. Go to **Preview** or **Response** tab

**Check:**
- Does each assignment have a `groupId` field?
- Are the groupId values correct?

**Example of correct response:**
```json
[
  {
    "assignmentId": 92,
    "jobId": "JOB0004",
    "assignedTo": "user123",
    "groupId": "JOB0004_user123",
    "assignedAmount": 10000
  },
  {
    "assignmentId": 91,
    "jobId": "JOB0004",
    "assignedTo": "user123",
    "groupId": "JOB0004_user123",
    "assignedAmount": 10000
  }
]
```

## Step 5: Clear Browser Cache

Sometimes the browser caches old data:

**Option 1: Hard Refresh**
- Press `Ctrl + Shift + R`

**Option 2: Clear Cache**
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"
- Refresh page

## Common Issues and Solutions

### Issue 1: groupId is NULL in database

**Solution:**
```sql
UPDATE PettyCashAssignments
SET groupId = jobId + '_' + assignedTo;
```

### Issue 2: Different assignedTo values

If assignments have different `assignedTo` values, they won't group:

**Check:**
```sql
SELECT 
    jobId,
    assignedTo,
    COUNT(*) as Count,
    STRING_AGG(CAST(assignmentId AS VARCHAR), ', ') as IDs
FROM PettyCashAssignments
GROUP BY jobId, assignedTo
ORDER BY jobId;
```

**Example:**
```
jobId    | assignedTo | Count | IDs
---------|------------|-------|--------
JOB0001  | user123    | 1     | 85      ← Won't group (different users)
JOB0001  | user456    | 1     | 86      ← Won't group (different users)
JOB0002  | user123    | 2     | 87, 88  ← Will group (same user)
```

If this is the case, assignments are correctly NOT grouping because they're assigned to different users.

### Issue 3: Backend not restarted

**Solution:**
```bash
cd backend-api
# Press Ctrl+C
npm start
```

### Issue 4: Browser cache

**Solution:**
- Press `Ctrl + Shift + R`
- Or clear browser cache completely

### Issue 5: groupId not in API response

**Check backend repository:**

The `getAll()` method should include:
```sql
SELECT 
    pca.*,
    ISNULL(pca.groupId, pca.jobId + '_' + pca.assignedTo) as groupId,
    ...
FROM PettyCashAssignments pca
```

If it doesn't, the backend code needs to be updated.

## What to Send Me

If it's still not working, send me:

1. **Database query result:**
```sql
SELECT assignmentId, jobId, assignedTo, groupId
FROM PettyCashAssignments
ORDER BY assignmentId DESC;
```

2. **Browser console output:**
- The "=== GROUPING DEBUG ===" section

3. **API response:**
- From Network tab → /api/petty-cash-assignments → Response

4. **Screenshot:**
- What you see on the Petty Cash page

This will help me identify the exact issue!

## Quick Checklist

- [ ] Ran FIX_GROUPING_COMPLETE.sql
- [ ] Verified groupId exists in database (not NULL)
- [ ] Restarted backend server
- [ ] Cleared browser cache (Ctrl+Shift+R)
- [ ] Checked browser console for debug messages
- [ ] Checked Network tab for API response
- [ ] Verified groupId is in API response

If all checked and still not working, send me the debug info above!
