-- Add cheque-specific fields to OldInvoicePayments table
-- Run this on both local and production databases

-- Add cheque number column
ALTER TABLE OldInvoicePayments
ADD chequeNumber NVARCHAR(100) NULL;

-- Add cheque date column
ALTER TABLE OldInvoicePayments
ADD chequeDate DATE NULL;

-- Add cheque amount column
ALTER TABLE OldInvoicePayments
ADD chequeAmount DECIMAL(18, 2) NULL;

GO

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OldInvoicePayments'
ORDER BY ORDINAL_POSITION;

GO
