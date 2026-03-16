# Backend Server Restart Required

## Why?
The backend server needs to be restarted to load the new code changes for the pay items duplication fix.

## New Backend Code Added:
1. `ReplacePayItems` use case
2. `replacePayItems()` repository method
3. `replacePayItems()` controller method
4. New route: `PUT /api/jobs/:id/pay-items`

## How to Restart

### Option 1: If running in a terminal
1. Find the terminal where the backend is running
2. Press `Ctrl+C` to stop the server
3. Run: `npm start` or `npm run dev`

### Option 2: If running as a background process
1. Stop the current backend process
2. Navigate to `backend-api` folder
3. Run: `npm start` or `npm run dev`

### Commands:
```bash
cd backend-api
npm run dev
```

## Verify the Server Started
You should see output like:
```
Server running on port 5000
Connected to SQL Server
```

## Test the Fix
After restarting:
1. Go to Invoicing section
2. Select a job with settled petty cash
3. Enter billing amounts
4. Click "Save Pay Items"
5. Verify no duplicates appear
6. You can save multiple times - items should be replaced, not duplicated

## Expected Behavior
- First save: Items are saved correctly
- Second save: Items are REPLACED (old ones deleted, new ones inserted)
- No duplicates no matter how many times you save

## If Still Getting 404 Error
1. Check backend console for any startup errors
2. Verify the server is running on port 5000
3. Check if there are any error messages in the backend logs
4. Verify the route is registered by checking backend startup logs
