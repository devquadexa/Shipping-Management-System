-- ============================================
-- COMPLETE MIGRATION GUIDE
-- Super Shine Cargo Service Management System
-- ============================================
-- This script includes all database changes:
-- 1. Customer Address Structure Update
-- 2. Multi-User Job Assignment System
-- 3. Rename USER role to Waff Clerk
-- 4. Add Paid By tracking to Settlement Items
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'SUPER SHINE CARGO - COMPLETE MIGRATION';
PRINT '============================================';
PRINT '';
PRINT 'This will apply the following changes:';
PRINT '1. Update Customer Address Structure';
PRINT '2. Add Multi-User Job Assignment System';
PRINT '3. Rename USER role to Waff Clerk';
PRINT '4. Add Paid By tracking to Settlement Items';
PRINT '';
PRINT 'Starting migration...';
PRINT '';
GO

-- ============================================
-- PART 1: UPDATE CUSTOMER ADDRESS STRUCTURE
-- ============================================

PRINT '============================================';
PRINT 'PART 1: Customer Address Structure';
PRINT '============================================';
PRINT '';

-- Step 1.1: Add new residential address columns
PRINT 'Step 1.1: Adding residential address columns...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
BEGIN
    ALTER TABLE Customers ADD addressNumber NVARCHAR(50) NULL;
    PRINT '✓ Added addressNumber';
END
ELSE PRINT '⚠ addressNumber already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet1')
BEGIN
    ALTER TABLE Customers ADD addressStreet1 NVARCHAR(200) NULL;
    PRINT '✓ Added addressStreet1';
END
ELSE PRINT '⚠ addressStreet1 already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressStreet2')
BEGIN
    ALTER TABLE Customers ADD addressStreet2 NVARCHAR(200) NULL;
    PRINT '✓ Added addressStreet2';
END
ELSE PRINT '⚠ addressStreet2 already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCity')
BEGIN
    ALTER TABLE Customers ADD addressCity NVARCHAR(100) NULL;
    PRINT '✓ Added addressCity';
END
ELSE PRINT '⚠ addressCity already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressDistrict')
BEGIN
    ALTER TABLE Customers ADD addressDistrict NVARCHAR(100) NULL;
    PRINT '✓ Added addressDistrict';
END
ELSE PRINT '⚠ addressDistrict already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressCountry')
BEGIN
    ALTER TABLE Customers ADD addressCountry NVARCHAR(100) NULL;
    PRINT '✓ Added addressCountry';
END
ELSE PRINT '⚠ addressCountry already exists';

PRINT '';
GO

-- Step 1.2: Add office address columns
PRINT 'Step 1.2: Adding office address columns...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressNumber')
BEGIN
    ALTER TABLE Customers ADD officeAddressNumber NVARCHAR(50) NULL;
    PRINT '✓ Added officeAddressNumber';
END
ELSE PRINT '⚠ officeAddressNumber already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet1')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet1 NVARCHAR(200) NULL;
    PRINT '✓ Added officeAddressStreet1';
END
ELSE PRINT '⚠ officeAddressStreet1 already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressStreet2')
BEGIN
    ALTER TABLE Customers ADD officeAddressStreet2 NVARCHAR(200) NULL;
    PRINT '✓ Added officeAddressStreet2';
END
ELSE PRINT '⚠ officeAddressStreet2 already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCity')
BEGIN
    ALTER TABLE Customers ADD officeAddressCity NVARCHAR(100) NULL;
    PRINT '✓ Added officeAddressCity';
END
ELSE PRINT '⚠ officeAddressCity already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressDistrict')
BEGIN
    ALTER TABLE Customers ADD officeAddressDistrict NVARCHAR(100) NULL;
    PRINT '✓ Added officeAddressDistrict';
END
ELSE PRINT '⚠ officeAddressDistrict already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressCountry')
BEGIN
    ALTER TABLE Customers ADD officeAddressCountry NVARCHAR(100) NULL;
    PRINT '✓ Added officeAddressCountry';
END
ELSE PRINT '⚠ officeAddressCountry already exists';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'sameAsResidential')
BEGIN
    ALTER TABLE Customers ADD sameAsResidential BIT DEFAULT 0;
    PRINT '✓ Added sameAsResidential';
