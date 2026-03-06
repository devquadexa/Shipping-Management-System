-- Add Credit Period to Customers and Invoice Tracking to Bills
-- This enables automatic overdue status calculation

USE SuperShineCargoDb;
GO

-- Add creditPeriodDays column to Customers table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'creditPeriodDays')
BEGIN
    ALTER TABLE Customers
    ADD creditPeriodDays INT NULL DEFAULT 30;
    
    PRINT 'Added creditPeriodDays column to Customers table';
END
GO

-- Update existing customers with default 30 days credit period
UPDATE Customers
SET creditPeriodDays = 30
WHERE creditPeriodDays IS NULL;
GO

PRINT 'Updated existing customers with default 30 days credit period';
GO

-- Add invoice date and due date columns to Bills table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'invoiceDate')
BEGIN
    ALTER TABLE Bills
    ADD invoiceDate DATETIME NULL DEFAULT GETDATE();
    
    PRINT 'Added invoiceDate column to Bills table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'dueDate')
BEGIN
    ALTER TABLE Bills
    ADD dueDate DATETIME NULL;
    
    PRINT 'Added dueDate column to Bills table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'isOverdue')
BEGIN
    ALTER TABLE Bills
    ADD isOverdue BIT NULL DEFAULT 0;
    
    PRINT 'Added isOverdue column to Bills table';
END
GO

-- Update existing bills with invoice date (use billDate or createdDate)
UPDATE Bills
SET invoiceDate = COALESCE(billDate, createdDate)
WHERE invoiceDate IS NULL;
GO

PRINT 'Updated existing bills with invoice dates';
GO

-- Create a view to check overdue invoices
IF OBJECT_ID('vw_OverdueInvoices', 'V') IS NOT NULL
    DROP VIEW vw_OverdueInvoices;
GO

CREATE VIEW vw_OverdueInvoices AS
SELECT 
    b.billId,
    b.jobId,
    b.customerId,
    b.invoiceDate,
    b.dueDate,
    b.paymentStatus,
    j.status AS jobStatus,
    c.creditPeriodDays,
    DATEDIFF(DAY, b.dueDate, GETDATE()) AS daysOverdue,
    CASE 
        WHEN b.paymentStatus = 'Unpaid' 
             AND b.dueDate IS NOT NULL 
             AND GETDATE() > b.dueDate 
        THEN 1 
        ELSE 0 
    END AS shouldBeOverdue
FROM Bills b
INNER JOIN Jobs j ON b.jobId = j.jobId
INNER JOIN Customers c ON b.customerId = c.customerId
WHERE b.paymentStatus = 'Unpaid';
GO

PRINT 'Created vw_OverdueInvoices view';
GO

-- Create stored procedure to update overdue statuses
IF OBJECT_ID('sp_UpdateOverdueStatuses', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateOverdueStatuses;
GO

CREATE PROCEDURE sp_UpdateOverdueStatuses
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @updatedCount INT = 0;
    
    -- Update jobs to Overdue status where invoice is overdue and not yet paid
    UPDATE j
    SET j.status = 'Overdue'
    FROM Jobs j
    INNER JOIN Bills b ON j.jobId = b.jobId
    WHERE b.paymentStatus = 'Unpaid'
        AND b.dueDate IS NOT NULL
        AND GETDATE() > b.dueDate
        AND j.status NOT IN ('Overdue', 'Payment Collected', 'Completed', 'Canceled');
    
    SET @updatedCount = @@ROWCOUNT;
    
    -- Update isOverdue flag in Bills
    UPDATE Bills
    SET isOverdue = 1
    WHERE paymentStatus = 'Unpaid'
        AND dueDate IS NOT NULL
        AND GETDATE() > dueDate
        AND isOverdue = 0;
    
    PRINT 'Updated ' + CAST(@updatedCount AS VARCHAR(10)) + ' jobs to Overdue status';
    
    RETURN @updatedCount;
END
GO

PRINT 'Created sp_UpdateOverdueStatuses stored procedure';
GO

-- Verify the changes
PRINT '';
PRINT '=== Verification ===';
PRINT 'Customers table columns:';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Customers'
    AND COLUMN_NAME IN ('creditPeriodDays');
GO

PRINT '';
PRINT 'Bills table columns:';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Bills'
    AND COLUMN_NAME IN ('invoiceDate', 'dueDate', 'isOverdue');
GO

PRINT '';
PRINT '=== Setup Complete ===';
PRINT 'Credit period tracking is now enabled';
PRINT 'Run sp_UpdateOverdueStatuses periodically to check for overdue invoices';
GO
