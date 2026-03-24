-- Add Payment Details columns to Bills table
-- This allows tracking payment method, cheque details, and bank transfer information

-- Check if columns exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Bills]') AND name = 'paymentMethod')
BEGIN
    ALTER TABLE Bills ADD paymentMethod VARCHAR(50) NULL;
    PRINT 'Added paymentMethod column to Bills table';
END
ELSE
BEGIN
    PRINT 'paymentMethod column already exists in Bills table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Bills]') AND name = 'chequeNumber')
BEGIN
    ALTER TABLE Bills ADD chequeNumber VARCHAR(100) NULL;
    PRINT 'Added chequeNumber column to Bills table';
END
ELSE
BEGIN
    PRINT 'chequeNumber column already exists in Bills table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Bills]') AND name = 'chequeDate')
BEGIN
    ALTER TABLE Bills ADD chequeDate DATE NULL;
    PRINT 'Added chequeDate column to Bills table';
END
ELSE
BEGIN
    PRINT 'chequeDate column already exists in Bills table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Bills]') AND name = 'chequeAmount')
BEGIN
    ALTER TABLE Bills ADD chequeAmount DECIMAL(18, 2) NULL;
    PRINT 'Added chequeAmount column to Bills table';
END
ELSE
BEGIN
    PRINT 'chequeAmount column already exists in Bills table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Bills]') AND name = 'bankName')
BEGIN
    ALTER TABLE Bills ADD bankName VARCHAR(100) NULL;
    PRINT 'Added bankName column to Bills table';
END
ELSE
BEGIN
    PRINT 'bankName column already exists in Bills table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Bills]') AND name = 'paidDate')
BEGIN
    ALTER TABLE Bills ADD paidDate DATETIME NULL;
    PRINT 'Added paidDate column to Bills table';
END
ELSE
BEGIN
    PRINT 'paidDate column already exists in Bills table';
END
GO

PRINT 'Payment details columns migration completed successfully!';
GO
