-- ============================================
-- Safe Customer Address Fix
-- ============================================
-- This script adds missing customer address columns safely
-- with proper existence checks for all operations
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Safe Customer Address Fix';
PRINT '========================================';
PRINT '';

-- Add addressNumber column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    ALTER TABLE Customers ADD addressNumber NVARCHAR(20) DEFAULT '';
    PRINT '✓ Added addressNumber column';
END
ELSE
    PRINT '✓ addressNumber column already exists';

-- Add addressStreet1 column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet1')
BEGIN
    ALTER TABLE Customers ADD addressStreet1 NVARCHAR(200) DEFAULT '';
    PRINT '✓ Added addressStreet1 column';
END
ELSE
    PRINT '✓ addressStreet1 column already exists';

-- Add addressStreet2 column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet2')
BEGIN
    ALTER TABLE Customers ADD addressStreet2 NVARCHAR(200);
    PRINT '✓ Added addressStreet2 column';
END
ELSE
    PRINT '✓ addressStreet2 column already exists';

-- Add addressDistrict column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressDistrict')
BEGIN
    ALTER TABLE Customers ADD addressDistrict NVARCHAR(100) DEFAULT '';
    PRINT '✓ Added addressDistrict column';
END
ELSE
    PRINT '✓ addressDistrict column already exists';

-- Add addressCity column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCity')
BEGIN
    ALTER TABLE Customers ADD addressCity NVARCHAR(100) DEFAULT '';
    PRINT '✓ Added addressCity column';
END
ELSE
    PRINT '✓ addressCity column already exists';

-- Add addressCountry column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCountry')
BEGIN
    ALTER TABLE Customers ADD addressCountry NVARCHAR(100) DEFAULT 'Sri Lanka';
    PRINT '✓ Added addressCountry column';
END
ELSE
    PRINT '✓ addressCountry column already exists';

-- Add officeAddressNumber column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressNumber')
BEGIN
    ALTER TABLE Customers ADD officeAddressNumber NVARCHAR(20);
    PRINT '✓ Added officeAddressNumber column';
END
ELSE
    PRINT '✓ officeAddressNumber column already exists';

-- Add officeAddressStreet1 column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet1')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet1 NVARCHAR(200);
    PRINT '✓ Added officeAddressStreet1 column';
END
ELSE
    PRINT '✓ officeAddressStreet1 column already exists';

-- Add officeAddressStreet2 column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet2')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet2 NVARCHAR(200);
    PRINT '✓ Added officeAddressStreet2 column';
END
ELSE
    PRINT '✓ officeAddressStreet2 column already exists';

-- Add officeAddressDistrict column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressDistrict')
BEGIN
    ALTER TABLE Customers ADD officeAddressDistrict NVARCHAR(100);
    PRINT '✓ Added officeAddressDistrict column';
END
ELSE
    PRINT '✓ officeAddressDistrict column already exists';

-- Add officeAddressCity column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCity')
BEGIN
    ALTER TABLE Customers ADD officeAddressCity NVARCHAR(100);
    PRINT '✓ Added officeAddressCity column';
END
ELSE
    PRINT '✓ officeAddressCity column already exists';

-- Add officeAddressCountry column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCountry')
BEGIN
    ALTER TABLE Customers ADD officeAddressCountry NVARCHAR(100) DEFAULT 'Sri Lanka';
    PRINT '✓ Added officeAddressCountry column';
END
ELSE
    PRINT '✓ officeAddressCountry column already exists';

-- Add isOfficeAddressSame column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'isOfficeAddressSame')
BEGIN
    ALTER TABLE Customers ADD isOfficeAddressSame BIT DEFAULT 0;
    PRINT '✓ Added isOfficeAddressSame column';
END
ELSE
    PRINT '✓ isOfficeAddressSame column already exists';

-- Now update existing records with safe checks
PRINT '';
PRINT 'Updating existing customer records...';

-- Update basic address fields (only if they exist and are empty)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    UPDATE Customers SET addressNumber = '' WHERE addressNumber IS NULL;
    PRINT '✓ Updated addressNumber values';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet1')
BEGIN
    UPDATE Customers SET addressStreet1 = '' WHERE addressStreet1 IS NULL;
    PRINT '✓ Updated addressStreet1 values';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressDistrict')
BEGIN
    UPDATE Customers SET addressDistrict = '' WHERE addressDistrict IS NULL;
    PRINT '✓ Updated addressDistrict values';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCity')
BEGIN
    UPDATE Customers SET addressCity = '' WHERE addressCity IS NULL;
    PRINT '✓ Updated addressCity values';
END

-- Update country fields (only if they exist)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCountry')
BEGIN
    UPDATE Customers SET addressCountry = 'Sri Lanka' WHERE addressCountry IS NULL OR addressCountry = '';
    PRINT '✓ Updated addressCountry values';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCountry')
BEGIN
    UPDATE Customers SET officeAddressCountry = 'Sri Lanka' WHERE officeAddressCountry IS NULL OR officeAddressCountry = '';
    PRINT '✓ Updated officeAddressCountry values';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'isOfficeAddressSame')
BEGIN
    UPDATE Customers SET isOfficeAddressSame = 0 WHERE isOfficeAddressSame IS NULL;
    PRINT '✓ Updated isOfficeAddressSame values';
END

-- Set NOT NULL constraints for required fields (only if they exist and are nullable)
PRINT '';
PRINT 'Setting NOT NULL constraints...';

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
PRINT 'Customer Address System Ready!';
PRINT '========================================';
PRINT '';

-- Show verification
PRINT 'Address columns added to Customers table:';
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
PRINT 'SUCCESS: All customer address columns have been added!';
PRINT 'You can now restart your backend server and test customer creation.';
PRINT '';

GO