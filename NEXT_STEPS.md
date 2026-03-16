# Next Steps - Fix Pay Items Duplication

## ⚠️ IMPORTANT: Backend Server Restart Required

The pay items duplication fix has been implemented, but you're getting a 404 error because the backend server needs to be restarted to load the new code.

---

## Step 1: Restart Backend Server

### Find your backend terminal and:

1. **Stop the current server**
   - Press `Ctrl+C` in the terminal where backend is running

2. **Start the server again**
   ```bash
   cd backend-api
   npm run dev
   ```

3. **Wait for confirmation**
   You should see:
   ```
   Server running on port 5000
   Connected to SQL Server
   ```

---

## Step 2: Test the Fix

1. **Go to Invoicing Section**
   - Login as Admin/Manager/Super Admin
   - Navigate to Invoicing

2. **Select a Job**
   - Choose a job with settled petty cash (e.g., JOB0007)
   - Items should load automatically with "Paid By" column

3. **Enter Billing Amounts**
   - Fill in billing amounts for each item
   - Or use "Same Amount" checkbox to copy actual cost

4. **Save Pay Items**
   - Click "Save Pay Items" button
   - Should see success message
   - Items should appear in the table below

5. **Test for Duplicates**
   - Click "Save Pay Items" again (without changing anything)
   - Items should be REPLACED, not duplicated
   - Check the table - should still show same items, not doubled

---

## Step 3: Verify in Database (Optional)

If you want to verify in the database:

```sql
SELECT * FROM PayItems WHERE JobId = 'JOB0007'
ORDER BY AddedDate DESC
```

You should see only one set of items, not duplicates.

---

## What Was Fixed

### The Problem
Every time you clicked "Save Pay Items", the items were being added again to the database, causing duplicates.

### The Solution
Changed from ADD operation (INSERT) to REPLACE operation (DELETE + INSERT in transaction).

### Technical Details
- Created new backend endpoint: `PUT /api/jobs/:id/pay-items`
- Uses database transaction for atomic operation
- Deletes old items and inserts new ones in one go
- No duplicates possible

---

## Expected Behavior After Fix

✅ First save: Items saved correctly
✅ Second save: Items REPLACED (not duplicated)
✅ Third save: Items REPLACED again
✅ Can save as many times as needed - always clean replacement

---

## If Still Having Issues

### 404 Error persists:
- Make sure you restarted the backend server
- Check backend console for startup errors
- Verify server is running on port 5000

### 500 Error:
- Check backend console for error details
- Verify database connection
- Check if PayItems table exists

### Items still duplicating:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if frontend is using the new code

---

## Summary

1. ✅ Code changes are complete
2. 🔴 Backend restart is REQUIRED
3. ⏳ After restart, test the fix
4. ✅ No more duplicates!

**Please restart the backend server now and test the fix.**
