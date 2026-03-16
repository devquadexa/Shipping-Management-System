-- Create Office Pay Items table for upfront payments by office staff
-- These are payments made at the beginning of jobs by Managers/Admins (e.g., DO charges)

USE SuperShineCargoDb;

PRINT 'Creating Office Pay Items table...';

-- Create OfficePayItems table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OfficePayItems')
BEGIN
    CREATE TABLE OfficePayItems (
        officePayItemId VARCHAR(50) PRIMARY KEY,
        jobId VARCHAR(50) NOT NULL,
        description NVARCHAR(200) NOT NULL,
        actualCost DECIMAL(18, 2) NOT NULL,
        billingAmount DECIMAL(18, 2) NULL, -- Can be set later in invoicing
        paidBy VARCHAR(50) NOT NULL, -- User who made the payment
        paymentDate DATETIME DEFAULT GETDATE(),
        notes NVARCHAR(500) NULL,
        createdDate DATETIME DEFAULT GETDATE(),
        updatedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (jobId) REFERENCES Jobs(jobId),
        FOREIGN KEY (paidBy) REFERENCES Users(userId)
    );
    PRINT '✓ Created OfficePayItems table';
END
ELSE
BEGIN
    PRINT '- OfficePayItems table already exists';
END

-- Create index for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OfficePayItems_JobId')
BEGIN
    CREATE INDEX IX_OfficePayItems_JobId ON OfficePayItems(jobId);
    PRINT '✓ Created index on jobId';
END

-- Create index for paidBy lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OfficePayItems_PaidBy')
BEGIN
    CREATE INDEX IX_OfficePayItems_PaidBy ON OfficePayItems(paidBy);
    PRINT '✓ Created index on paidBy';
END

PRINT 'Office Pay Items table setup completed successfully!';

-- Verify the table structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'OfficePayItems' 
ORDER BY ORDINAL_POSITION;