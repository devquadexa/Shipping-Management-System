-- ============================================
-- Super Shine Cargo Service - Complete Database Setup
-- ============================================
-- This script creates the entire database structure
-- Run this script in SQL Server Management Studio (SSMS)
-- ============================================

USE master;
GO

PRINT '========================================';
PRINT 'Super Shine Cargo Service';
PRINT 'Complete Database Setup';
PRINT '========================================';
PRINT '';

-- ============================================
-- STEP 1: Create Login
-- ============================================
PRINT 'Step 1: Creating Login...';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'SUPER_SHINE_CARGO')
BEGIN
    CREATE LOGIN SUPER_SHINE_CARGO 
    WITH PASSWORD = 'SuperShine@2024',
    CHECK_POLICY = OFF;
    PRINT '✓ Login created: SUPER_SHINE_CARGO';
END
ELSE
    PRINT '✓ Login already exists: SUPER_SHINE_CARGO';
GO

-- ============================================
-- STEP 2: Create Database
-- ============================================
PRINT '';
PRINT 'Step 2: Creating Database...';

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SuperShineCargoDb')
BEGIN
    CREATE DATABASE SuperShineCargoDb;
    PRINT '✓ Database created: SuperShineCargoDb';
END
ELSE
    PRINT '✓ Database already exists: SuperShineCargoDb';
GO

USE SuperShineCargoDb;
GO

-- ============================================
-- STEP 3: Create User and Grant Permissions
-- ============================================
PRINT '';
PRINT 'Step 3: Creating User and Granting Permissions...';

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'SUPER_SHINE_CARGO')
BEGIN
    CREATE USER SUPER_SHINE_CARGO FOR LOGIN SUPER_SHINE_CARGO;
    ALTER ROLE db_owner ADD MEMBER SUPER_SHINE_CARGO;
    PRINT '✓ User created and granted db_owner permissions';
END
ELSE
    PRINT '✓ User already exists: SUPER_SHINE_CARGO';
GO

-- ============================================
-- STEP 4: Create Tables
-- ============================================
PRINT '';
PRINT 'Step 4: Creating Tables...';

-- Categories Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
BEGIN
    CREATE TABLE Categories (
        categoryId INT IDENTITY(1,1) PRIMARY KEY,
        categoryName NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500),
        isActive BIT DEFAULT 1,
        createdDate DATETIME DEFAULT GETDATE()
    );
    PRINT '✓ Table created: Categories';
END
ELSE
    PRINT '✓ Table already exists: Categories';
GO

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        userId VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullName NVARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        role NVARCHAR(20) NOT NULL CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk')),
        createdDate DATETIME DEFAULT GETDATE(),
        isActive BIT DEFAULT 1
    );
    PRINT '✓ Table created: Users';
END
ELSE
BEGIN
    -- Update constraint if table exists
    IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK__Users__Role__5DCAEF64')
    BEGIN
        ALTER TABLE Users DROP CONSTRAINT CK__Users__Role__5DCAEF64;
    END
    
    IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Users_Role')
    BEGIN
        ALTER TABLE Users ADD CONSTRAINT CK_Users_Role 
        CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk'));
        PRINT '✓ Updated Users table constraint to include Manager role';
    END
    PRINT '✓ Table already exists: Users';
END
GO

-- Customers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        customerId VARCHAR(50) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        address NVARCHAR(500),
        phone VARCHAR(20),
        email VARCHAR(100),
        categoryId INT,
        creditPeriodDays INT DEFAULT 30,
        isActive BIT DEFAULT 1,
        createdDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (categoryId) REFERENCES Categories(categoryId)
    );
    PRINT '✓ Table created: Customers';
END
ELSE
BEGIN
    -- Add creditPeriodDays if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'creditPeriodDays')
    BEGIN
        ALTER TABLE Customers ADD creditPeriodDays INT DEFAULT 30;
        PRINT '✓ Added creditPeriodDays column to Customers';
    END
    PRINT '✓ Table already exists: Customers';
END
GO

-- ContactPersons Table
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
    PRINT '✓ Table created: ContactPersons';
