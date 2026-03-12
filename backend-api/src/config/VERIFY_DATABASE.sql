-- ============================================
-- Verify Database Structure
-- ============================================
-- Run this to check what's actually in your database
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Database Structure Verification';
PRINT '========================================';
PRINT '';

-- Check Jobs table structure
PRINT 'Jobs Table Columns:';
PRINT '-------------------';
SELECT 
    COLUMN_NAME as 'Column Name',
    DATA_TYPE as 'Data Type',
    IS_NULLABLE as 'Nullable',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '';

-- Check PayItemTemplates table structure
PRINT 'PayItemTemplates Table Columns:';
PRINT '--------------------------------';
SELECT 
    COLUMN_NAME as 'Column Name',
    DATA_TYPE as 'Data Type',
    IS_NULLABLE as 'Nullable',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'PayItemTemplates'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '';

-- Check Customers table structure
PRINT 'Customers Table Columns:';
PRINT '------------------------';
SELECT 
    COLUMN_NAME as 'Column Name',
    DATA_TYPE as 'Data Type',
    IS_NULLABLE as 'Nullable',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '';

-- Check Users table constraints
PRINT 'Users Table Role Constraint:';
PRINT '----------------------------';
SELECT 
    name as 'Constraint Name',
    definition as 'Definition'
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('Users')
AND definition LIKE '%Role%';

PRINT '';
PRINT '';

-- Count records
PRINT 'Record Counts:';
PRINT '--------------';
SELECT 'PayItemTemplates' as 'Table', COUNT(*) as 'Count' FROM PayItemTemplates
UNION ALL
SELECT 'Users', COUNT(*) FROM Users
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL
SELECT 'Jobs', COUNT(*) FROM Jobs;

PRINT '';
GO
