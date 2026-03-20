-- Add bank name field to OldInvoicePayments table
-- Run this on both local and production databases

-- Add bank name column
ALTER TABLE OldInvoicePayments
ADD bankName NVARCHAR(100) NULL;

GO

-- Verify column was added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OldInvoicePayments'
AND COLUMN_NAME = 'bankName';

GO
