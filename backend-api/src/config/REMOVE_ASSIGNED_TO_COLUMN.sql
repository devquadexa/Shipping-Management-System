-- ============================================
-- REMOVE ASSIGNED_TO COLUMN FROM JOBS TABLE
-- This column is now obsolete due to multiple user assignments
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'REMOVING ASSIGNED_TO COLUMN FROM JOBS TABLE';
PRINT '============================================';
PRINT '';

-- Check if assignedTo column exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'assignedTo')
BEGIN
    PRINT 'Found assignedTo column. Checking for foreign key constraints...';
    
    -- Check for foreign key constraints on assignedTo
    DECLARE @FKName NVARCHAR(128);
    SELECT @FKName = name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('Jobs') 
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'assignedTo');
    
    IF @FKName IS NOT NULL
    BEGIN
        PRINT 'Found foreign key constraint: ' + @FKName;
        PRINT 'Dropping foreign key constraint...';
        EXEC ('ALTER TABLE Jobs DROP CONSTRAINT ' + @FKName);
        PRINT '✓ Foreign key constraint dropped';
    END
    ELSE
    BEGIN
        PRINT 'No foreign key constraint found on assignedTo';
    END
    
    PRINT '';
    PRINT 'Dropping assignedTo column...';
    ALTER TABLE Jobs DROP COLUMN assignedTo;
    PRINT '✓ assignedTo column dropped successfully';
END
ELSE
BEGIN
    PRINT '✗ assignedTo column does not exist';
END

PRINT '';
PRINT 'Updated Jobs table columns:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '============================================';
PRINT 'ASSIGNED_TO COLUMN REMOVAL COMPLETE';
PRINT '============================================';
PRINT '';
PRINT 'Note: All user assignments are now stored in the JobAssignments table';
PRINT 'The application will use JobAssignments for all multi-user job assignments';

GO
