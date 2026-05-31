-- ============================================================================
-- NOTIFICATIONS SYSTEM - COMPLETE DATABASE SCRIPTS
-- ============================================================================
-- Database: SuperShineCargoDb
-- Purpose: Add comprehensive notifications system for job assignments and petty cash
-- Date: May 18, 2026
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE NOTIFICATIONS TABLE
-- ============================================================================

IF OBJECT_ID('Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE Notifications (
        -- Primary Key
        notificationId VARCHAR(50) PRIMARY KEY,
        
        -- User Information
        userId VARCHAR(50) NOT NULL,
        
        -- Notification Details
        type VARCHAR(50) NOT NULL,  -- 'JOB_ASSIGNED', 'PETTY_CASH_ASSIGNED', 'JOB_UPDATED', 'PAYMENT_RECEIVED', etc.
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        
        -- Related Entity
        relatedId VARCHAR(50) NULL,  -- jobId or assignmentId
        relatedType VARCHAR(50) NULL,  -- 'Job', 'PettyCashAssignment', 'Bill', etc.
        
        -- Status
        isRead BIT DEFAULT 0,
        readDate DATETIME NULL,
        
        -- Metadata (JSON for flexibility)
        metadata NVARCHAR(MAX) NULL,  -- Additional data like jobDetails, assignmentDetails
        
        -- Timestamps
        createdDate DATETIME NOT NULL DEFAULT GETDATE(),
        createdBy VARCHAR(50) NULL,  -- User who triggered the notification
        
        -- Foreign Keys
        CONSTRAINT FK_Notifications_UserId FOREIGN KEY (userId) REFERENCES Users(UserId) ON DELETE CASCADE
    );
    
    PRINT '✅ Created Notifications table';
END
ELSE
BEGIN
    PRINT 'ℹ️  Notifications table already exists';
END
GO

-- ============================================================================
-- SECTION 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on userId for faster lookups by user
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
    PRINT '✅ Created index IX_Notifications_UserId';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_Notifications_UserId already exists';
END
GO

-- Index on isRead for filtering unread notifications
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_IsRead' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
    PRINT '✅ Created index IX_Notifications_IsRead';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_Notifications_IsRead already exists';
END
GO

-- Composite index on userId and isRead for common queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(userId, isRead);
    PRINT '✅ Created index IX_Notifications_UserId_IsRead';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_Notifications_UserId_IsRead already exists';
END
GO

-- Index on createdDate for sorting by date
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_CreatedDate' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_CreatedDate ON Notifications(createdDate DESC);
    PRINT '✅ Created index IX_Notifications_CreatedDate';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_Notifications_CreatedDate already exists';
END
GO

-- Index on type for filtering by notification type
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_Type' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_Type ON Notifications(type);
    PRINT '✅ Created index IX_Notifications_Type';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_Notifications_Type already exists';
END
GO

-- Index on relatedId for finding notifications related to specific entities
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_RelatedId' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_RelatedId ON Notifications(relatedId);
    PRINT '✅ Created index IX_Notifications_RelatedId';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_Notifications_RelatedId already exists';
END
GO

-- ============================================================================
-- SECTION 3: VERIFICATION QUERIES
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION: Notifications Table Structure';
PRINT '========================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Notifications'
ORDER BY ORDINAL_POSITION;
GO

-- Verify indexes
PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION: Indexes';
PRINT '========================================';
SELECT 
    i.name AS IndexName,
    t.name AS TableName,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name = 'Notifications'
ORDER BY i.name;
GO

-- ============================================================================
-- SECTION 4: USEFUL QUERIES FOR MANAGEMENT
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'USEFUL MANAGEMENT QUERIES';
PRINT '========================================';
PRINT '';
PRINT '-- View all unread notifications for a user:';
PRINT 'SELECT * FROM Notifications WHERE userId = ''USER0001'' AND isRead = 0 ORDER BY createdDate DESC;';
PRINT '';
PRINT '-- View all notifications for a user:';
PRINT 'SELECT * FROM Notifications WHERE userId = ''USER0001'' ORDER BY createdDate DESC;';
PRINT '';
PRINT '-- Count unread notifications by user:';
PRINT 'SELECT userId, COUNT(*) as UnreadCount FROM Notifications WHERE isRead = 0 GROUP BY userId;';
PRINT '';
PRINT '-- View notifications by type:';
PRINT 'SELECT type, COUNT(*) as Count FROM Notifications GROUP BY type;';
PRINT '';
PRINT '-- View notifications related to a specific job:';
PRINT 'SELECT * FROM Notifications WHERE relatedId = ''JOB0001'' ORDER BY createdDate DESC;';
PRINT '';
PRINT '-- Mark all notifications as read for a user:';
PRINT 'UPDATE Notifications SET isRead = 1, readDate = GETDATE() WHERE userId = ''USER0001'' AND isRead = 0;';
PRINT '';
PRINT '-- Delete old notifications (older than 30 days):';
PRINT 'DELETE FROM Notifications WHERE createdDate < DATEADD(day, -30, GETDATE());';
GO

