-- Cash Balance Settlement System
-- Handles balance returns and overdue collections between Waff Clerks and Management

PRINT 'Creating Cash Balance Settlement System...';

-- Create CashBalanceSettlements table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CashBalanceSettlements')
BEGIN
    CREATE TABLE CashBalanceSettlements (
        settlementId VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50) NOT NULL, -- Waff Clerk
        userName NVARCHAR(100) NOT NULL,
        managerId VARCHAR(50) NULL, -- Super Admin/Admin/Manager
        managerName NVARCHAR(100) NULL,
        settlementType NVARCHAR(20) NOT NULL CHECK (settlementType IN ('BALANCE_RETURN', 'OVERDUE_COLLECTION')),
        amount DECIMAL(18,2) NOT NULL CHECK (amount > 0),
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED')),
        requestDate DATETIME NOT NULL DEFAULT GETDATE(),
        approvedDate DATETIME NULL,
        completedDate DATETIME NULL,
        notes NVARCHAR(MAX) NULL, -- Notes from Waff Clerk
        managerNotes NVARCHAR(MAX) NULL, -- Notes from Manager
        relatedAssignments NVARCHAR(MAX) NULL, -- JSON array of assignment IDs
        createdBy VARCHAR(50) NOT NULL,
        createdDate DATETIME NOT NULL DEFAULT GETDATE(),
        updatedBy VARCHAR(50) NULL,
        updatedDate DATETIME NULL,
        
        -- Foreign key constraints
        FOREIGN KEY (userId) REFERENCES Users(userId),
        FOREIGN KEY (managerId) REFERENCES Users(userId),
        FOREIGN KEY (createdBy) REFERENCES Users(userId),
        FOREIGN KEY (updatedBy) REFERENCES Users(userId)
    );
    
    PRINT '✓ Created CashBalanceSettlements table';
END
ELSE
BEGIN
    PRINT '⚠ CashBalanceSettlements table already exists';
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CashBalanceSettlements_UserId')
BEGIN
    CREATE INDEX IX_CashBalanceSettlements_UserId ON CashBalanceSettlements(userId);
    PRINT '✓ Created index IX_CashBalanceSettlements_UserId';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CashBalanceSettlements_ManagerId')
BEGIN
    CREATE INDEX IX_CashBalanceSettlements_ManagerId ON CashBalanceSettlements(managerId);
    PRINT '✓ Created index IX_CashBalanceSettlements_ManagerId';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CashBalanceSettlements_Status')
BEGIN
    CREATE INDEX IX_CashBalanceSettlements_Status ON CashBalanceSettlements(status);
    PRINT '✓ Created index IX_CashBalanceSettlements_Status';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CashBalanceSettlements_Type')
BEGIN
    CREATE INDEX IX_CashBalanceSettlements_Type ON CashBalanceSettlements(settlementType);
    PRINT '✓ Created index IX_CashBalanceSettlements_Type';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CashBalanceSettlements_RequestDate')
BEGIN
    CREATE INDEX IX_CashBalanceSettlements_RequestDate ON CashBalanceSettlements(requestDate);
    PRINT '✓ Created index IX_CashBalanceSettlements_RequestDate';
END

-- Add sample data for testing (optional)
PRINT '';
PRINT 'Cash Balance Settlement System created successfully!';
PRINT '';
PRINT 'Table Structure:';
PRINT '✓ CashBalanceSettlements - Main settlement records';
PRINT '';
PRINT 'Settlement Types:';
PRINT '✓ BALANCE_RETURN - Waff Clerk returns excess cash to management';
PRINT '✓ OVERDUE_COLLECTION - Waff Clerk collects overdue cash from management';
PRINT '';
PRINT 'Settlement Status Flow:';
PRINT '✓ PENDING → APPROVED → COMPLETED';
PRINT '✓ PENDING → REJECTED';
PRINT '';
PRINT 'Roles and Permissions:';
PRINT '✓ Waff Clerk - Can create settlement requests';
PRINT '✓ Super Admin/Admin/Manager - Can approve, reject, and complete settlements';
PRINT '';

-- Verify table creation
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CashBalanceSettlements')
BEGIN
    SELECT 
        'CashBalanceSettlements' as TableName,
        COUNT(*) as ColumnCount
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('CashBalanceSettlements');
    
    PRINT '✓ Table verification completed';
END