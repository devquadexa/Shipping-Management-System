-- ============================================
-- REMOVE ASSIGNED_TO COLUMN FROM JOBS TABLE
-- Basic version - minimal approach
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
    PRINT 'Attempting to drop column...';
    
    BEGIN TRY
        ALTER TABLE Jobs DROP COLUMN assignedTo;
        PRINT '✓ assignedTo column dropped successfully';
    END TRY
    BEGIN CATCH
        PRINT 'Error dropping column: ' + ERROR_MESSAGE();
        PRINT 'Attempting to drop foreign key first...';
        
        -- Try to drop any foreign key constraints
        DECLARE @FKName NVARCHAR(128);
        SELECT TOP 1 @FKName = name 
        FROM sys.foreign_keys 
        WHERE parent_object_id = OBJECT_ID('Jobs');
        
        IF @FKName IS NOT NULL
        BEGIN
            PRINT 'Found foreign key: ' + @FKName;
            EXEC ('ALTER TABLE Jobs DROP CONSTRAINT ' + @FKName);
            PRINT '✓ Dropped foreign key: ' + @FKName;
            
            -- Try dropping column again
            ALTER TABLE Jobs DROP COLUMN assignedTo;
            PRINT '✓ assignedTo column dropped successfully';
        END
    END CATCH
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
PRINT 'OPERATION COMPLETE';
PRINT '============================================';

GO
