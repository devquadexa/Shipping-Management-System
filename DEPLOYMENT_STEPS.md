# Deployment Steps for Bill Column Feature

## Quick Deployment Guide

### Step 1: Database Migration
Run the SQL migration script to add the `hasBill` column:

```bash
# Option 1: Using sqlcmd
sqlcmd -S YOUR_SERVER_NAME -d YOUR_DATABASE_NAME -i backend-api/add-hasbill-column.sql

# Option 2: Using SQL Server Management Studio (SSMS)
# Open backend-api/add-hasbill-column.sql in SSMS and execute it
```

### Step 2: Backend Deployment
No additional steps needed. The backend code changes are already in place:
- Entity updated: `OfficePayItem.js`
- Repository updated: `MSSQLOfficePayItemRepository.js`

Simply restart your backend API server:
```bash
cd backend-api
npm restart
# or
pm2 restart your-api-name
```

### Step 3: Frontend Deployment
No build required if using development mode. For production:

```bash
cd frontend
npm run build
# Deploy the build folder to your web server
```

### Step 4: Verification
1. Open the application in your browser
2. Navigate to Billing section
3. Select a job
4. Verify the "Bill" column appears in the pay items table
5. Test checking/unchecking the checkbox (as Admin/Manager)
6. Save and verify the value persists

## Rollback Plan
If you need to rollback:

### Database Rollback
```sql
-- Remove the hasBill column
ALTER TABLE [dbo].[OfficePayItems]
DROP COLUMN [hasBill];
```

### Code Rollback
Revert the following files to their previous versions:
- `backend-api/src/domain/entities/OfficePayItem.js`
- `backend-api/src/infrastructure/repositories/MSSQLOfficePayItemRepository.js`
- `frontend/src/components/Billing.js`

## Support
If you encounter any issues:
1. Check browser console for JavaScript errors
2. Check backend API logs for server errors
3. Verify database column was added successfully
4. Ensure user has Admin/Manager role to edit checkboxes
