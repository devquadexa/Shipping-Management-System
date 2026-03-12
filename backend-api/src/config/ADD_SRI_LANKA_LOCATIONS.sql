-- ============================================
-- Add Sri Lanka Districts and Cities
-- ============================================
-- This script creates tables for Sri Lankan districts and cities
-- and updates customer address structure
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Adding Sri Lanka Location Data';
PRINT '========================================';
PRINT '';

-- ============================================
-- Create Districts Table
-- ============================================
PRINT 'Step 1: Creating Districts table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Districts')
BEGIN
    CREATE TABLE Districts (
        districtId INT IDENTITY(1,1) PRIMARY KEY,
        districtName NVARCHAR(100) NOT NULL UNIQUE,
        province NVARCHAR(50) NOT NULL,
        isActive BIT DEFAULT 1,
        createdDate DATETIME DEFAULT GETDATE()
    );
    PRINT '✓ Created Districts table';
END
ELSE
    PRINT '✓ Districts table already exists';
GO

-- ============================================
-- Create Cities Table
-- ============================================
PRINT '';
PRINT 'Step 2: Creating Cities table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cities')
BEGIN
    CREATE TABLE Cities (
        cityId INT IDENTITY(1,1) PRIMARY KEY,
        cityName NVARCHAR(100) NOT NULL,
        districtId INT NOT NULL,
        isActive BIT DEFAULT 1,
        createdDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (districtId) REFERENCES Districts(districtId)
    );
    PRINT '✓ Created Cities table';
END
ELSE
    PRINT '✓ Cities table already exists';
GO

-- ============================================
-- Insert Districts Data
-- ============================================
PRINT '';
PRINT 'Step 3: Inserting Districts data...';

IF NOT EXISTS (SELECT * FROM Districts WHERE districtName = 'Colombo')
BEGIN
    INSERT INTO Districts (districtName, province) VALUES
    -- Western Province
    ('Colombo', 'Western'),
    ('Gampaha', 'Western'),
    ('Kalutara', 'Western'),
    
    -- Central Province
    ('Kandy', 'Central'),
    ('Matale', 'Central'),
    ('Nuwara Eliya', 'Central'),
    
    -- Southern Province
    ('Galle', 'Southern'),
    ('Matara', 'Southern'),
    ('Hambantota', 'Southern'),
    
    -- Northern Province
    ('Jaffna', 'Northern'),
    ('Kilinochchi', 'Northern'),
    ('Mannar', 'Northern'),
    ('Mullaitivu', 'Northern'),
    ('Vavuniya', 'Northern'),
    
    -- Eastern Province
    ('Batticaloa', 'Eastern'),
    ('Ampara', 'Eastern'),
    ('Trincomalee', 'Eastern'),
    
    -- North Western Province
    ('Kurunegala', 'North Western'),
    ('Puttalam', 'North Western'),
    
    -- North Central Province
    ('Anuradhapura', 'North Central'),
    ('Polonnaruwa', 'North Central'),
    
    -- Uva Province
    ('Badulla', 'Uva'),
    ('Monaragala', 'Uva'),
    
    -- Sabaragamuwa Province
    ('Ratnapura', 'Sabaragamuwa'),
    ('Kegalle', 'Sabaragamuwa');
    
    PRINT '✓ Inserted 25 districts';
END
ELSE
    PRINT '✓ Districts data already exists';
GO

-- ============================================
-- Insert Cities Data
-- ============================================
PRINT '';
PRINT 'Step 4: Inserting Cities data...';