END
ELSE PRINT '⚠ sameAsResidential already exists';

PRINT '';
PRINT '✓ Customer address structure updated';
PRINT '';
GO

-- ============================================
-- PART 2: MULTI-USER JOB ASSIGNMENT SYSTEM
-- ============================================

PRINT '============================================';
PRINT 'PART 2: Multi-User Job Assignment System';
PRINT '============================================';
PRINT '';

-- Step 2.1: Create JobAssignments table
PRINT 'Step 2.1: Creating JobAssignments table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
BEGIN
    CREATE TABLE JobAssignments (
        assignmentId INT IDENTITY(1,1) PRIMARY KEY,
        jobId VARCHAR(50) NOT NULL,
        userId VARCHAR(50) NOT NULL,
        assignedDate DATETIME DEFAULT GETDATE(),
        assignedBy VARCHAR(50) NOT NULL,
        CONSTRAINT FK_JobAssignments_Jobs FOREIGN KEY (jobId) REFERENCES Jobs(jobId),
        CONSTRAINT FK_JobAssignments_Users FOREIGN KEY (userId) REFERENCES Users(userId),
        CONSTRAINT FK_JobAssignments_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(userId),
        CONSTRAINT UQ_JobAssignments_JobUser UNIQUE (jobId, userId)
    );
    PRINT '✓ Created JobAssignments table';
END
ELSE
BEGIN
    PRINT '⚠ JobAssignments table already exists';
END
PRINT '';
GO

-- Step 2.2: Migrate existing job assignments
PRINT 'Step 2.2: Migrating existing job assignments...';

-- Check if there are jobs with assignedTo that aren't in JobAssignments yet
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
BEGIN
    INSERT INTO JobAssignments (jobId, userId, assignedDate, assignedBy)
    SELECT 
        j.jobId,
        j.assignedTo,
        j.assignedDate,
        COALESCE(j.createdBy, 'admin')
    FROM Jobs j
    WHERE j.assignedTo IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM JobAssignments ja 
        WHERE ja.jobId = j.jobId AND ja.userId = j.assignedTo
    );
    
    DECLARE @MigratedCount INT = @@ROWCOUNT;
    PRINT '✓ Migrated ' + CAST(@MigratedCount AS VARCHAR) + ' existing job assignment(s)';
END
PRINT '';
GO

-- Step 2.3: Create stored procedures
PRINT 'Step 2.3: Creating stored procedures...';

-- Procedure: Assign multiple users to a job
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_AssignUsersToJob')
    DROP PROCEDURE sp_AssignUsersToJob;
GO

CREATE PROCEDURE sp_AssignUsersToJob
    @jobId VARCHAR(50),
    @userIds NVARCHAR(MAX), -- Comma-separated user IDs
    @assignedBy VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse comma-separated user IDs and insert
    DECLARE @userId VARCHAR(50);
    DECLARE @pos INT;
    DECLARE @userIdList NVARCHAR(MAX) = @userIds + ',';
    
    WHILE LEN(@userIdList) > 0
    BEGIN
        SET @pos = CHARINDEX(',', @userIdList);
        SET @userId = LTRIM(RTRIM(SUBSTRING(@userIdList, 1, @pos - 1)));
        
        IF LEN(@userId) > 0
        BEGIN
            -- Insert if not already assigned
            IF NOT EXISTS (SELECT 1 FROM JobAssignments WHERE jobId = @jobId AND userId = @userId)
            BEGIN
                INSERT INTO JobAssignments (jobId, userId, assignedBy)
                VALUES (@jobId, @userId, @assignedBy);
            END
        END
        
        SET @userIdList = SUBSTRING(@userIdList, @pos + 1, LEN(@userIdList));
    END
    
    -- Update job's assignedTo to first user (for backward compatibility)
    UPDATE Jobs 
    SET assignedTo = (SELECT TOP 1 userId FROM JobAssignments WHERE jobId = @jobId ORDER BY assignedDate)
    WHERE jobId = @jobId;
END
GO

PRINT '✓ Created sp_AssignUsersToJob';

-- Procedure: Remove user from job
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RemoveUserFromJob')
    DROP PROCEDURE sp_RemoveUserFromJob;
