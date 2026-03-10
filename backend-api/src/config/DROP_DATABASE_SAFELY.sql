-- ============================================
-- Drop Database Safely
-- ============================================
-- This script closes all connections and drops the database
-- ============================================

USE master;
GO

PRINT '========================================';
PRINT 'Dropping SuperShineCargoDb Database';
PRINT '========================================';
PRINT '';

-- Step 1: Set database to single user mode to close all connections
PRINT 'Step 1: Closing all connections...';
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'SuperShineCargoDb')
BEGIN
    ALTER DATABASE SuperShineCargoDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    PRINT '✓ All connections closed';
END
GO

-- Step 2: Drop the database
PRINT '';
PRINT 'Step 2: Dropping database...';
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'SuperShineCargoDb')
BEGIN
    DROP DATABASE SuperShineCargoDb;
    PRINT '✓ Database dropped successfully';
END
ELSE
    PRINT '! Database does not exist';
GO

PRINT '';
PRINT '========================================';
PRINT 'Database Dropped Successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Run: COMPLETE_DATABASE_SETUP.sql';
PRINT '2. Update backend-api/.env file';
PRINT '3. Restart backend server';
PRINT '';
GO
