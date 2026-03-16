# Pay Items Duplication Fix - Complete Summary

## Problem
When Admin/Manager saved pay items in the Invoicing section, the items were being duplicated in the database. Each time "Save Pay Items" was clicked, the same items were added again.

## Root Cause
The `savePayItems()` function was calling `jobService.addPayItem()` in a loop, which always INSERTs new records. When items loaded from petty cash settlement were saved, they were added as new items instead of replacing existing ones.

## Solution
Implemented a REPLACE operation that deletes all existing pay items for a job and inserts the new ones in a single atomic transaction.

---

## Changes Made

### Backend Changes (5 files)

#### 1. New Use Case: `backend-api/src/application/use-cases/job/ReplacePayItems.js`
```javascript
class ReplacePayItems {
  async execute(jobId, payItemsData, userId) {
    // Validates all items
    // Calls repository.replacePayItems()
    // Returns updated job
  }
}
```

#### 2. Repository Method: `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js`
```javascript
async replacePayItems(jobId, payItems, userId) {
  // BEGIN TRANSACTION
  // DELETE FROM PayItems WHERE JobId = @jobId
  // INSERT INTO PayItems... (all new items)
  // COMMIT TRANSACTION
}
```

#### 3. Controller: `backend-api/src/presentation/controllers/JobController.js`
- Updated constructor to accept `replacePayItems` use case
- Added `replacePayItems()` method to handle PUT requests

#### 4. Routes: `backend-api/src/presentation/routes/jobs.js`
- Added: `PUT /api/jobs/:id/pay-items`
- Updated controller initialization with `replacePayItems` use case

#### 5. DI Container: `backend-api/src/infrastructure/di/container.js`
- Imported `ReplacePayItems` use case
- Registered as `this.dependencies.replacePayItems`

### Frontend Changes (2 files)

#### 1. Service: `frontend/src/api/services/jobService.js`
```javascript
replacePayItems: async (jobId, payItems) => {
  const response = await apiClient.put(`/jobs/${jobId}/pay-items`, { payItems });
  return response.data;
}
```

#### 2. Component: `frontend/src/components/Billing.js`
Changed from:
```javascript
// OLD - Causes duplicates
for (const item of validPayItems) {
  await jobService.addPayItem(selectedJob.jobId, item);
}
```

To:
```javascript
// NEW - Replaces all items
await jobService.replacePayItems(selectedJob.jobId, payItemsData);
```

---

## How It Works

### Before (WRONG)
1. User clicks "Save Pay Items"
2. Loop through each item
3. Call `INSERT INTO PayItems...` for each item
4. **Result**: Items get duplicated on each save

### After (CORRECT)
1. User clicks "Save Pay Items"
2. Send all items in one request
3. Backend starts transaction
4. `DELETE FROM PayItems WHERE JobId = @jobId`
5. `INSERT INTO PayItems...` for all new items
6. Commit transaction
7. **Result**: Clean replacement, no duplicates

---

## API Endpoint

### New Endpoint
```
PUT /api/jobs/:id/pay-items
```

**Request Body:**
```json
{
  "payItems": [
    {
      "description": "SLPA Bill",
      "amount": 2500.00,
      "billingAmount": 5000.00
    },
    {
      "description": "Transport",
      "amount": 1000.00,
      "billingAmount": 2500.00
    }
  ]
}
```

**Response:**
```json
{
  "jobId": "JOB0007",
  "payItems": [...],
  // ... other job fields
}
```

**Authorization:** Requires Admin, Manager, or Super Admin role

---

## Testing Steps

1. **Restart Backend Server** (REQUIRED)
   ```bash
   cd backend-api
   npm run dev
   ```

2. **Test the Fix**
   - Go to Invoicing section
   - Select a job with settled petty cash
   - Items should load with "Paid By" column
   - Enter billing amounts
   - Click "Save Pay Items"
   - Verify items are saved (check database or refresh page)
   - Click "Save Pay Items" again
   - Verify items are NOT duplicated

3. **Verify in Database**
   ```sql
   SELECT * FROM PayItems WHERE JobId = 'JOB0007'
   ```
   Should show only the latest set of items, not duplicates

---

## Error Resolution

### If you get 404 error:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
PUT http://localhost:5000/api/jobs/JOB0007/pay-items
```

**Cause:** Backend server hasn't loaded the new code

**Solution:** Restart the backend server
```bash
cd backend-api
# Stop current server (Ctrl+C if running in terminal)
npm run dev
```

### If you get 500 error:
- Check backend console for error messages
- Verify database connection
- Check if PayItems table exists

---

## Files Modified

### Backend
1. ✅ `backend-api/src/application/use-cases/job/ReplacePayItems.js` (NEW)
2. ✅ `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js`
3. ✅ `backend-api/src/infrastructure/di/container.js`
4. ✅ `backend-api/src/presentation/controllers/JobController.js`
5. ✅ `backend-api/src/presentation/routes/jobs.js`

### Frontend
1. ✅ `frontend/src/api/services/jobService.js`
2. ✅ `frontend/src/components/Billing.js`

---

## Benefits

1. ✅ **No Duplicates**: Items are replaced, not added
2. ✅ **Atomic Operation**: Transaction ensures data integrity
3. ✅ **Cleaner Code**: Single API call instead of loop
4. ✅ **Better Performance**: One database transaction instead of multiple
5. ✅ **Safer**: Rollback on error prevents partial updates

---

## Status
🔴 **PENDING BACKEND RESTART** - Backend server must be restarted to load new code

After restart:
✅ **READY TO TEST** - Fix is complete and ready for testing
