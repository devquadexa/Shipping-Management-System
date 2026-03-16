-- ============================================
-- SAFELY DROP DATABASE
-- Super Shine Cargo Service Management System
-- ============================================
-- This script will safely drop the database by:
-- 1. Setting database to single user mode
-- 2. Killing all active connections
-- 3. Dropping the database
-- ============================================

-- IMPORTANT: Run this from 'master' database, NOT from SuperShineCargoDb
USE master;
GO

PRINT '============================================';
PRINT 'SAFELY DROPPING SuperShineCargoDb DATABASE';
PRINT '============================================';
PRINT '';

-- Step 1: Check if database exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'SuperShineCargoDb')
BEGIN
    PRINT 'Step 1: Database SuperShineCargoDb found';
    
    -- Step 2: Set database to single user mode (this will close all connections)
    PRINT 'Step 2: Setting database to single user mode...';
    ALTER DATABASE SuperShineCargoDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    PRINT '✓ Database set to single user mode';
    
    -- Step 3: Drop the database
    PRINT 'Step 3: Dropping database...';
    DROP DATABASE SuperShineCargoDb;
    PRINT '✓ Database SuperShineCargoDb dropped successfully';
END
ELSE
BEGIN
    PRINT '⚠ Database SuperShineCargoDb does not exist';
END

PRINT '';
PRINT '============================================';
PRINT 'DATABASE DROP COMPLETE!';
PRINT '============================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Import the .bacpac file using SQL Server Management Studio';
PRINT '2. Or restore from backup file';
PRINT '3. Update connection strings if database name changed';
PRINT '';

GO