-- ============================================
-- Simple Customer Address Fix
-- ============================================
-- This script adds missing customer address columns one by one
-- and handles updates safely
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Simple Customer Address Fix';
PRINT '========================================';
PRINT '';

-- Add columns one by one with proper error handling

-- Residential Address Columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    ALTER TABLE Customers ADD addressNumber NVARCHAR(20) DEFAULT '';
    PRINT '✓ Added addressNumber column';
    
    -- Update existing records
    UPDATE Customers SET addressNumber = '' WHERE addressNumber IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE Customers ALTER COLUMN addressNumber NVARCHAR(20) NOT NULL;
    PRINT '✓ Made addressNumber NOT NULL';
END
ELSE
    PRINT '✓ addressNumber column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet1')
BEGIN
    ALTER TABLE Customers ADD addressStreet1 NVARCHAR(200) DEFAULT '';
    PRINT '✓ Added addressStreet1 column';
    
    -- Update existing records
    UPDATE Customers SET addressStreet1 = '' WHERE addressStreet1 IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE Customers ALTER COLUMN addressStreet1 NVARCHAR(200) NOT NULL;
    PRINT '✓ Made addressStreet1 NOT NULL';
END
ELSE
    PRINT '✓ addressStreet1 column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet2')
BEGIN
    ALTER TABLE Customers ADD addressStreet2 NVARCHAR(200);
    PRINT '✓ Added addressStreet2 column';
END
ELSE
    PRINT '✓ addressStreet2 column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressDistrict')
BEGIN
    ALTER TABLE Customers ADD addressDistrict NVARCHAR(100) DEFAULT '';
    PRINT '✓ Added addressDistrict column';
    
    -- Update existing records
    UPDATE Customers SET addressDistrict = '' WHERE addressDistrict IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE Customers ALTER COLUMN addressDistrict NVARCHAR(100) NOT NULL;
    PRINT '✓ Made addressDistrict NOT NULL';
END
ELSE
    PRINT '✓ addressDistrict column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCity')
BEGIN
    ALTER TABLE Customers ADD addressCity NVARCHAR(100) DEFAULT '';
    PRINT '✓ Added addressCity column';
    
    -- Update existing records
    UPDATE Customers SET addressCity = '' WHERE addressCity IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE Customers ALTER COLUMN addressCity NVARCHAR(100) NOT NULL;
    PRINT '✓ Made addressCity NOT NULL';
END
ELSE
    PRINT '✓ addressCity column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCountry')
BEGIN
    ALTER TABLE Customers ADD addressCountry NVARCHAR(100) DEFAULT 'Sri Lanka';
    PRINT '✓ Added addressCountry column';
    
    -- Update existing records
    UPDATE Customers SET addressCountry = 'Sri Lanka' WHERE addressCountry IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE Customers ALTER COLUMN addressCountry NVARCHAR(100) NOT NULL;
    PRINT '✓ Made addressCountry NOT NULL';
END
ELSE
    PRINT '✓ addressCountry column already exists';

-- Office Address Columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressNumber')
BEGIN
    ALTER TABLE Customers ADD officeAddressNumber NVARCHAR(20);
    PRINT '✓ Added officeAddressNumber column';
END
ELSE
    PRINT '✓ officeAddressNumber column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet1')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet1 NVARCHAR(200);
    PRINT '✓ Added officeAddressStreet1 column';
END
ELSE
    PRINT '✓ officeAddressStreet1 column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet2')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet2 NVARCHAR(200);
    PRINT '✓ Added officeAddressStreet2 column';
END
ELSE
    PRINT '✓ officeAddressStreet2 column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressDistrict')
BEGIN
    ALTER TABLE Customers ADD officeAddressDistrict NVARCHAR(100);
    PRINT '✓ Added officeAddressDistrict column';
END
ELSE
    PRINT '✓ officeAddressDistrict column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCity')
BEGIN
    ALTER TABLE Customers ADD officeAddressCity NVARCHAR(100);
    PRINT '✓ Added officeAddressCity column';
END
ELSE
    PRINT '✓ officeAddressCity column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCountry')
BEGIN
    ALTER TABLE Customers ADD officeAddressCountry NVARCHAR(100) DEFAULT 'Sri Lanka';
    PRINT '✓ Added officeAddressCountry column';
    
    -- Update existing records
    UPDATE Customers SET officeAddressCountry = 'Sri Lanka' WHERE officeAddressCountry IS NULL;
    PRINT '✓ Updated officeAddressCountry values';
END
ELSE
    PRINT '✓ officeAddressCountry column already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'isOfficeAddressSame')
BEGIN
    ALTER TABLE Customers ADD isOfficeAddressSame BIT DEFAULT 0;
    PRINT '✓ Added isOfficeAddressSame column';
    
    -- Update existing records
    UPDATE Customers SET isOfficeAddressSame = 0 WHERE isOfficeAddressSame IS NULL;
    PRINT '✓ Updated isOfficeAddressSame values';
END
ELSE
    PRINT '✓ isOfficeAddressSame column already exists';

PRINT '';
PRINT '========================================';
PRINT 'Customer Address Columns Added!';
PRINT '========================================';
PRINT '';

-- Show current address columns
PRINT 'Current address columns in Customers table:';
SELECT 
    COLUMN_NAME as 'Column Name',
    DATA_TYPE as 'Data Type',
    IS_NULLABLE as 'Nullable',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
AND (COLUMN_NAME LIKE '%address%' OR COLUMN_NAME = 'isOfficeAddressSame')
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT 'Customer address system is now ready!';
PRINT 'You can restart your backend server and test customer creation.';
PRINT '';

GO