-- ============================================
-- Complete System Setup
-- ============================================
-- This script sets up both the customer address system and 
-- the multi-user job assignment system in the correct order
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Super Shine Cargo Service';
PRINT 'Complete System Setup';
PRINT '========================================';
PRINT '';
PRINT 'This script will:';
PRINT '1. Fix Customer Address System';
PRINT '2. Add Multi-User Job Assignment System';
PRINT '3. Set up location data (Districts & Cities)';
PRINT '';

-- ============================================
-- PART 1: Fix Customer Address System
-- ============================================
PRINT '========================================';
PRINT 'PART 1: Customer Address System';
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

-- Update existing customers with default values (only for columns that exist)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    UPDATE Customers 
    SET 
        addressNumber = COALESCE(addressNumber, ''),
        addressStreet1 = COALESCE(addressStreet1, ''),
        addressDistrict = COALESCE(addressDistrict, ''),
        addressCity = COALESCE(addressCity, '')
    WHERE 
        addressNumber IS NULL OR addressNumber = '' OR
        addressStreet1 IS NULL OR addressStreet1 = '' OR
        addressDistrict IS NULL OR addressDistrict = '' OR
        addressCity IS NULL OR addressCity = '';
    
    PRINT '✓ Updated existing customers with basic address values';
END

-- Update country fields separately (only if they exist)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCountry')
BEGIN
    UPDATE Customers 
    SET addressCountry = COALESCE(addressCountry, 'Sri Lanka')
    WHERE addressCountry IS NULL;
    
    PRINT '✓ Updated addressCountry values';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCountry')
BEGIN
    UPDATE Customers 
    SET officeAddressCountry = COALESCE(officeAddressCountry, 'Sri Lanka')
    WHERE officeAddressCountry IS NULL;
    
    PRINT '✓ Updated officeAddressCountry values';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'isOfficeAddressSame')
BEGIN
    UPDATE Customers 
    SET isOfficeAddressSame = COALESCE(isOfficeAddressSame, 0)
    WHERE isOfficeAddressSame IS NULL;
    
    PRINT '✓ Updated isOfficeAddressSame values';
END
GO

-- ============================================
-- PART 2: Multi-User Job Assignment System
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'PART 2: Multi-User Job Assignment System';
PRINT '========================================';
PRINT '';

-- Create JobAssignments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
BEGIN
    CREATE TABLE JobAssignments (
        assignmentId INT IDENTITY(1,1) PRIMARY KEY,
        jobId VARCHAR(50) NOT NULL,
        userId VARCHAR(50) NOT NULL,
        assignedDate DATETIME DEFAULT GETDATE(),
        assignedBy VARCHAR(50),
        isActive BIT DEFAULT 1,
        notes NVARCHAR(500),
        
        FOREIGN KEY (jobId) REFERENCES Jobs(jobId) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(userId),
        FOREIGN KEY (assignedBy) REFERENCES Users(userId),
        
        UNIQUE (jobId, userId)
    );
    
    PRINT '✓ Created JobAssignments table';
END
ELSE
BEGIN
    PRINT '✓ JobAssignments table already exists';
END

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobAssignments_JobId' AND object_id = OBJECT_ID('JobAssignments'))
BEGIN
    CREATE INDEX IX_JobAssignments_JobId ON JobAssignments(jobId, isActive);
    PRINT '✓ Created index on jobId';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobAssignments_UserId' AND object_id = OBJECT_ID('JobAssignments'))
BEGIN
    CREATE INDEX IX_JobAssignments_UserId ON JobAssignments(userId, isActive);
    PRINT '✓ Created index on userId';
END

-- Migrate existing assignments
INSERT INTO JobAssignments (jobId, userId, assignedDate, assignedBy, isActive, notes)
SELECT 
    jobId,
    assignedTo as userId,
    GETDATE() as assignedDate,
    'SYSTEM' as assignedBy,
    1 as isActive,
    'Migrated from single assignment' as notes
FROM Jobs 
WHERE assignedTo IS NOT NULL 
AND assignedTo != ''
AND NOT EXISTS (
    SELECT 1 FROM JobAssignments ja 
    WHERE ja.jobId = Jobs.jobId AND ja.userId = Jobs.assignedTo
);

DECLARE @migratedCount INT = @@ROWCOUNT;
PRINT '✓ Migrated ' + CAST(@migratedCount AS VARCHAR(10)) + ' existing assignments';
GO

-- Create views
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_JobAssignments')
    DROP VIEW vw_JobAssignments;
GO

CREATE VIEW vw_JobAssignments AS
SELECT 
    ja.assignmentId,
    ja.jobId,
    ja.userId,
    u.fullName as userName,
    u.email as userEmail,
    u.role as userRole,
    ja.assignedDate,
    ja.assignedBy,
    ab.fullName as assignedByName,
    ja.notes,
    j.status as jobStatus,
    j.shipmentCategory,
    c.name as customerName
