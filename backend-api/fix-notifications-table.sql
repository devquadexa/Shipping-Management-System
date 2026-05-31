-- Fix Notifications table - Add missing createdBy column
USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'FIXING NOTIFICATIONS TABLE';
PRINT '========================================';
PRINT '';

-- Check current table structure
PRINT 'Current table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Notifications'
ORDER BY ORDINAL_POSITION;
GO

-- Add createdBy column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Notifications') 
    AND name = 'createdBy'
)
BEGIN
    ALTER TABLE Notifications
    ADD createdBy VARCHAR(50) NULL;
    PRINT '✅ Added createdBy column to Notifications table';
END
ELSE
BEGIN
    PRINT 'ℹ️  createdBy column already exists';
END
GO

-- Verify the fix
PRINT '';
PRINT 'Updated table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Notifications'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '========================================';
PRINT '✅ NOTIFICATIONS TABLE FIXED';
PRINT '========================================';
GO