GO

CREATE PROCEDURE sp_RemoveUserFromJob
    @jobId VARCHAR(50),
    @userId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM JobAssignments 
    WHERE jobId = @jobId AND userId = @userId;
    
    -- Update job's assignedTo to remaining user or NULL
    UPDATE Jobs 
    SET assignedTo = (SELECT TOP 1 userId FROM JobAssignments WHERE jobId = @jobId ORDER BY assignedDate)
    WHERE jobId = @jobId;
END
GO

PRINT '✓ Created sp_RemoveUserFromJob';
PRINT '';
GO

-- Step 2.4: Create view
PRINT 'Step 2.4: Creating view...';

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_JobAssignmentSummary')
    DROP VIEW vw_JobAssignmentSummary;
GO

CREATE VIEW vw_JobAssignmentSummary AS
SELECT 
    j.jobId,
    j.customerId,
    j.shipmentCategory,
    j.status,
    j.assignedDate,
    COUNT(ja.userId) as assignedUserCount,
    STRING_AGG(u.fullName, ', ') as assignedUserNames,
    STRING_AGG(ja.userId, ',') as assignedUserIds
FROM Jobs j
LEFT JOIN JobAssignments ja ON j.jobId = ja.jobId
LEFT JOIN Users u ON ja.userId = u.userId
GROUP BY j.jobId, j.customerId, j.shipmentCategory, j.status, j.assignedDate;
GO

PRINT '✓ Created vw_JobAssignmentSummary';
PRINT '';
PRINT '✓ Multi-user job assignment system created';
PRINT '';
GO

-- ============================================
-- PART 3: RENAME USER ROLE TO WAFF CLERK
-- ============================================

PRINT '============================================';
PRINT 'PART 3: Rename USER role to Waff Clerk';
PRINT '============================================';
PRINT '';

-- Step 3.1: Update existing users
PRINT 'Step 3.1: Updating existing USER roles...';

UPDATE Users 
SET role = 'Waff Clerk' 
WHERE role = 'User';

DECLARE @UpdatedUsers INT = @@ROWCOUNT;
PRINT '✓ Updated ' + CAST(@UpdatedUsers AS VARCHAR) + ' user(s) from User to Waff Clerk';
PRINT '';
GO

-- Step 3.2: Update role constraint
PRINT 'Step 3.2: Updating role constraint...';

-- Drop existing constraint
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Users_Role')
BEGIN
    ALTER TABLE Users DROP CONSTRAINT CK_Users_Role;
    PRINT '✓ Dropped old constraint';
END

-- Add new constraint with Waff Clerk
ALTER TABLE Users
ADD CONSTRAINT CK_Users_Role 
CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk'));

PRINT '✓ Added new constraint with Waff Clerk role';
PRINT '';
PRINT '✓ User role renamed to Waff Clerk';
PRINT '';
GO

-- ============================================
-- PART 4: ADD PAID BY TO SETTLEMENT ITEMS
-- ============================================

PRINT '============================================';
PRINT 'PART 4: Add Paid By to Settlement Items';
PRINT '============================================';
PRINT '';

-- Step 4.1: Add paidBy column
PRINT 'Step 4.1: Adding paidBy column...';

IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
               AND name = 'paidBy')
BEGIN
    ALTER TABLE PettyCashSettlementItems 
    ADD paidBy VARCHAR(50) NULL;
    
    PRINT '✓ Added paidBy column to PettyCashSettlementItems';
END
ELSE
BEGIN
    PRINT '⚠ paidBy column already exists';
END
PRINT '';
GO

-- Step 4.2: Update existing records
PRINT 'Step 4.2: Updating existing settlement items...';

UPDATE si
SET si.paidBy = pa.assignedTo
FROM PettyCashSettlementItems si
INNER JOIN PettyCashAssignments pa ON si.assignmentId = pa.assignmentId
WHERE si.paidBy IS NULL;

DECLARE @UpdatedItems INT = @@ROWCOUNT;
PRINT '✓ Updated ' + CAST(@UpdatedItems AS VARCHAR) + ' existing settlement item(s)';
PRINT '';
GO

-- Step 4.3: Add foreign key constraint
PRINT 'Step 4.3: Adding foreign key constraint...';