END
ELSE
    PRINT '✓ Table already exists: ContactPersons';
GO

-- Jobs Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Jobs')
BEGIN
    CREATE TABLE Jobs (
        jobId VARCHAR(50) PRIMARY KEY,
        customerId VARCHAR(50) NOT NULL,
        shipmentCategory NVARCHAR(100) NOT NULL,
        openDate DATETIME DEFAULT GETDATE(),
        status NVARCHAR(50) DEFAULT 'Open' CHECK (Status IN ('Open', 'In Progress', 'Pending Payment', 'Payment Collected', 'Overdue', 'Completed', 'Canceled')),
        assignedTo VARCHAR(50),
        pettyCashStatus NVARCHAR(50) DEFAULT 'Not Assigned' CHECK (pettyCashStatus IN ('Not Assigned', 'Assigned', 'Settled')),
        notes NVARCHAR(MAX),
        payItems NVARCHAR(MAX),
        FOREIGN KEY (customerId) REFERENCES Customers(customerId),
        FOREIGN KEY (assignedTo) REFERENCES Users(userId)
    );
    PRINT '✓ Table created: Jobs';
END
ELSE
BEGIN
    -- Add pettyCashStatus if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'pettyCashStatus')
    BEGIN
        ALTER TABLE Jobs ADD pettyCashStatus NVARCHAR(50) DEFAULT 'Not Assigned' 
        CHECK (pettyCashStatus IN ('Not Assigned', 'Assigned', 'Settled'));
        PRINT '✓ Added pettyCashStatus column to Jobs';
    END
    
    -- Update existing jobs
    UPDATE Jobs SET pettyCashStatus = 'Not Assigned' WHERE pettyCashStatus IS NULL;
    
    PRINT '✓ Table already exists: Jobs';
END
GO

-- Bills Table
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
    PRINT '✓ Table created: Bills';
END
ELSE
BEGIN
    -- Add invoice tracking columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'invoiceDate')
    BEGIN
        ALTER TABLE Bills ADD invoiceDate DATETIME DEFAULT GETDATE();
        PRINT '✓ Added invoiceDate column to Bills';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'dueDate')
    BEGIN
        ALTER TABLE Bills ADD dueDate DATETIME;
        PRINT '✓ Added dueDate column to Bills';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'isOverdue')
    BEGIN
        ALTER TABLE Bills ADD isOverdue BIT DEFAULT 0;
        PRINT '✓ Added isOverdue column to Bills';
    END
    
    PRINT '✓ Table already exists: Bills';
END
GO

-- PettyCashEntries Table
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
    PRINT '✓ Table created: PettyCashEntries';
END
ELSE
    PRINT '✓ Table already exists: PettyCashEntries';
GO

-- PayItemTemplates Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PayItemTemplates')
BEGIN
    CREATE TABLE PayItemTemplates (
        templateId INT IDENTITY(1,1) PRIMARY KEY,
        itemName NVARCHAR(200) NOT NULL,
        category NVARCHAR(100) NOT NULL,
        defaultCost DECIMAL(18,2),
        isActive BIT DEFAULT 1,
        createdDate DATETIME DEFAULT GETDATE()
    );
    PRINT '✓ Table created: PayItemTemplates';
END
ELSE
    PRINT '✓ Table already exists: PayItemTemplates';
GO

-- PettyCashAssignments Table
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
    PRINT '✓ Table created: PettyCashAssignments';
END
ELSE
    PRINT '✓ Table already exists: PettyCashAssignments';
GO

-- PettyCashSettlementItems Table
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
    PRINT '✓ Table created: PettyCashSettlementItems';
END
ELSE
    PRINT '✓ Table already exists: PettyCashSettlementItems';
GO

-- ============================================
-- STEP 5: Insert Default Data
-- ============================================
PRINT '';
PRINT 'Step 5: Inserting Default Data...';

-- Insert Default Categories
IF NOT EXISTS (SELECT * FROM Categories WHERE categoryName = 'Air Freight')
BEGIN
    INSERT INTO Categories (categoryName, description) VALUES
    ('Air Freight', 'Air cargo shipments'),
    ('Sea Freight', 'Ocean cargo shipments'),
    ('Land Transport', 'Road transportation'),
    ('Express Delivery', 'Fast delivery services'),
    ('Warehousing', 'Storage and warehousing');
    PRINT '✓ Default categories inserted';