IF NOT EXISTS (SELECT * FROM Cities WHERE cityName = 'Colombo')
BEGIN
    -- Get district IDs for reference
    DECLARE @ColomboId INT = (SELECT districtId FROM Districts WHERE districtName = 'Colombo');
    DECLARE @GampahaId INT = (SELECT districtId FROM Districts WHERE districtName = 'Gampaha');
    DECLARE @KalutaraId INT = (SELECT districtId FROM Districts WHERE districtName = 'Kalutara');
    DECLARE @KandyId INT = (SELECT districtId FROM Districts WHERE districtName = 'Kandy');
    DECLARE @MataleId INT = (SELECT districtId FROM Districts WHERE districtName = 'Matale');
    DECLARE @NuwaraEliyaId INT = (SELECT districtId FROM Districts WHERE districtName = 'Nuwara Eliya');
    DECLARE @GalleId INT = (SELECT districtId FROM Districts WHERE districtName = 'Galle');
    DECLARE @MataraId INT = (SELECT districtId FROM Districts WHERE districtName = 'Matara');
    DECLARE @HambantotaId INT = (SELECT districtId FROM Districts WHERE districtName = 'Hambantota');
    DECLARE @JaffnaId INT = (SELECT districtId FROM Districts WHERE districtName = 'Jaffna');
    DECLARE @KurunegalaId INT = (SELECT districtId FROM Districts WHERE districtName = 'Kurunegala');
    DECLARE @AnuradhapuraId INT = (SELECT districtId FROM Districts WHERE districtName = 'Anuradhapura');
    DECLARE @BatticaloadId INT = (SELECT districtId FROM Districts WHERE districtName = 'Batticaloa');
    DECLARE @RatnapuraId INT = (SELECT districtId FROM Districts WHERE districtName = 'Ratnapura');
    DECLARE @BadullaId INT = (SELECT districtId FROM Districts WHERE districtName = 'Badulla');

    INSERT INTO Cities (cityName, districtId) VALUES
    -- Colombo District
    ('Colombo', @ColomboId),
    ('Dehiwala-Mount Lavinia', @ColomboId),
    ('Moratuwa', @ColomboId),
    ('Sri Jayawardenepura Kotte', @ColomboId),
    ('Maharagama', @ColomboId),
    ('Kesbewa', @ColomboId),
    ('Kaduwela', @ColomboId),
    ('Boralesgamuwa', @ColomboId),
    ('Piliyandala', @ColomboId),
    ('Nugegoda', @ColomboId),
    ('Kotte', @ColomboId),
    ('Rajagiriya', @ColomboId),
    ('Wellawatte', @ColomboId),
    ('Bambalapitiya', @ColomboId),
    ('Pettah', @ColomboId),
    
    -- Gampaha District
    ('Gampaha', @GampahaId),
    ('Negombo', @GampahaId),
    ('Katunayake', @GampahaId),
    ('Wattala', @GampahaId),
    ('Kelaniya', @GampahaId),
    ('Peliyagoda', @GampahaId),
    ('Minuwangoda', @GampahaId),
    ('Ja-Ela', @GampahaId),
    ('Kandana', @GampahaId),
    ('Kiribathgoda', @GampahaId),
    ('Ragama', @GampahaId),
    ('Divulapitiya', @GampahaId),
    ('Nittambuwa', @GampahaId),
    ('Veyangoda', @GampahaId),
    
    -- Kalutara District
    ('Kalutara', @KalutaraId),
    ('Panadura', @KalutaraId),
    ('Horana', @KalutaraId),
    ('Beruwala', @KalutaraId),
    ('Aluthgama', @KalutaraId),
    ('Matugama', @KalutaraId),
    ('Bandaragama', @KalutaraId),
    ('Ingiriya', @KalutaraId),
    
    -- Kandy District
    ('Kandy', @KandyId),
    ('Peradeniya', @KandyId),
    ('Gampola', @KandyId),
    ('Nawalapitiya', @KandyId),
    ('Wattegama', @KandyId),
    ('Hatton', @KandyId),
    ('Kadugannawa', @KandyId),
    
    -- Matale District
    ('Matale', @MataleId),
    ('Dambulla', @MataleId),
    ('Sigiriya', @MataleId),
    ('Galewela', @MataleId),
    
    -- Nuwara Eliya District
    ('Nuwara Eliya', @NuwaraEliyaId),
    ('Hatton', @NuwaraEliyaId),
    ('Talawakele', @NuwaraEliyaId),
    ('Bandarawela', @NuwaraEliyaId),
    
    -- Galle District
    ('Galle', @GalleId),
    ('Hikkaduwa', @GalleId),
    ('Ambalangoda', @GalleId),
    ('Bentota', @GalleId),
    ('Elpitiya', @GalleId),
    ('Baddegama', @GalleId),
    
    -- Matara District
    ('Matara', @MataraId),
    ('Weligama', @MataraId),
    ('Mirissa', @MataraId),
    ('Akuressa', @MataraId),
    ('Hakmana', @MataraId),
    
    -- Hambantota District
    ('Hambantota', @HambantotaId),
    ('Tangalle', @HambantotaId),
    ('Tissamaharama', @HambantotaId),
    
    -- Jaffna District
    ('Jaffna', @JaffnaId),
    ('Chavakachcheri', @JaffnaId),
    ('Point Pedro', @JaffnaId),
    
    -- Kurunegala District
    ('Kurunegala', @KurunegalaId),
    ('Kuliyapitiya', @KurunegalaId),
    ('Narammala', @KurunegalaId),
    ('Wariyapola', @KurunegalaId),
    
    -- Anuradhapura District
    ('Anuradhapura', @AnuradhapuraId),
    ('Kekirawa', @AnuradhapuraId),
    ('Thambuttegama', @AnuradhapuraId),
    
    -- Batticaloa District
    ('Batticaloa', @BatticaloadId),
    ('Kalmunai', @BatticaloadId),
    
    -- Ratnapura District
    ('Ratnapura', @RatnapuraId),
    ('Embilipitiya', @RatnapuraId),
    ('Balangoda', @RatnapuraId),
    
    -- Badulla District
    ('Badulla', @BadullaId),
    ('Bandarawela', @BadullaId),
    ('Ella', @BadullaId),
    ('Haputale', @BadullaId),
    ('Welimada', @BadullaId);
    
    PRINT '✓ Inserted major cities and towns';
