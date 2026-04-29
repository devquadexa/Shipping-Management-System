-- Add partial payment support to Bills table

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bills' AND COLUMN_NAME='paidAmount')
BEGIN
    ALTER TABLE Bills ADD paidAmount DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT '✓ Added paidAmount column';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bills' AND COLUMN_NAME='remainingAmount')
BEGIN
    ALTER TABLE Bills ADD remainingAmount DECIMAL(18,2) NOT NULL DEFAULT 0;
    PRINT '✓ Added remainingAmount column';
END

-- Initialise existing Paid bills: paidAmount = netTotal, remainingAmount = 0
UPDATE Bills
SET paidAmount = ISNULL(netTotal, ISNULL(total, 0)),
    remainingAmount = 0
WHERE PaymentStatus = 'Paid';

-- Initialise existing Unpaid bills: paidAmount = 0, remainingAmount = netTotal
UPDATE Bills
SET paidAmount = 0,
    remainingAmount = ISNULL(netTotal, ISNULL(total, 0))
WHERE PaymentStatus = 'Unpaid';

PRINT '✓ Initialised paidAmount / remainingAmount for existing bills';
GO

-- Add IsPartial column to Payments table to flag partial payments
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Payments' AND COLUMN_NAME='IsPartial')
BEGIN
    ALTER TABLE Payments ADD IsPartial BIT NOT NULL DEFAULT 0;
    PRINT '✓ Added IsPartial column to Payments';
END
GO

PRINT '✅ Partial payment migration complete';
