-- ============================================
-- Add Paid By Waff Clerk to Settlement Items
-- Super Shine Cargo Service Management System
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'Adding Paid By Waff Clerk to Settlement Items';
PRINT '============================================';
PRINT '';

-- Step 1: Add paidBy column to PettyCashSettlementItems
PRINT 'Step 1: Adding paidBy column...';

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

-- Step 2: Update existing records to set paidBy from assignment BEFORE adding FK
PRINT 'Step 2: Updating existing settlement items...';

UPDATE si
SET si.paidBy = pa.assignedTo
FROM PettyCashSettlementItems si
INNER JOIN PettyCashAssignments pa ON si.assignmentId = pa.assignmentId
WHERE si.paidBy IS NULL;

DECLARE @UpdatedCount INT = @@ROWCOUNT;
PRINT '✓ Updated ' + CAST(@UpdatedCount AS VARCHAR) + ' existing settlement item(s)';
PRINT '';
GO

-- Step 3: Add foreign key constraint
PRINT 'Step 3: Adding foreign key constraint...';

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

-- Step 4: Create view for settlement items with user details
PRINT 'Step 4: Creating view for settlement items with user details...';

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

-- Step 5: Verification
PRINT '============================================';
PRINT 'Verification';
PRINT '============================================';
PRINT '';

-- Check column exists
IF EXISTS (SELECT * FROM sys.columns 
           WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
           AND name = 'paidBy')
    PRINT '✓ paidBy column exists'
ELSE
    PRINT '✗ paidBy column MISSING';

-- Check foreign key exists
IF EXISTS (SELECT * FROM sys.foreign_keys 
           WHERE name = 'FK_SettlementItems_Users_PaidBy')
    PRINT '✓ Foreign key constraint exists'
ELSE
    PRINT '✗ Foreign key constraint MISSING';

-- Check view exists
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SettlementItemsWithUsers')
    PRINT '✓ View vw_SettlementItemsWithUsers exists'
ELSE
    PRINT '✗ View MISSING';

-- Show sample data
PRINT '';
PRINT 'Sample Settlement Items with Paid By:';
SELECT TOP 5
    settlementItemId,
    itemName,
    actualCost,
    paidByName,
    isCustomItem
FROM vw_SettlementItemsWithUsers
ORDER BY settlementItemId DESC;

PRINT '';
PRINT '============================================';
PRINT 'Migration Complete!';
PRINT '============================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Restart backend server';
PRINT '2. Test settlement with multiple Waff Clerks';
PRINT '3. Verify paid by column shows correct names';

GO