END
ELSE
    PRINT '✓ Cities data already exists';
GO

-- ============================================
-- Update Customers Table Structure
-- ============================================
PRINT '';
PRINT 'Step 5: Updating Customers table structure...';

-- Add new address fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    ALTER TABLE Customers ADD addressNumber NVARCHAR(20);
    PRINT '✓ Added addressNumber column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'streetName')
BEGIN
    ALTER TABLE Customers ADD streetName NVARCHAR(200);
    PRINT '✓ Added streetName column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'cityId')
BEGIN
    ALTER TABLE Customers ADD cityId INT;
    PRINT '✓ Added cityId column';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'districtId')
BEGIN
    ALTER TABLE Customers ADD districtId INT;
    PRINT '✓ Added districtId column';
END

-- Add foreign keys
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Customers_Cities')
BEGIN
    ALTER TABLE Customers ADD CONSTRAINT FK_Customers_Cities
    FOREIGN KEY (cityId) REFERENCES Cities(cityId);
    PRINT '✓ Added foreign key to Cities';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Customers_Districts')
BEGIN
    ALTER TABLE Customers ADD CONSTRAINT FK_Customers_Districts
    FOREIGN KEY (districtId) REFERENCES Districts(districtId);
    PRINT '✓ Added foreign key to Districts';
END

-- Add indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Cities_DistrictId' AND object_id = OBJECT_ID('Cities'))
BEGIN
    CREATE INDEX IX_Cities_DistrictId ON Cities(districtId);
    PRINT '✓ Created index on Cities.districtId';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_CityId' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE INDEX IX_Customers_CityId ON Customers(cityId);
    PRINT '✓ Created index on Customers.cityId';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_DistrictId' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE INDEX IX_Customers_DistrictId ON Customers(districtId);
    PRINT '✓ Created index on Customers.districtId';
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

-- Count records
PRINT 'Record Counts:';
PRINT '--------------';
SELECT 'Districts' as 'Table', COUNT(*) as 'Records' FROM Districts
UNION ALL
SELECT 'Cities', COUNT(*) FROM Cities;

PRINT '';

-- Show sample data
PRINT 'Sample Districts:';
SELECT TOP 5 districtName, province FROM Districts ORDER BY districtName;

PRINT '';
PRINT 'Sample Cities (Colombo District):';
SELECT TOP 10 c.cityName, d.districtName 
FROM Cities c 
JOIN Districts d ON c.districtId = d.districtId 
WHERE d.districtName = 'Colombo'
ORDER BY c.cityName;

PRINT '';
PRINT 'Customer Table Structure:';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
AND COLUMN_NAME IN ('address', 'addressNumber', 'streetName', 'cityId', 'districtId')
ORDER BY ORDINAL_POSITION;

PRINT '';
PRINT '========================================';
PRINT 'Sri Lanka Location Data Added Successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Update backend API to include location endpoints';
PRINT '2. Update frontend customer form with dropdowns';
PRINT '3. Test the new address structure';
PRINT '';
GO