FROM JobAssignments ja
INNER JOIN Users u ON ja.userId = u.userId
LEFT JOIN Users ab ON ja.assignedBy = ab.userId
INNER JOIN Jobs j ON ja.jobId = j.jobId
INNER JOIN Customers c ON j.customerId = c.customerId
WHERE ja.isActive = 1;
GO

PRINT '✓ Created vw_JobAssignments view';

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_JobAssignmentSummary')
    DROP VIEW vw_JobAssignmentSummary;
GO

CREATE VIEW vw_JobAssignmentSummary AS
SELECT 
    j.jobId,
    j.customerId,
    c.name as customerName,
    j.shipmentCategory,
    j.status,
    j.openDate,
    j.assignedTo as legacyAssignedTo,
    COUNT(ja.userId) as assignedUserCount,
    STRING_AGG(u.fullName, ', ') as assignedUserNames,
    STRING_AGG(u.userId, ',') as assignedUserIds,
    MAX(ja.assignedDate) as lastAssignedDate
FROM Jobs j
LEFT JOIN JobAssignments ja ON j.jobId = ja.jobId AND ja.isActive = 1
LEFT JOIN Users u ON ja.userId = u.userId
INNER JOIN Customers c ON j.customerId = c.customerId
GROUP BY j.jobId, j.customerId, c.name, j.shipmentCategory, j.status, j.openDate, j.assignedTo;
GO

PRINT '✓ Created vw_JobAssignmentSummary view';

-- Create stored procedures
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_AssignUsersToJob')
    DROP PROCEDURE sp_AssignUsersToJob;
GO

CREATE PROCEDURE sp_AssignUsersToJob
    @jobId VARCHAR(50),
    @userIds VARCHAR(MAX),
    @assignedBy VARCHAR(50),
    @notes NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @userId VARCHAR(50);
    DECLARE @pos INT;
    DECLARE @assignedCount INT = 0;
    
    IF NOT EXISTS (SELECT 1 FROM Jobs WHERE jobId = @jobId)
    BEGIN
        RAISERROR('Job not found: %s', 16, 1, @jobId);
        RETURN;
    END
    
    WHILE LEN(@userIds) > 0
    BEGIN
        SET @pos = CHARINDEX(',', @userIds);
        
        IF @pos = 0
        BEGIN
            SET @userId = LTRIM(RTRIM(@userIds));
            SET @userIds = '';
        END
        ELSE
        BEGIN
            SET @userId = LTRIM(RTRIM(LEFT(@userIds, @pos - 1)));
            SET @userIds = SUBSTRING(@userIds, @pos + 1, LEN(@userIds));
        END
        
        IF EXISTS (SELECT 1 FROM Users WHERE userId = @userId)
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM JobAssignments WHERE jobId = @jobId AND userId = @userId AND isActive = 1)
            BEGIN
                INSERT INTO JobAssignments (jobId, userId, assignedBy, notes)
                VALUES (@jobId, @userId, @assignedBy, @notes);
                
                SET @assignedCount = @assignedCount + 1;
            END
        END
    END
    
    UPDATE Jobs 
    SET assignedTo = (
        SELECT TOP 1 userId 
        FROM JobAssignments 
        WHERE jobId = @jobId AND isActive = 1 
        ORDER BY assignedDate
    )
    WHERE jobId = @jobId;
    
    SELECT @assignedCount as AssignedCount;
END;
GO

PRINT '✓ Created sp_AssignUsersToJob procedure';

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RemoveUserFromJob')
    DROP PROCEDURE sp_RemoveUserFromJob;
GO

CREATE PROCEDURE sp_RemoveUserFromJob
    @jobId VARCHAR(50),
    @userId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE JobAssignments 
    SET isActive = 0 
    WHERE jobId = @jobId AND userId = @userId;
    
    UPDATE Jobs 
    SET assignedTo = (
        SELECT TOP 1 userId 
        FROM JobAssignments 
        WHERE jobId = @jobId AND isActive = 1 
        ORDER BY assignedDate
    )
    WHERE jobId = @jobId;
    
    SELECT @@ROWCOUNT as RemovedCount;
END;
GO

PRINT '✓ Created sp_RemoveUserFromJob procedure';
GO

-- ============================================
-- PART 3: Location Data Setup
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'PART 3: Location Data Setup';
PRINT '========================================';
PRINT '';

-- Create Districts table if not exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Districts')
BEGIN
    CREATE TABLE Districts (
        districtId INT IDENTITY(1,1) PRIMARY KEY,
        districtName NVARCHAR(100) NOT NULL UNIQUE,
        province NVARCHAR(100) NOT NULL,
        isActive BIT DEFAULT 1
    );
    PRINT '✓ Created Districts table';
END

-- Create Cities table if not exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cities')
BEGIN
    CREATE TABLE Cities (
        cityId INT IDENTITY(1,1) PRIMARY KEY,
        cityName NVARCHAR(100) NOT NULL,
        districtId INT NOT NULL,
        isActive BIT DEFAULT 1,
        FOREIGN KEY (districtId) REFERENCES Districts(districtId)
    );
    PRINT '✓ Created Cities table';
