-- Check and Fix Notifications Table
-- This script will check if the Notifications table exists and has all required columns
-- If not, it will create/fix the table

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'NOTIFICATIONS TABLE CHECK AND FIX';
PRINT '========================================';
PRINT '';

-- Check if table exists
IF OBJECT_ID('Notifications', 'U') IS NULL
BEGIN
    PRINT '❌ Notifications table does NOT exist';
    PRINT 'Creating Notifications table...';
    PRINT '';
    
    CREATE TABLE Notifications (
        -- Primary Key
        notificationId VARCHAR(50) PRIMARY KEY,
        
        -- User Information
        userId VARCHAR(50) NOT NULL,
        
        -- Notification Details
        type VARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        
        -- Related Entity
        relatedId VARCHAR(50) NULL,
        relatedType VARCHAR(50) NULL,
        
        -- Status
        isRead BIT DEFAULT 0,
        readDate DATETIME NULL,
        
        -- Metadata
        metadata NVARCHAR(MAX) NULL,
        
        -- Timestamps
        createdDate DATETIME NOT NULL DEFAULT GETDATE(),
        createdBy VARCHAR(50) NULL,
        
        -- Foreign Keys
        CONSTRAINT FK_Notifications_UserId FOREIGN KEY (userId) REFERENCES Users(UserId) ON DELETE CASCADE
    );
    
    PRINT '✅ Created Notifications table';
    
    -- Create indexes
    CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
    CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
    CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(userId, isRead);
    CREATE INDEX IX_Notifications_CreatedDate ON Notifications(createdDate DESC);
    CREATE INDEX IX_Notifications_Type ON Notifications(type);
    CREATE INDEX IX_Notifications_RelatedId ON Notifications(relatedId);
    
    PRINT '✅ Created indexes';
END
ELSE
BEGIN
    PRINT '✅ Notifications table exists';
    PRINT '';
    PRINT 'Checking for missing columns...';
    
    -- Check and add createdBy column
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('Notifications') 
        AND name = 'createdBy'
    )
    BEGIN
        ALTER TABLE Notifications ADD createdBy VARCHAR(50) NULL;
        PRINT '✅ Added createdBy column';
    END
    ELSE
    BEGIN
        PRINT '   ✓ createdBy column exists';
    END
    
    -- Check and add metadata column
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('Notifications') 
        AND name = 'metadata'
    )
    BEGIN
        ALTER TABLE Notifications ADD metadata NVARCHAR(MAX) NULL;
        PRINT '✅ Added metadata column';
    END
    ELSE
    BEGIN
        PRINT '   ✓ metadata column exists';
    END
    
    -- Check and add relatedType column
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('Notifications') 
        AND name = 'relatedType'
    )
    BEGIN
        ALTER TABLE Notifications ADD relatedType VARCHAR(50) NULL;
        PRINT '✅ Added relatedType column';
    END
    ELSE
    BEGIN
        PRINT '   ✓ relatedType column exists';
    END
END
GO

-- Show final table structure
PRINT '';
PRINT '========================================';
PRINT 'FINAL TABLE STRUCTURE';
PRINT '========================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Notifications'
ORDER BY ORDINAL_POSITION;
GO

-- Show indexes
PRINT '';
PRINT '========================================';
PRINT 'INDEXES';
PRINT '========================================';
SELECT 
    i.name AS IndexName,
    c.name AS ColumnName,
    i.is_unique AS IsUnique
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('Notifications')
ORDER BY i.name, ic.key_ordinal;
GO

-- Show current notification count
PRINT '';
PRINT '========================================';
PRINT 'CURRENT DATA';
PRINT '========================================';
SELECT COUNT(*) as TotalNotifications FROM Notifications;
GO

PRINT '';
PRINT '========================================';
PRINT '✅ CHECK AND FIX COMPLETE';
PRINT '========================================';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Restart your backend server';
PRINT '2. Create a new job and assign it to a user';
PRINT '3. Login as that user and check notifications';
PRINT '';
GO
