-- ============================================
-- Update Customer Address Structure
-- ============================================
-- This script updates the customer table structure according to
-- standard Sri Lankan address format and user requirements
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Updating Customer Address Structure';
PRINT 'Based on Standard Sri Lankan Format';
PRINT '========================================';
PRINT '';

-- ============================================
-- Step 1: Clear existing customer data
-- ============================================
PRINT 'Step 1: Clearing existing customer data...';

-- Delete all existing customers (as requested)
DELETE FROM ContactPersons;
DELETE FROM Customers;
PRINT '✓ Cleared all existing customer data';
GO

-- ============================================
-- Step 2: Drop old address columns
-- ============================================
PRINT '';
PRINT 'Step 2: Dropping old address columns...';

-- Drop foreign key constraints first
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Customers_Cities')
BEGIN
    ALTER TABLE Customers DROP CONSTRAINT FK_Customers_Cities;
    PRINT '✓ Dropped FK_Customers_Cities constraint';
END

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Customers_Districts')
BEGIN
    ALTER TABLE Customers DROP CONSTRAINT FK_Customers_Districts;
    PRINT '✓ Dropped FK_Customers_Districts constraint';
END

-- Drop old columns
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'Address')
BEGIN
    ALTER TABLE Customers DROP COLUMN Address;
    PRINT '✓ Dropped Address column';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'OfficeLocation')
BEGIN
    ALTER TABLE Customers DROP COLUMN OfficeLocation;
    PRINT '✓ Dropped OfficeLocation column';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    ALTER TABLE Customers DROP COLUMN addressNumber;
    PRINT '✓ Dropped addressNumber column';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'streetName')
BEGIN
    ALTER TABLE Customers DROP COLUMN streetName;
    PRINT '✓ Dropped streetName column';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'cityId')
BEGIN
    ALTER TABLE Customers DROP COLUMN cityId;
    PRINT '✓ Dropped cityId column';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'districtId')
BEGIN
    ALTER TABLE Customers DROP COLUMN districtId;
    PRINT '✓ Dropped districtId column';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'IsSameLocation')
BEGIN
    ALTER TABLE Customers DROP COLUMN IsSameLocation;
    PRINT '✓ Dropped IsSameLocation column';
END

GO

-- ============================================
-- Step 3: Add new address columns after Email
-- ============================================
PRINT '';
PRINT 'Step 3: Adding new address columns...';

-- Get the ordinal position of Email column
DECLARE @EmailPosition INT;
SELECT @EmailPosition = ORDINAL_POSITION 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Customers' AND COLUMN_NAME = 'Email';

-- Add new address columns
ALTER TABLE Customers ADD 
    -- Residential Address (Standard Sri Lankan Format)
    addressNumber NVARCHAR(20) NOT NULL DEFAULT '',
    addressStreet1 NVARCHAR(200) NOT NULL DEFAULT '', -- Main street/road name
    addressStreet2 NVARCHAR(200), -- Additional street info (lane, place, etc.)
    addressDistrict NVARCHAR(100) NOT NULL DEFAULT '', -- District (left side)
    addressCity NVARCHAR(100) NOT NULL DEFAULT '', -- City (right side)
    addressCountry NVARCHAR(100) NOT NULL DEFAULT 'Sri Lanka', -- Country with default
    
    -- Office Address (Same structure)
    officeAddressNumber NVARCHAR(20),
    officeAddressStreet1 NVARCHAR(200),
    officeAddressStreet2 NVARCHAR(200),
    officeAddressDistrict NVARCHAR(100), -- District (left side)
    officeAddressCity NVARCHAR(100), -- City (right side)
    officeAddressCountry NVARCHAR(100) DEFAULT 'Sri Lanka', -- Country with default
    
    -- Flag to indicate if office address is same as residential
    isOfficeAddressSame BIT DEFAULT 0;

PRINT '✓ Added new address columns';
PRINT '  - addressNumber (House/Building number)';
PRINT '  - addressStreet1 (Main street/road name)';
PRINT '  - addressStreet2 (Additional street info - optional)';
PRINT '  - addressDistrict (District name - left side)';
PRINT '  - addressCity (City/Town name - right side)';
PRINT '  - addressCountry (Country - defaults to Sri Lanka)';
PRINT '  - Office address fields (same structure)';
PRINT '  - isOfficeAddressSame flag';

GO

-- ============================================
-- Step 4: Update column constraints
-- ============================================
PRINT '';
PRINT 'Step 4: Updating column constraints...';

-- Remove default constraints and make required fields NOT NULL
ALTER TABLE Customers ALTER COLUMN addressNumber NVARCHAR(20) NOT NULL;
ALTER TABLE Customers ALTER COLUMN addressStreet1 NVARCHAR(200) NOT NULL;
ALTER TABLE Customers ALTER COLUMN addressDistrict NVARCHAR(100) NOT NULL;
ALTER TABLE Customers ALTER COLUMN addressCity NVARCHAR(100) NOT NULL;
ALTER TABLE Customers ALTER COLUMN addressCountry NVARCHAR(100) NOT NULL;

PRINT '✓ Updated column constraints';
GO

-- ============================================
-- Step 5: Create indexes for performance
-- ============================================
PRINT '';
PRINT 'Step 5: Creating indexes...';

-- Index on city for filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_AddressCity' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE INDEX IX_Customers_AddressCity ON Customers(addressCity);
    PRINT '✓ Created index on addressCity';
END

-- Index on district for filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_AddressDistrict' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE INDEX IX_Customers_AddressDistrict ON Customers(addressDistrict);
    PRINT '✓ Created index on addressDistrict';
END

GO

-- ============================================
-- Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'Verification';
PRINT '========================================';
PRINT '';

-- Show updated table structure
PRINT 'Updated Customers table structure:';
SELECT 
    COLUMN_NAME as 'Column Name',
    DATA_TYPE as 'Data Type',
    IS_NULLABLE as 'Nullable',
    COLUMN_DEFAULT as 'Default'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT 'Address-related columns:';
SELECT 
    COLUMN_NAME as 'Column Name',
    DATA_TYPE as 'Data Type',
    IS_NULLABLE as 'Nullable'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
AND COLUMN_NAME LIKE '%address%'
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '========================================';
PRINT 'Customer Address Structure Updated!';
PRINT '========================================';
PRINT '';
PRINT 'New Sri Lankan Address Format:';
PRINT '- Address Number: House/Building number (e.g., "45", "123/2A")';
PRINT '- Address Street 1: Main street/road name (e.g., "Galle Road", "Temple Road")';
PRINT '- Address Street 2: Additional info (e.g., "Lane 3", "Near School") - Optional';
PRINT '- Address District: District name (e.g., "Colombo", "Kandy") - LEFT SIDE';
PRINT '- Address City: City/Town name (e.g., "Colombo 03", "Kandy Central") - RIGHT SIDE';
PRINT '- Address Country: Country name (defaults to "Sri Lanka") - THREE COLUMN FORMAT';
PRINT '';
PRINT 'Office Address: Same structure with separate fields';
PRINT 'Office Same Flag: Checkbox to indicate if office = residential';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Update backend Customer entity and repository';
PRINT '2. Update frontend customer form';
PRINT '3. Test with new customer creation';
PRINT '';
GO