END
ELSE
    PRINT '✓ Default categories already exist';
GO

-- Insert Super Admin User
IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin')
BEGIN
    INSERT INTO Users (userId, username, password, fullName, email, role, createdDate, isActive)
    VALUES ('SA_001', 'admin', 'admin123', 'System Administrator', 'admin@supershine.lk', 'Super Admin', GETDATE(), 1);
    PRINT '✓ Super Admin user created';
    PRINT '  Username: admin';
    PRINT '  Password: admin123';
END
ELSE
    PRINT '✓ Super Admin user already exists';
GO

-- Insert Sample Pay Item Templates
IF NOT EXISTS (SELECT * FROM PayItemTemplates WHERE itemName = 'Fuel Cost')
BEGIN
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
    PRINT '✓ Sample pay item templates inserted';
END
ELSE
    PRINT '✓ Pay item templates already exist';
GO

-- ============================================
-- STEP 6: Create Indexes for Performance
-- ============================================
PRINT '';
PRINT 'Step 6: Creating Indexes...';

-- Index on Jobs.customerId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Jobs_CustomerId' AND object_id = OBJECT_ID('Jobs'))
BEGIN
    CREATE INDEX IX_Jobs_CustomerId ON Jobs(customerId);
    PRINT '✓ Index created: IX_Jobs_CustomerId';
END

-- Index on Jobs.assignedTo
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Jobs_AssignedTo' AND object_id = OBJECT_ID('Jobs'))
BEGIN
    CREATE INDEX IX_Jobs_AssignedTo ON Jobs(assignedTo);
    PRINT '✓ Index created: IX_Jobs_AssignedTo';
END

-- Index on Bills.jobId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Bills_JobId' AND object_id = OBJECT_ID('Bills'))
BEGIN
    CREATE INDEX IX_Bills_JobId ON Bills(jobId);
    PRINT '✓ Index created: IX_Bills_JobId';
END

-- Index on PettyCashAssignments.jobId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PettyCashAssignments_JobId' AND object_id = OBJECT_ID('PettyCashAssignments'))
BEGIN
    CREATE INDEX IX_PettyCashAssignments_JobId ON PettyCashAssignments(jobId);
    PRINT '✓ Index created: IX_PettyCashAssignments_JobId';
END

-- Index on PettyCashAssignments.assignedTo
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PettyCashAssignments_AssignedTo' AND object_id = OBJECT_ID('PettyCashAssignments'))
BEGIN
    CREATE INDEX IX_PettyCashAssignments_AssignedTo ON PettyCashAssignments(assignedTo);
    PRINT '✓ Index created: IX_PettyCashAssignments_AssignedTo';
END

GO

-- ============================================
-- STEP 7: Verify Installation
-- ============================================
PRINT '';
PRINT 'Step 7: Verifying Installation...';
PRINT '';

DECLARE @TableCount INT;
SELECT @TableCount = COUNT(*) 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

PRINT 'Database Tables Created: ' + CAST(@TableCount AS VARCHAR(10));
PRINT '';

SELECT TABLE_NAME as 'Table Name'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

PRINT '';
PRINT '========================================';
PRINT 'Database Setup Completed Successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Connection Details:';
PRINT '-------------------';
PRINT 'Server: localhost,58886 (or your port)';
PRINT 'Database: SuperShineCargoDb';
PRINT 'Username: SUPER_SHINE_CARGO';
PRINT 'Password: SuperShine@2024';
PRINT '';
PRINT 'Default Login Credentials:';
PRINT '--------------------------';
PRINT 'Username: admin';
PRINT 'Password: admin123';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Update backend-api/.env file with connection details';
PRINT '2. Test connection: node src/config/database.js';
PRINT '3. Start backend: node src/index.js';
PRINT '4. Start frontend: npm start';
PRINT '';
PRINT '⚠️  IMPORTANT: Change default passwords in production!';
PRINT '';
GO
