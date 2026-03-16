-- ============================================
-- REMOVE ASSIGNED_TO COLUMN FROM JOBS TABLE
-- Drops index and foreign keys first
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
    PRINT '';
    
    -- Step 1: Drop indexes on assignedTo column
    PRINT 'Step 1: Dropping indexes on assignedTo column...';
    DECLARE @IndexName NVARCHAR(128);
    DECLARE index_cursor CURSOR FOR
    SELECT name 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('Jobs') 
    AND name LIKE '%AssignedTo%';
    
    OPEN index_cursor;
    FETCH NEXT FROM index_cursor INTO @IndexName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        PRINT '  Found index: ' + @IndexName;
        EXEC ('DROP INDEX ' + @IndexName + ' ON Jobs');
        PRINT '  ✓ Dropped index: ' + @IndexName;
        FETCH NEXT FROM index_cursor INTO @IndexName;
    END
    
    CLOSE index_cursor;
    DEALLOCATE index_cursor;
    
    PRINT '';
    
    -- Step 2: Drop foreign keys on assignedTo column
    PRINT 'Step 2: Dropping foreign keys on assignedTo column...';
    DECLARE @FKName NVARCHAR(128);
    DECLARE fk_cursor CURSOR FOR
    SELECT name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('Jobs');
    
    OPEN fk_cursor;
    FETCH NEXT FROM fk_cursor INTO @FKName;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        PRINT '  Found foreign key: ' + @FKName;
        EXEC ('ALTER TABLE Jobs DROP CONSTRAINT ' + @FKName);
        PRINT '  ✓ Dropped foreign key: ' + @FKName;
        FETCH NEXT FROM fk_cursor INTO @FKName;
    END
    
    CLOSE fk_cursor;
    DEALLOCATE fk_cursor;
    
    PRINT '';
    
    -- Step 3: Drop the column
    PRINT 'Step 3: Dropping assignedTo column...';
    ALTER TABLE Jobs DROP COLUMN assignedTo;
    PRINT '✓ assignedTo column dropped successfully';
END
ELSE
BEGIN
    PRINT '✗ assignedTo column does not exist';
END

PRINT '';
PRINT 'Current Jobs table columns:';
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
