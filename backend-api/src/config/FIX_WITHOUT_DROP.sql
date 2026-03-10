-- ============================================
-- Fix Database WITHOUT Dropping Tables
-- ============================================
-- This script fixes issues by modifying existing tables
-- and creating missing tables one by one
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Fixing Database Without Dropping Tables';
PRINT '========================================';
PRINT '';

-- ============================================
-- STEP 1: Fix Users Table Constraint
-- ============================================
PRINT 'Step 1: Fixing Users table constraint...';

-- Drop old constraint
DECLARE @OldConstraint NVARCHAR(200);
SELECT @OldConstraint = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('Users') 
AND definition LIKE '%Role%';

IF @OldConstraint IS NOT NULL
BEGIN
    DECLARE @DropSQL NVARCHAR(500);
    SET @DropSQL = 'ALTER TABLE Users DROP CONSTRAINT ' + @OldConstraint;
    EXEC sp_executesql @DropSQL;
    PRINT '✓ Dropped old constraint: ' + @OldConstraint;
END

-- Add new constraint
ALTER TABLE Users ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'User'));
PRINT '✓ Added new constraint with Manager role';
PRINT '';
GO

-- ============================================
-- STEP 2: Fix Customers Table - Add creditPeriodDays
-- ============================================
PRINT 'Step 2: Adding creditPeriodDays to Customers...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'creditPeriodDays')
BEGIN
    ALTER TABLE Customers ADD creditPeriodDays INT DEFAULT 30;
    PRINT '✓ Added creditPeriodDays column';
END
ELSE
    PRINT '✓ creditPeriodDays already exists';
PRINT '';
GO

-- ============================================
-- STEP 3: Fix PayItemTemplates Table Structure
-- ============================================
PRINT 'Step 3: Fixing PayItemTemplates table structure...';
PRINT 'This will rename/modify columns to match correct structure';
PRINT '';

-- Check current structure
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'Description')
BEGIN
    -- Rename Description to itemName
    EXEC sp_rename 'PayItemTemplates.Description', 'itemName', 'COLUMN';
    PRINT '✓ Renamed Description to itemName';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'DefaultAmount')
BEGIN
    -- Rename DefaultAmount to defaultCost
    EXEC sp_rename 'PayItemTemplates.DefaultAmount', 'defaultCost', 'COLUMN';
    PRINT '✓ Renamed DefaultAmount to defaultCost';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'TemplateId')
BEGIN
    -- Rename TemplateId to templateId (lowercase)
    EXEC sp_rename 'PayItemTemplates.TemplateId', 'templateId', 'COLUMN';
    PRINT '✓ Renamed TemplateId to templateId';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'IsActive')
BEGIN
    -- Rename IsActive to isActive (lowercase)
    EXEC sp_rename 'PayItemTemplates.IsActive', 'isActive', 'COLUMN';
    PRINT '✓ Renamed IsActive to isActive';
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'CreatedDate')
BEGIN
    -- Rename CreatedDate to createdDate (lowercase)
    EXEC sp_rename 'PayItemTemplates.CreatedDate', 'createdDate', 'COLUMN';
    PRINT '✓ Renamed CreatedDate to createdDate';
END

-- Add category column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'category')
BEGIN
    ALTER TABLE PayItemTemplates ADD category NVARCHAR(100) NOT NULL DEFAULT 'General';
    PRINT '✓ Added category column';
END
ELSE
    PRINT '✓ category column already exists';

-- Delete old data and insert correct data
DELETE FROM PayItemTemplates;
PRINT '✓ Cleared old data';

-- Insert correct sample data
INSERT INTO PayItemTemplates (itemName, category, defaultCost) VALUES
('Fuel Cost', 'Air Freight', 5000.00),
('Handling Charges', 'Air Freight', 2000.00),
('Documentation Fee', 'Air Freight', 1500.00),
('Port Charges', 'Sea Freight', 8000.00),
('Container Fee', 'Sea Freight', 15000.00),
('Customs Clearance', 'Sea Freight', 3000.00),
('Transport Fee', 'Land Transport', 4000.00),
('Loading/Unloading', 'Land Transport', 2500.00),
('Express Handling', 'Express Delivery', 3500.00),
('Storage Fee', 'Warehousing', 5000.00);
PRINT '✓ Inserted 10 sample templates';
PRINT '';
GO