-- ============================================================================
-- SECTION 5: SAMPLE DATA (FOR TESTING ONLY - OPTIONAL)
-- ============================================================================

-- Uncomment the following section to insert sample notifications for testing

/*
-- Sample Notification 1: Job Assigned
INSERT INTO Notifications (notificationId, userId, type, title, message, relatedId, relatedType, isRead, createdDate, createdBy, metadata)
VALUES (
    'NOTIF0001',
    'USER0002',
    'JOB_ASSIGNED',
    'New Job Assigned',
    'You have been assigned to Job JOB0001 - BL: BL123456',
    'JOB0001',
    'Job',
    0,
    GETDATE(),
    'USER0001',
    '{"jobId":"JOB0001","blNumber":"BL123456","customerId":"CUST0001","shipmentCategory":"Import"}'
);

-- Sample Notification 2: Petty Cash Assigned
INSERT INTO Notifications (notificationId, userId, type, title, message, relatedId, relatedType, isRead, createdDate, createdBy, metadata)
VALUES (
    'NOTIF0002',
    'USER0002',
    'PETTY_CASH_ASSIGNED',
    'Petty Cash Assigned',
    'Petty cash of LKR 5,000.00 has been assigned for Job JOB0001',
    'ASSIGN0001',
    'PettyCashAssignment',
    0,
    GETDATE(),
    'USER0001',
    '{"assignmentId":"ASSIGN0001","jobId":"JOB0001","assignedAmount":5000,"assignedBy":"USER0001"}'
);

-- Sample Notification 3: Read notification
INSERT INTO Notifications (notificationId, userId, type, title, message, relatedId, relatedType, isRead, readDate, createdDate, createdBy)
VALUES (
    'NOTIF0003',
    'USER0002',
    'JOB_UPDATED',
    'Job Status Updated',
    'Job JOB0001 status has been updated to In Progress',
    'JOB0001',
    'Job',
    1,
    GETDATE(),
    DATEADD(day, -1, GETDATE()),
    'USER0001'
);

PRINT '✅ Inserted sample notifications';
*/

-- ============================================================================
-- SECTION 6: CLEANUP SCRIPTS (USE WITH CAUTION)
-- ============================================================================

-- Uncomment the following section ONLY if you need to completely remove the notifications system

/*
PRINT '';
PRINT '========================================';
PRINT 'WARNING: CLEANUP SCRIPTS';
PRINT '========================================';
PRINT 'The following scripts will REMOVE all notifications functionality';
PRINT 'Uncomment and run ONLY if you need to rollback the feature';
PRINT '';

-- Drop indexes
DROP INDEX IF EXISTS IX_Notifications_UserId ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_IsRead ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_UserId_IsRead ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_CreatedDate ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_Type ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_RelatedId ON Notifications;
PRINT '✅ Dropped indexes';

-- Drop Notifications table
DROP TABLE IF EXISTS Notifications;
PRINT '✅ Dropped Notifications table';

PRINT '';
PRINT '✅ Notifications system completely removed';
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT '✅ NOTIFICATIONS SYSTEM SETUP COMPLETE';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  ✅ Notifications table created';
PRINT '  ✅ 6 indexes created for performance';
PRINT '  ✅ Foreign key constraint to Users table';
PRINT '';
PRINT 'Notification Types:';
PRINT '  - JOB_ASSIGNED: When a job is assigned to a user';
PRINT '  - PETTY_CASH_ASSIGNED: When petty cash is assigned to a user';
PRINT '  - JOB_UPDATED: When a job is updated';
PRINT '  - PAYMENT_RECEIVED: When a payment is received';
PRINT '  - BILL_GENERATED: When a bill is generated';
PRINT '  - SETTLEMENT_COMPLETED: When petty cash settlement is completed';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Verify the changes using the verification queries above';
PRINT '  2. Restart the backend server to use the new schema';
PRINT '  3. Implement notification triggers in use cases';
PRINT '  4. Create NotificationService for creating notifications';
PRINT '  5. Add notification endpoints to API';
PRINT '  6. Create frontend notification component';
PRINT '';
PRINT 'Database: SuperShineCargoDb';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
GO
