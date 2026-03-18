-- Migration: Add hasBill column to PettyCashSettlementItems
-- Run this script once against the database

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
    AND name = 'hasBill'
)
BEGIN
    ALTER TABLE PettyCashSettlementItems
    ADD hasBill BIT NOT NULL DEFAULT 0;

    PRINT 'Added hasBill column to PettyCashSettlementItems';
END
ELSE
BEGIN
    PRINT 'hasBill column already exists in PettyCashSettlementItems';
END