-- ============================================
-- STEP 4: Fix Jobs Table - Add pettyCashStatus
-- ============================================
PRINT 'Step 4: Adding pettyCashStatus to Jobs table...';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'pettyCashStatus')
BEGIN
    ALTER TABLE Jobs ADD pettyCashStatus NVARCHAR(50) NULL;
    PRINT '✓ Added pettyCashStatus column';
    
    -- Update existing jobs
    UPDATE Jobs SET pettyCashStatus = 'Not Assigned';
    PRINT '✓ Updated existing jobs';
    
    -- Make it NOT NULL
    ALTER TABLE Jobs ALTER COLUMN pettyCashStatus NVARCHAR(50) NOT NULL;
    
    -- Add default constraint
    ALTER TABLE Jobs ADD CONSTRAINT DF_Jobs_PettyCashStatus DEFAULT 'Not Assigned' FOR pettyCashStatus;
    PRINT '✓ Added default constraint';
    
    -- Add check constraint
    ALTER TABLE Jobs ADD CONSTRAINT CK_Jobs_PettyCashStatus 
    CHECK (pettyCashStatus IN ('Not Assigned', 'Assigned', 'Settled'));
    PRINT '✓ Added check constraint';
END
ELSE
    PRINT '✓ pettyCashStatus already exists';
PRINT '';
GO

-- ============================================
-- STEP 5: Create Categories Table
-- ============================================
PRINT 'Step 5: Creating Categories table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        categoryId INT IDENTITY(1,1) PRIMARY KEY,
        categoryName NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500),
        isActive BIT DEFAULT 1,
        createdDate DATETIME DEFAULT GETDATE()
    );
    PRINT '✓ Created Categories table';
    
    -- Insert default categories
    INSERT INTO Categories (categoryName, description) VALUES
    ('Air Freight', 'Air cargo shipments'),
    ('Sea Freight', 'Ocean cargo shipments'),
    ('Land Transport', 'Road transportation'),
    ('Express Delivery', 'Fast delivery services'),
    ('Warehousing', 'Storage and warehousing');
    PRINT '✓ Inserted 5 default categories';
END
ELSE
    PRINT '✓ Categories table already exists';
PRINT '';
GO

-- ============================================
-- STEP 6: Create ContactPersons Table
-- ============================================
PRINT 'Step 6: Creating ContactPersons table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactPersons')
BEGIN
    CREATE TABLE ContactPersons (
        contactPersonId INT IDENTITY(1,1) PRIMARY KEY,
        customerId VARCHAR(50) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        designation NVARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        isPrimary BIT DEFAULT 0,
        isActive BIT DEFAULT 1,
        createdDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (customerId) REFERENCES Customers(customerId) ON DELETE CASCADE
    );
    PRINT '✓ Created ContactPersons table';
END
ELSE
    PRINT '✓ ContactPersons table already exists';
PRINT '';
GO

-- ============================================
-- STEP 7: Create Bills Table
-- ============================================
PRINT 'Step 7: Creating Bills table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Bills')
BEGIN
    CREATE TABLE Bills (
        billId INT IDENTITY(1,1) PRIMARY KEY,
        jobId VARCHAR(50) NOT NULL,
        billingAmount DECIMAL(18,2) NOT NULL,
        paymentStatus NVARCHAR(50) DEFAULT 'Pending Payment' CHECK (paymentStatus IN ('Pending Payment', 'Paid', 'Overdue')),
        invoiceDate DATETIME DEFAULT GETDATE(),
        dueDate DATETIME,
        isOverdue BIT DEFAULT 0,
        paidDate DATETIME,
        notes NVARCHAR(MAX),
        createdDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (jobId) REFERENCES Jobs(jobId)
    );
    PRINT '✓ Created Bills table';
