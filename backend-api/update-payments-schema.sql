-- Update Payments table to support cheque tracking with balance
-- Add ChequeAmount column to track total cheque amount

-- Check if ChequeAmount column exists, if not add it
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Payments' AND COLUMN_NAME = 'ChequeAmount')
BEGIN
    ALTER TABLE Payments
    ADD ChequeAmount DECIMAL(18, 2) NULL;
    
    PRINT '✓ Added ChequeAmount column';
END
ELSE
BEGIN
    PRINT 'ChequeAmount column already exists';
END
GO

-- Update existing records to set ChequeAmount = Amount for cheques
UPDATE Payments
SET ChequeAmount = Amount
WHERE PaymentMethod = 'Cheque' AND ChequeAmount IS NULL;

PRINT '✓ Updated existing cheque records';
GO

-- Create view for cheque summary (groups payments by cheque number)
IF EXISTS (SELECT * FROM sys.views WHERE name = 'ChequeSummary')
BEGIN
    DROP VIEW ChequeSummary;
END
GO

CREATE VIEW ChequeSummary AS
SELECT 
    ChequeNumber,
    MIN(ChequeDate) as ChequeDate,
    MAX(ChequeAmount) as ChequeAmount,
    SUM(Amount) as TotalAllocated,
    MAX(ChequeAmount) - SUM(Amount) as RemainingBalance,
    MIN(PaymentDate) as FirstPaymentDate,
    MAX(PaymentDate) as LastPaymentDate,
    MIN(CustomerId) as CustomerId,
    MIN(CustomerName) as CustomerName,
    MIN(BankName) as BankName,
    COUNT(*) as JobCount,
    MIN(Status) as Status,
    STRING_AGG(JobId, ', ') as JobIds
FROM Payments
WHERE PaymentMethod = 'Cheque' AND ChequeNumber IS NOT NULL
GROUP BY ChequeNumber;
GO

PRINT '✓ Created ChequeSummary view';
GO

PRINT '========================================';
PRINT '✅ Payment schema update complete!';
PRINT 'New features:';
PRINT '  - ChequeAmount: Total cheque amount';
PRINT '  - ChequeSummary view: Grouped cheque data';
PRINT '  - Balance calculation: ChequeAmount - TotalAllocated';
PRINT '========================================';
