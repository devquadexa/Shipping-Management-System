-- Add missing columns to Jobs table for job update functionality
-- These columns are needed for BL Number, CUSDEC Number, LC Number, Container Number, Transporter, and Exporter

USE SuperShineCargoDb;

PRINT 'Adding missing columns to Jobs table...';

-- Add BLNumber column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'BLNumber')
BEGIN
    ALTER TABLE Jobs ADD BLNumber NVARCHAR(100) NULL;
    PRINT '✓ Added BLNumber column to Jobs table';
END
ELSE
BEGIN
    PRINT '- BLNumber column already exists';
END

-- Add CUSDECNumber column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'CUSDECNumber')
BEGIN
    ALTER TABLE Jobs ADD CUSDECNumber NVARCHAR(100) NULL;
    PRINT '✓ Added CUSDECNumber column to Jobs table';
END
ELSE
BEGIN
    PRINT '- CUSDECNumber column already exists';
END

-- Add LCNumber column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'LCNumber')
BEGIN
    ALTER TABLE Jobs ADD LCNumber NVARCHAR(100) NULL;
    PRINT '✓ Added LCNumber column to Jobs table';
END
ELSE
BEGIN
    PRINT '- LCNumber column already exists';
END

-- Add ContainerNumber column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'ContainerNumber')
BEGIN
    ALTER TABLE Jobs ADD ContainerNumber NVARCHAR(100) NULL;
    PRINT '✓ Added ContainerNumber column to Jobs table';
END
ELSE
BEGIN
    PRINT '- ContainerNumber column already exists';
END

-- Add Transporter column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'Transporter')
BEGIN
    ALTER TABLE Jobs ADD Transporter NVARCHAR(200) NULL;
    PRINT '✓ Added Transporter column to Jobs table';
END
ELSE
BEGIN
    PRINT '- Transporter column already exists';
END

-- Add Exporter column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'Exporter')
BEGIN
    ALTER TABLE Jobs ADD Exporter NVARCHAR(200) NULL;
    PRINT '✓ Added Exporter column to Jobs table';
END
ELSE
BEGIN
    PRINT '- Exporter column already exists';
END

PRINT 'Migration completed successfully!';
PRINT 'Jobs table now has all required columns for job updates.';

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Jobs' 
ORDER BY ORDINAL_POSITION;