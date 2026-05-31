-- Verify Notifications table exists and check its structure
USE SuperShineCargoDb;
GO

-- Check if table exists
IF OBJECT_ID('Notifications', 'U') IS NOT NULL
BEGIN
    PRINT '✅ Notifications table EXISTS';
    
    -- Show table structure
    PRINT '';
    PRINT 'Table Structure:';
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Notifications'
    ORDER BY ORDINAL_POSITION;
    
    -- Show row count
    PRINT '';
    PRINT 'Row Count:';
    SELECT COUNT(*) as TotalNotifications FROM Notifications;
    
    -- Show all notifications
    PRINT '';
    PRINT 'All Notifications:';
    SELECT * FROM Notifications ORDER BY createdDate DESC;
    
    -- Show unread count by user
    PRINT '';
    PRINT 'Unread Count by User:';
    SELECT userId, COUNT(*) as UnreadCount 
    FROM Notifications 
    WHERE isRead = 0 
    GROUP BY userId;
END
ELSE
BEGIN
    PRINT '❌ Notifications table DOES NOT EXIST';
    PRINT 'Please run create-notifications-system.sql to create the table';
END
GO
