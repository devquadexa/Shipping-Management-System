-- ============================================
-- Fix Customer Address Columns
-- ============================================
-- This script adds missing customer address columns if they don't exist
-- Run this if you get "Invalid column name" errors for address fields
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Fixing Customer Address Columns';
PRINT '========================================';
PRINT '';

-- Check and add residential address columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    ALTER TABLE Customers ADD addressNumber NVARCHAR(20) DEFAULT '';
    PRINT '✓ Added addressNumber column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet1')
BEGIN
    ALTER TABLE Customers ADD addressStreet1 NVARCHAR(200) DEFAULT '';
    PRINT '✓ Added addressStreet1 column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet2')
BEGIN
    ALTER TABLE Customers ADD addressStreet2 NVARCHAR(200);
    PRINT '✓ Added addressStreet2 column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressDistrict')
BEGIN
    ALTER TABLE Customers ADD addressDistrict NVARCHAR(100) DEFAULT '';
    PRINT '✓ Added addressDistrict column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCity')
BEGIN
    ALTER TABLE Customers ADD addressCity NVARCHAR(100) DEFAULT '';
    PRINT '✓ Added addressCity column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCountry')
BEGIN
    ALTER TABLE Customers ADD addressCountry NVARCHAR(100) DEFAULT 'Sri Lanka';
    PRINT '✓ Added addressCountry column';
END

-- Check and add office address columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressNumber')
BEGIN
    ALTER TABLE Customers ADD officeAddressNumber NVARCHAR(20);
    PRINT '✓ Added officeAddressNumber column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet1')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet1 NVARCHAR(200);
    PRINT '✓ Added officeAddressStreet1 column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet2')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet2 NVARCHAR(200);
    PRINT '✓ Added officeAddressStreet2 column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressDistrict')
BEGIN
    ALTER TABLE Customers ADD officeAddressDistrict NVARCHAR(100);
    PRINT '✓ Added officeAddressDistrict column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCity')
BEGIN
    ALTER TABLE Customers ADD officeAddressCity NVARCHAR(100);
    PRINT '✓ Added officeAddressCity column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCountry')
BEGIN
    ALTER TABLE Customers ADD officeAddressCountry NVARCHAR(100) DEFAULT 'Sri Lanka';
    PRINT '✓ Added officeAddressCountry column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'isOfficeAddressSame')
BEGIN
    ALTER TABLE Customers ADD isOfficeAddressSame BIT DEFAULT 0;
    PRINT '✓ Added isOfficeAddressSame column';
END

-- Update existing customers with default values for required fields
UPDATE Customers 
SET 
    addressNumber = COALESCE(addressNumber, ''),
    addressStreet1 = COALESCE(addressStreet1, ''),
    addressDistrict = COALESCE(addressDistrict, ''),
    addressCity = COALESCE(addressCity, ''),
    addressCountry = COALESCE(addressCountry, 'Sri Lanka'),
    officeAddressCountry = COALESCE(officeAddressCountry, 'Sri Lanka'),
    isOfficeAddressSame = COALESCE(isOfficeAddressSame, 0)
WHERE 
    addressNumber IS NULL OR addressNumber = '' OR
    addressStreet1 IS NULL OR addressStreet1 = '' OR
    addressDistrict IS NULL OR addressDistrict = '' OR
    addressCity IS NULL OR addressCity = '' OR
    addressCountry IS NULL OR
    officeAddressCountry IS NULL OR
    isOfficeAddressSame IS NULL;

PRINT '✓ Updated existing customers with default address values';

-- Make required fields NOT NULL
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber' AND is_nullable = 1)
BEGIN
    ALTER TABLE Customers ALTER COLUMN addressNumber NVARCHAR(20) NOT NULL;
    PRINT '✓ Made addressNumber NOT NULL';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet1' AND is_nullable = 1)
BEGIN
    ALTER TABLE Customers ALTER COLUMN addressStreet1 NVARCHAR(200) NOT NULL;
    PRINT '✓ Made addressStreet1 NOT NULL';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressDistrict' AND is_nullable = 1)
BEGIN
    ALTER TABLE Customers ALTER COLUMN addressDistrict NVARCHAR(100) NOT NULL;
    PRINT '✓ Made addressDistrict NOT NULL';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCity' AND is_nullable = 1)
BEGIN
    ALTER TABLE Customers ALTER COLUMN addressCity NVARCHAR(100) NOT NULL;
    PRINT '✓ Made addressCity NOT NULL';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCountry' AND is_nullable = 1)
BEGIN
    ALTER TABLE Customers ALTER COLUMN addressCountry NVARCHAR(100) NOT NULL;
    PRINT '✓ Made addressCountry NOT NULL';
END

PRINT '';
PRINT '========================================';
PRINT 'Customer Address Columns Fixed!';
PRINT '========================================';
PRINT '';
PRINT 'Current Customers table structure:';
SELECT 
    COLUMN_NAME as 'Column Name',
    DATA_TYPE as 'Data Type',
    IS_NULLABLE as 'Nullable',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
AND COLUMN_NAME LIKE '%address%'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT 'You can now create customers with the new address system!';
PRINT '';

GO