IF NOT EXISTS (SELECT * FROM sys.foreign_keys 
               WHERE name = 'FK_SettlementItems_Users_PaidBy')
BEGIN
    ALTER TABLE PettyCashSettlementItems
    ADD CONSTRAINT FK_SettlementItems_Users_PaidBy
    FOREIGN KEY (paidBy) REFERENCES Users(userId);
    
    PRINT '✓ Added foreign key constraint FK_SettlementItems_Users_PaidBy';
END
ELSE
BEGIN
    PRINT '⚠ Foreign key constraint already exists';
END
PRINT '';
GO

-- Step 4.4: Create view
PRINT 'Step 4.4: Creating view for settlement items...';

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SettlementItemsWithUsers')
BEGIN
    DROP VIEW vw_SettlementItemsWithUsers;
    PRINT '✓ Dropped existing view';
END

EXEC('
CREATE VIEW vw_SettlementItemsWithUsers AS
SELECT 
    si.settlementItemId,
    si.assignmentId,
    si.itemName,
    si.actualCost,
    si.isCustomItem,
    si.paidBy,
    si.createdDate,
    u.fullName as paidByName,
    u.email as paidByEmail,
    pa.jobId,
    pa.assignedTo,
    pa.assignedAmount,
    pa.status as assignmentStatus
FROM PettyCashSettlementItems si
LEFT JOIN Users u ON si.paidBy = u.userId
INNER JOIN PettyCashAssignments pa ON si.assignmentId = pa.assignmentId
');

PRINT '✓ Created view vw_SettlementItemsWithUsers';
PRINT '';
PRINT '✓ Paid By tracking added to settlement items';
PRINT '';
GO

-- ============================================
-- FINAL VERIFICATION
-- ============================================

PRINT '============================================';
PRINT 'FINAL VERIFICATION';
PRINT '============================================';
PRINT '';

-- Verify Customer Address columns
PRINT 'Customer Address Structure:';
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'addressNumber')
    PRINT '  ✓ Residential address columns exist'
ELSE
    PRINT '  ✗ Residential address columns MISSING';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'officeAddressNumber')
    PRINT '  ✓ Office address columns exist'
ELSE
    PRINT '  ✗ Office address columns MISSING';

PRINT '';

-- Verify JobAssignments
PRINT 'Multi-User Job Assignment:';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
    PRINT '  ✓ JobAssignments table exists'
ELSE
    PRINT '  ✗ JobAssignments table MISSING';

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_AssignUsersToJob')
    PRINT '  ✓ Stored procedures exist'
ELSE
    PRINT '  ✗ Stored procedures MISSING';

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_JobAssignmentSummary')
    PRINT '  ✓ View exists'
ELSE
    PRINT '  ✗ View MISSING';

PRINT '';

-- Verify Waff Clerk role
PRINT 'Waff Clerk Role:';
SELECT @UpdatedUsers = COUNT(*) FROM Users WHERE role = 'Waff Clerk';
PRINT '  ✓ ' + CAST(@UpdatedUsers AS VARCHAR) + ' Waff Clerk user(s) in system';

IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Users_Role')
    PRINT '  ✓ Role constraint updated'
ELSE
    PRINT '  ✗ Role constraint MISSING';

PRINT '';

-- Verify Paid By column
PRINT 'Paid By Tracking:';
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PettyCashSettlementItems') AND name = 'paidBy')
    PRINT '  ✓ paidBy column exists'
ELSE
    PRINT '  ✗ paidBy column MISSING';

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_SettlementItems_Users_PaidBy')
    PRINT '  ✓ Foreign key constraint exists'
ELSE
    PRINT '  ✗ Foreign key constraint MISSING';

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SettlementItemsWithUsers')
    PRINT '  ✓ View exists'
ELSE
    PRINT '  ✗ View MISSING';

PRINT '';
PRINT '============================================';
PRINT 'MIGRATION COMPLETE!';
PRINT '============================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Restart the backend server';
PRINT '2. Test customer address updates';
PRINT '3. Test multi-user job assignments';
PRINT '4. Verify Waff Clerk role displays correctly';
PRINT '5. Test incremental petty cash settlement';
PRINT '';

GO
