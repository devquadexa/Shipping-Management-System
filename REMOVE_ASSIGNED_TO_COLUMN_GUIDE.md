# Remove assignedTo Column from Jobs Table

## Overview
The `assignedTo` column in the Jobs table is now obsolete because we're using the `JobAssignments` table for multiple user assignments. This guide explains how to safely remove it.

## Why Remove It?
- ✅ All user assignments are now stored in the `JobAssignments` table
- ✅ The `assignedTo` column is always NULL for new jobs
- ✅ The code has backward compatibility built in
- ✅ Removing it will clean up the database schema

## What the Code Does
The application code has built-in backward compatibility:
- **New jobs**: Use `JobAssignments` table (assignedTo is NULL)
- **Old jobs**: Can still use `assignedTo` field (legacy support)
- **Job entity**: Has both `assignedTo` (legacy) and `assignedUsers` (new) fields

## How to Remove the Column

### Step 1: Run the Migration Script
**File**: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN.sql`

**Using SQL Server Management Studio:**
1. Open SQL Server Management Studio
2. Connect to: `localhost:53181`
3. Database: `SuperShineCargoDb`
4. Open file: `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN.sql`
5. Click Execute (F5)
6. Wait for completion

**Using Command Line:**
```bash
sqlcmd -S localhost:53181 -U SUPER_SHINE_CARGO -P "Quadexa@123" -d SuperShineCargoDb -i "backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN.sql"
```

### Step 2: Update Backend Code
The backend code has already been updated to NOT insert into the `assignedTo` column:

**File**: `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js`

**Change Made**:
```javascript
// Before
INSERT INTO Jobs (..., assignedTo)
VALUES (..., @assignedTo)

// After
INSERT INTO Jobs (...)
VALUES (...)
```

The `assignedTo` parameter is no longer being passed to the INSERT statement.

### Step 3: Restart Backend
```bash
# Stop current backend (Ctrl+C)
# Start backend
npm start
```

### Step 4: Verify
Check that the column was removed:

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;
```

The `assignedTo` column should NOT appear in the results.

## What Happens to Existing Data?

### Old Jobs (with assignedTo)
- ✅ Still work fine
- ✅ Can still be viewed
- ✅ Can still be updated
- ✅ Can still be assigned to new users via JobAssignments table

### New Jobs (without assignedTo)
- ✅ Created without assignedTo value
- ✅ Users assigned via JobAssignments table
- ✅ Multiple users can be assigned
- ✅ All features work normally

## Code Compatibility

The application code is designed to handle both scenarios:

```javascript
// Job entity - handles both old and new data
getAssignedUserIds() {
  return this.assignedUsers.length > 0 
    ? this.assignedUsers 
    : (this.assignedTo ? [this.assignedTo] : []);
}

// If assignedUsers is populated (new way), use that
// If assignedTo has a value (old way), use that
// If neither, return empty array
```

## Testing After Removal

### Test 1: Create New Job
1. Go to Jobs page
2. Click "+ New Job"
3. Fill in required fields
4. Assign multiple users
5. Click "Create Job"
✅ Job created successfully
✅ Users assigned via JobAssignments table

### Test 2: View Existing Jobs
1. Go to Jobs page
2. View all jobs (old and new)
✅ All jobs display correctly
✅ Assignments show correctly

### Test 3: Settlement Flow
1. Create job with multiple users
2. Assign petty cash
3. Settle items
✅ All features work normally

## Rollback Plan

If issues occur:

### Option 1: Add Column Back
```sql
ALTER TABLE Jobs ADD assignedTo VARCHAR(50);
ALTER TABLE Jobs ADD CONSTRAINT FK_Jobs_Users 
  FOREIGN KEY (assignedTo) REFERENCES Users(userId);
```

### Option 2: Restore from Backup
If you have a database backup, restore it.

## Files Involved

### Database
- `backend-api/src/config/REMOVE_ASSIGNED_TO_COLUMN.sql` - Migration script

### Backend Code
- `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js` - Already updated
- `backend-api/src/domain/entities/Job.js` - Has backward compatibility
- `backend-api/src/presentation/controllers/JobController.js` - Already updated

### Frontend Code
- No changes needed - frontend already uses JobAssignments

## Benefits of Removing the Column

1. **Cleaner Schema**: Removes obsolete column
2. **Consistency**: All assignments use JobAssignments table
3. **Performance**: Slightly smaller table size
4. **Clarity**: No confusion about which column to use
5. **Future-Proof**: Aligns with multi-user assignment design

## Timeline

- Migration script: 1 minute
- Backend restart: 1 minute
- Testing: 5 minutes
- **Total: ~7 minutes**

## Status

✅ Migration script created
✅ Backend code updated
✅ Ready to execute

## Next Steps

1. Run the migration script
2. Restart backend
3. Test job creation
4. Verify all features work

---

**Note**: This is a safe operation. The column is not being used by new jobs, and the code has backward compatibility for old jobs.
