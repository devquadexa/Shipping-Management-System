-- ============================================
-- FIX JOBS TABLE SCHEMA
-- Add missing columns to Jobs table
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'FIXING JOBS TABLE SCHEMA';
PRINT '============================================';
PRINT '';

-- Check current Jobs table structure
PRINT 'Current Jobs table columns:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- Add missing columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'blNumber')
BEGIN
    ALTER TABLE Jobs ADD blNumber VARCHAR(100);
    PRINT '✓ Added blNumber column';
END
ELSE
BEGIN
    PRINT '✓ blNumber column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'cusdecNumber')
BEGIN
    ALTER TABLE Jobs ADD cusdecNumber VARCHAR(100);
    PRINT '✓ Added cusdecNumber column';
END
ELSE
BEGIN
    PRINT '✓ cusdecNumber column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'exporter')
BEGIN
    ALTER TABLE Jobs ADD exporter VARCHAR(255);
    PRINT '✓ Added exporter column';
END
ELSE
BEGIN
    PRINT '✓ exporter column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'lcNumber')
BEGIN
    ALTER TABLE Jobs ADD lcNumber VARCHAR(100);
    PRINT '✓ Added lcNumber column';
END
ELSE
BEGIN
    PRINT '✓ lcNumber column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'containerNumber')
BEGIN
    ALTER TABLE Jobs ADD containerNumber VARCHAR(100);
    PRINT '✓ Added containerNumber column';
END
ELSE
BEGIN
    PRINT '✓ containerNumber column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'createdDate')
BEGIN
    ALTER TABLE Jobs ADD createdDate DATETIME DEFAULT GETDATE();
    PRINT '✓ Added createdDate column';
END
ELSE
BEGIN
    PRINT '✓ createdDate column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'completedDate')
BEGIN
    ALTER TABLE Jobs ADD completedDate DATETIME;
    PRINT '✓ Added completedDate column';
END
ELSE
BEGIN
    PRINT '✓ completedDate column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'pettyCashStatus')
BEGIN
    ALTER TABLE Jobs ADD pettyCashStatus NVARCHAR(50) DEFAULT 'Not Assigned' 
    CHECK (pettyCashStatus IN ('Not Assigned', 'Assigned', 'Settled'));
    PRINT '✓ Added pettyCashStatus column';
END
ELSE
BEGIN
    PRINT '✓ pettyCashStatus column already exists';
END

PRINT '';
PRINT 'Updated Jobs table columns:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '============================================';
PRINT 'JOBS TABLE SCHEMA FIX COMPLETE';
PRINT '============================================';

GO
