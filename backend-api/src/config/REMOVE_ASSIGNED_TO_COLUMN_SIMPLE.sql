-- ============================================
-- REMOVE ASSIGNED_TO COLUMN FROM JOBS TABLE
-- Simple version - directly removes the column
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
    PRINT 'Found assignedTo column.';
    PRINT 'Checking for foreign key constraints...';
    
    -- List all foreign keys on Jobs table
    DECLARE @FKName NVARCHAR(128);
    DECLARE fk_cursor CURSOR FOR
    SELECT name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('Jobs');
    
    OPEN fk_cursor;
    FETCH NEXT FROM fk_cursor INTO @FKName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        PRINT 'Found foreign key: ' + @FKName;
        EXEC ('ALTER TABLE Jobs DROP CONSTRAINT ' + @FKName);
        PRINT '✓ Dropped: ' + @FKName;
        FETCH NEXT FROM fk_cursor INTO @FKName;
    END
    
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;
    
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

GO
