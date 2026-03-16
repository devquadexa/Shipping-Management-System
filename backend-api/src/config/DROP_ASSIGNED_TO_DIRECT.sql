-- ============================================
-- REMOVE ASSIGNED_TO COLUMN FROM JOBS TABLE
-- Direct approach - drop index by name
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'REMOVING ASSIGNED_TO COLUMN FROM JOBS TABLE';
PRINT '============================================';
PRINT '';

-- Step 1: Drop the index directly
PRINT 'Step 1: Dropping index IX_Jobs_AssignedTo...';
BEGIN TRY
    DROP INDEX IX_Jobs_AssignedTo ON Jobs;
    PRINT '✓ Index dropped successfully';
END TRY
BEGIN CATCH
    PRINT 'Note: Index not found or already dropped';
END CATCH

PRINT '';

-- Step 2: Drop any foreign keys
PRINT 'Step 2: Dropping foreign keys...';
BEGIN TRY
    ALTER TABLE Jobs DROP CONSTRAINT FK_Jobs_Users;
    PRINT '✓ Foreign key FK_Jobs_Users dropped';
END TRY
BEGIN CATCH
    PRINT 'Note: Foreign key not found or already dropped';
END CATCH

PRINT '';

-- Step 3: Drop the column
PRINT 'Step 3: Dropping assignedTo column...';
BEGIN TRY
    ALTER TABLE Jobs DROP COLUMN assignedTo;
    PRINT '✓ assignedTo column dropped successfully';
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE();
END CATCH

PRINT '';
PRINT 'Current Jobs table columns:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '============================================';
PRINT 'OPERATION COMPLETE';
PRINT '============================================';

GO