END
ELSE
BEGIN
    PRINT '✓ Bills table already exists';
    
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'invoiceDate')
    BEGIN
        ALTER TABLE Bills ADD invoiceDate DATETIME DEFAULT GETDATE();
        PRINT '✓ Added invoiceDate column';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'dueDate')
    BEGIN
        ALTER TABLE Bills ADD dueDate DATETIME;
        PRINT '✓ Added dueDate column';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'isOverdue')
    BEGIN
        ALTER TABLE Bills ADD isOverdue BIT DEFAULT 0;
        PRINT '✓ Added isOverdue column';
    END
END
PRINT '';
GO

-- ============================================
-- STEP 8: Create PettyCashEntries Table
-- ============================================
PRINT 'Step 8: Creating PettyCashEntries table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCashEntries')
BEGIN
    CREATE TABLE PettyCashEntries (
        entryId INT IDENTITY(1,1) PRIMARY KEY,
        entryType NVARCHAR(20) NOT NULL CHECK (entryType IN ('Deposit', 'Withdrawal')),
        amount DECIMAL(18,2) NOT NULL,
        description NVARCHAR(500),
        entryDate DATETIME DEFAULT GETDATE(),
        createdBy VARCHAR(50),
        FOREIGN KEY (createdBy) REFERENCES Users(userId)
    );
    PRINT '✓ Created PettyCashEntries table';
END
ELSE
    PRINT '✓ PettyCashEntries table already exists';
PRINT '';
GO

-- ============================================
-- STEP 9: Create PettyCashAssignments Table
-- ============================================
PRINT 'Step 9: Creating PettyCashAssignments table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCashAssignments')
BEGIN
    CREATE TABLE PettyCashAssignments (
        assignmentId INT IDENTITY(1,1) PRIMARY KEY,
        jobId VARCHAR(50) NOT NULL,
        assignedTo VARCHAR(50) NOT NULL,
        assignedBy VARCHAR(50) NOT NULL,
        assignedAmount DECIMAL(18,2) NOT NULL,
        actualSpent DECIMAL(18,2),
        balanceAmount DECIMAL(18,2),
        overAmount DECIMAL(18,2),
        status NVARCHAR(50) DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Settled', 'Returned', 'Paid')),
        assignedDate DATETIME DEFAULT GETDATE(),
        settlementDate DATETIME,
        notes NVARCHAR(MAX),
        FOREIGN KEY (jobId) REFERENCES Jobs(jobId),
        FOREIGN KEY (assignedTo) REFERENCES Users(userId),
        FOREIGN KEY (assignedBy) REFERENCES Users(userId)
    );
    PRINT '✓ Created PettyCashAssignments table';
END
ELSE
    PRINT '✓ PettyCashAssignments table already exists';
PRINT '';
GO

-- ============================================
-- STEP 10: Create PettyCashSettlementItems Table
-- ============================================
PRINT 'Step 10: Creating PettyCashSettlementItems table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCashSettlementItems')
BEGIN
    CREATE TABLE PettyCashSettlementItems (
        settlementItemId INT IDENTITY(1,1) PRIMARY KEY,
        assignmentId INT NOT NULL,
        itemName NVARCHAR(200) NOT NULL,
        actualCost DECIMAL(18,2) NOT NULL,
        isCustomItem BIT DEFAULT 0,
        createdDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (assignmentId) REFERENCES PettyCashAssignments(assignmentId) ON DELETE CASCADE
    );
    PRINT '✓ Created PettyCashSettlementItems table';
END
ELSE
    PRINT '✓ PettyCashSettlementItems table already exists';
PRINT '';
GO

-- ============================================
-- STEP 11: Add Foreign Key to Customers
-- ============================================
PRINT 'Step 11: Adding foreign key to Customers...';

-- Add categoryId column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'categoryId')
BEGIN
    ALTER TABLE Customers ADD categoryId INT;
    PRINT '✓ Added categoryId column to Customers';
END

-- Add foreign key if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Customers_Categories')
BEGIN
    ALTER TABLE Customers ADD CONSTRAINT FK_Customers_Categories
    FOREIGN KEY (categoryId) REFERENCES Categories(categoryId);
    PRINT '✓ Added foreign key to Categories';