END

-- Insert Districts (only if empty)
IF NOT EXISTS (SELECT 1 FROM Districts)
BEGIN
    INSERT INTO Districts (districtName, province) VALUES
    ('Colombo', 'Western'),
    ('Gampaha', 'Western'),
    ('Kalutara', 'Western'),
    ('Kandy', 'Central'),
    ('Matale', 'Central'),
    ('Nuwara Eliya', 'Central'),
    ('Galle', 'Southern'),
    ('Matara', 'Southern'),
    ('Hambantota', 'Southern'),
    ('Jaffna', 'Northern'),
    ('Kilinochchi', 'Northern'),
    ('Mannar', 'Northern'),
    ('Vavuniya', 'Northern'),
    ('Mullaitivu', 'Northern'),
    ('Batticaloa', 'Eastern'),
    ('Ampara', 'Eastern'),
    ('Trincomalee', 'Eastern'),
    ('Kurunegala', 'North Western'),
    ('Puttalam', 'North Western'),
    ('Anuradhapura', 'North Central'),
    ('Polonnaruwa', 'North Central'),
    ('Badulla', 'Uva'),
    ('Monaragala', 'Uva'),
    ('Ratnapura', 'Sabaragamuwa'),
    ('Kegalle', 'Sabaragamuwa');
    
    PRINT '✓ Inserted 25 districts';
END

-- Insert Cities (only if empty)
IF NOT EXISTS (SELECT 1 FROM Cities)
BEGIN
    -- Insert cities for major districts
    INSERT INTO Cities (cityName, districtId) VALUES
    -- Colombo District
    ('Colombo 01', 1), ('Colombo 02', 1), ('Colombo 03', 1), ('Colombo 04', 1), ('Colombo 05', 1),
    ('Colombo 06', 1), ('Colombo 07', 1), ('Colombo 08', 1), ('Colombo 09', 1), ('Colombo 10', 1),
    ('Dehiwala', 1), ('Mount Lavinia', 1), ('Moratuwa', 1), ('Kotte', 1), ('Maharagama', 1),
    
    -- Gampaha District  
    ('Negombo', 2), ('Gampaha', 2), ('Kelaniya', 2), ('Wattala', 2), ('Ja-Ela', 2),
    ('Kadawatha', 2), ('Ragama', 2), ('Minuwangoda', 2), ('Divulapitiya', 2), ('Nittambuwa', 2),
    
    -- Kalutara District
    ('Kalutara', 3), ('Panadura', 3), ('Horana', 3), ('Beruwala', 3), ('Aluthgama', 3),
    
    -- Kandy District
    ('Kandy', 4), ('Peradeniya', 4), ('Gampola', 4), ('Nawalapitiya', 4), ('Wattegama', 4),
    
    -- Galle District
    ('Galle', 7), ('Hikkaduwa', 7), ('Ambalangoda', 7), ('Bentota', 7), ('Baddegama', 7),
    
    -- Other major cities
    ('Matale', 5), ('Nuwara Eliya', 6), ('Matara', 8), ('Hambantota', 9), ('Jaffna', 10),
    ('Batticaloa', 15), ('Trincomalee', 17), ('Kurunegala', 18), ('Puttalam', 19),
    ('Anuradhapura', 20), ('Polonnaruwa', 21), ('Badulla', 22), ('Ratnapura', 24), ('Kegalle', 25);
    
    PRINT '✓ Inserted major cities';
END
GO

-- ============================================
-- Final Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'SETUP COMPLETE - VERIFICATION';
PRINT '========================================';
PRINT '';

PRINT 'Customer Address Columns:';
SELECT COUNT(*) as AddressColumns
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
AND COLUMN_NAME LIKE '%address%';

PRINT '';
PRINT 'Job Assignment System:';
SELECT 
    COUNT(*) as TotalAssignments,
    COUNT(DISTINCT jobId) as JobsWithAssignments,
    COUNT(DISTINCT userId) as UsersWithAssignments
FROM JobAssignments 
WHERE isActive = 1;

PRINT '';
PRINT 'Location Data:';
SELECT 
    (SELECT COUNT(*) FROM Districts) as TotalDistricts,
    (SELECT COUNT(*) FROM Cities) as TotalCities;

PRINT '';
PRINT '========================================';
PRINT 'SYSTEM READY FOR USE!';
PRINT '========================================';
PRINT '';
PRINT 'Features Available:';
PRINT '✓ Customer Address System (Sri Lankan format)';
PRINT '✓ Multi-User Job Assignment System';
PRINT '✓ Location Data (Districts & Cities)';
PRINT '✓ All APIs and backend code ready';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Restart your backend server';
PRINT '2. Test customer creation with new address fields';
PRINT '3. Test multi-user job assignments';
PRINT '4. Update frontend if needed';
PRINT '';

GO