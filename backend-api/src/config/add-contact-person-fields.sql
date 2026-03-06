-- Add Email and Designation fields to ContactPersons table
USE SuperShineCargoDb;
GO

-- Add Email column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ContactPersons') AND name = 'Email')
BEGIN
    ALTER TABLE ContactPersons ADD Email VARCHAR(255) NULL;
    PRINT 'Email column added to ContactPersons table';
END
ELSE
BEGIN
    PRINT 'Email column already exists in ContactPersons table';
END
GO

-- Add Designation column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ContactPersons') AND name = 'Designation')
BEGIN
    ALTER TABLE ContactPersons ADD Designation VARCHAR(100) NULL;
    PRINT 'Designation column added to ContactPersons table';
END
ELSE
BEGIN
    PRINT 'Designation column already exists in ContactPersons table';
END
GO

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ContactPersons'
ORDER BY ORDINAL_POSITION;
GO

PRINT 'ContactPersons table updated successfully!';