END
ELSE
    PRINT '✓ Foreign key already exists';
PRINT '';
GO

-- ============================================
-- STEP 12: Create Performance Indexes
-- ============================================
PRINT 'Step 12: Creating performance indexes...';

-- Index on Jobs.customerId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Jobs_CustomerId' AND object_id = OBJECT_ID('Jobs'))
BEGIN
    CREATE INDEX IX_Jobs_CustomerId ON Jobs(customerId);
    PRINT '✓ Created IX_Jobs_CustomerId';
END

-- Index on Jobs.assignedTo
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Jobs_AssignedTo' AND object_id = OBJECT_ID('Jobs'))
BEGIN
    CREATE INDEX IX_Jobs_AssignedTo ON Jobs(assignedTo);
    PRINT '✓ Created IX_Jobs_AssignedTo';
END

-- Index on Bills.jobId
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Bills')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Bills_JobId' AND object_id = OBJECT_ID('Bills'))
    BEGIN
        CREATE INDEX IX_Bills_JobId ON Bills(jobId);
        PRINT '✓ Created IX_Bills_JobId';
    END
END

-- Index on PettyCashAssignments.jobId
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCashAssignments')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PettyCashAssignments_JobId' AND object_id = OBJECT_ID('PettyCashAssignments'))
    BEGIN
        CREATE INDEX IX_PettyCashAssignments_JobId ON PettyCashAssignments(jobId);
        PRINT '✓ Created IX_PettyCashAssignments_JobId';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PettyCashAssignments_AssignedTo' AND object_id = OBJECT_ID('PettyCashAssignments'))
    BEGIN
        CREATE INDEX IX_PettyCashAssignments_AssignedTo ON PettyCashAssignments(assignedTo);
        PRINT '✓ Created IX_PettyCashAssignments_AssignedTo';
    END
END

PRINT '';
GO

-- ============================================
-- VERIFICATION
-- ============================================
PRINT '========================================';
PRINT 'VERIFICATION';
PRINT '========================================';
PRINT '';

-- List all tables
PRINT 'All Tables in Database:';
PRINT '-----------------------';
SELECT TABLE_NAME as 'Table Name'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

PRINT '';

-- Verify critical columns
PRINT 'Critical Columns Verification:';
PRINT '-------------------------------';

IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('Users') AND definition LIKE '%Manager%')
    PRINT '✓ Users.Role constraint includes Manager'
ELSE
    PRINT '✗ Users.Role constraint MISSING Manager';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'creditPeriodDays')
    PRINT '✓ Customers.creditPeriodDays exists'
ELSE
    PRINT '✗ Customers.creditPeriodDays MISSING';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'pettyCashStatus')
    PRINT '✓ Jobs.pettyCashStatus exists'
ELSE
    PRINT '✗ Jobs.pettyCashStatus MISSING';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'itemName')
    PRINT '✓ PayItemTemplates.itemName exists'
ELSE
    PRINT '✗ PayItemTemplates.itemName MISSING';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'category')
    PRINT '✓ PayItemTemplates.category exists'
ELSE
    PRINT '✗ PayItemTemplates.category MISSING';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PayItemTemplates') AND name = 'defaultCost')
    PRINT '✓ PayItemTemplates.defaultCost exists'
ELSE
    PRINT '✗ PayItemTemplates.defaultCost MISSING';

PRINT '';

-- Count records
PRINT 'Record Counts:';
PRINT '--------------';
SELECT 'Users' as 'Table', COUNT(*) as 'Records' FROM Users
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL
SELECT 'Jobs', COUNT(*) FROM Jobs
UNION ALL
SELECT 'PayItemTemplates', COUNT(*) FROM PayItemTemplates
UNION ALL
SELECT 'Categories', COUNT(*) FROM Categories;

PRINT '';
PRINT '========================================';
PRINT 'DATABASE FIX COMPLETED!';
PRINT '========================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Restart backend server: node src/index.js';
PRINT '2. Test creating a customer';
PRINT '3. Test creating a user with Manager role';
PRINT '4. Test creating a job';
PRINT '5. Check Settings > Pay Item Templates';
PRINT '';
GO
