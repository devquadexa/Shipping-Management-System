-- ============================================
-- Verify Paid By Column Exists
-- Super Shine Cargo Service Management System
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'Verifying Paid By Column';
PRINT '============================================';
PRINT '';

-- Check if paidBy column exists
IF EXISTS (SELECT * FROM sys.columns 
           WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
           AND name = 'paidBy')
BEGIN
    PRINT '✓ paidBy column EXISTS in PettyCashSettlementItems';
    
    -- Show column details
    SELECT 
        c.name AS ColumnName,
        t.name AS DataType,
        c.max_length AS MaxLength,
        c.is_nullable AS IsNullable
    FROM sys.columns c
    INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE c.object_id = OBJECT_ID('PettyCashSettlementItems')
    AND c.name = 'paidBy';
END
ELSE
BEGIN
    PRINT '✗ paidBy column DOES NOT EXIST in PettyCashSettlementItems';
    PRINT '';
    PRINT 'ACTION REQUIRED: Run ADD_PAID_BY_TO_SETTLEMENT_ITEMS.sql';
END

PRINT '';

-- Check foreign key
IF EXISTS (SELECT * FROM sys.foreign_keys 
           WHERE name = 'FK_SettlementItems_Users_PaidBy')
    PRINT '✓ Foreign key constraint EXISTS'
ELSE
    PRINT '✗ Foreign key constraint DOES NOT EXIST';

PRINT '';

-- Check view
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SettlementItemsWithUsers')
    PRINT '✓ View vw_SettlementItemsWithUsers EXISTS'
ELSE
    PRINT '✗ View vw_SettlementItemsWithUsers DOES NOT EXIST';

PRINT '';
PRINT '============================================';

GO
