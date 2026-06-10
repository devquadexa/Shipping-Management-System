-- ============================================================================
-- SUPER SHINE CARGO SERVICE - PRODUCTION DATABASE SETUP
-- ============================================================================
-- Database: SuperShineCargoDb
-- Purpose: Complete setup for Notifications and Password Reset features
-- Date: May 31, 2026
-- Version: 1.0
-- ============================================================================
-- 
-- FEATURES INCLUDED:
-- 1. Notifications System (Job assignments, Petty cash, etc.)
-- 2. Password Reset & Forgot Password functionality
--
-- INSTRUCTIONS:
-- 1. Backup your database before running this script
-- 2. Open SQL Server Management Studio (SSMS)
-- 3. Connect to your production database server
-- 4. Select the SuperShineCargoDb database
-- 5. Open this file and execute it
-- 6. Review the output messages for any errors
-- 7. Restart your backend server after successful execution
--
-- ============================================================================

USE SuperShineCargoDb;
GO

PRINT '';
PRINT '╔════════════════════════════════════════════════════════════════════════╗';
PRINT '║                                                                        ║';
PRINT '║          SUPER SHINE CARGO SERVICE - DATABASE SETUP                   ║';
PRINT '║                                                                        ║';
PRINT '║  Features: Notifications System + Password Reset                      ║';
PRINT '║  Date: May 31, 2026                                                   ║';
PRINT '║                                                                        ║';
PRINT '╚════════════════════════════════════════════════════════════════════════╝';
PRINT '';

-- ============================================================================
-- PART 1: NOTIFICATIONS SYSTEM
-- ============================================================================

PRINT '';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT 'PART 1: NOTIFICATIONS SYSTEM SETUP';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT '';

-- ----------------------------------------------------------------------------
-- 1.1: Create Notifications Table
-- ----------------------------------------------------------------------------

PRINT '1.1 Creating Notifications table...';

IF OBJECT_ID('Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE Notifications (
        -- Primary Key
        notificationId VARCHAR(50) PRIMARY KEY,
        
        -- User Information
        userId VARCHAR(50) NOT NULL,
        
        -- Notification Details
        type VARCHAR(50) NOT NULL,  -- 'JOB_ASSIGNED', 'PETTY_CASH_ASSIGNED', etc.
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        
        -- Related Entity
        relatedId VARCHAR(50) NULL,  -- jobId or assignmentId
        relatedType VARCHAR(50) NULL,  -- 'Job', 'PettyCashAssignment', 'Bill', etc.
        
        -- Status
        isRead BIT DEFAULT 0,
        readDate DATETIME NULL,
        
        -- Metadata (JSON for flexibility)
        metadata NVARCHAR(MAX) NULL,
        
        -- Timestamps
        createdDate DATETIME NOT NULL DEFAULT GETDATE(),
        createdBy VARCHAR(50) NULL,
        
        -- Foreign Keys
        CONSTRAINT FK_Notifications_UserId FOREIGN KEY (userId) REFERENCES Users(UserId) ON DELETE CASCADE
    );
    
    PRINT '    ✅ Created Notifications table';
END
ELSE
BEGIN
    PRINT '    ℹ️  Notifications table already exists';
    
    -- Check and add missing columns if table exists
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'createdBy')
    BEGIN
        ALTER TABLE Notifications ADD createdBy VARCHAR(50) NULL;
        PRINT '    ✅ Added createdBy column';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'metadata')
    BEGIN
        ALTER TABLE Notifications ADD metadata NVARCHAR(MAX) NULL;
        PRINT '    ✅ Added metadata column';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'relatedType')
    BEGIN
        ALTER TABLE Notifications ADD relatedType VARCHAR(50) NULL;
        PRINT '    ✅ Added relatedType column';
    END
END
GO

-- ----------------------------------------------------------------------------
-- 1.2: Create Indexes for Notifications
-- ----------------------------------------------------------------------------

PRINT '';
PRINT '1.2 Creating indexes for Notifications table...';

-- Index on userId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_UserId ON Notifications(userId);
    PRINT '    ✅ Created index IX_Notifications_UserId';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_Notifications_UserId already exists';
END
GO

-- Index on isRead
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_IsRead' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_IsRead ON Notifications(isRead);
    PRINT '    ✅ Created index IX_Notifications_IsRead';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_Notifications_IsRead already exists';
END
GO

-- Composite index on userId and isRead
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_UserId_IsRead' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(userId, isRead);
    PRINT '    ✅ Created index IX_Notifications_UserId_IsRead';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_Notifications_UserId_IsRead already exists';
END
GO

-- Index on createdDate
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_CreatedDate' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_CreatedDate ON Notifications(createdDate DESC);
    PRINT '    ✅ Created index IX_Notifications_CreatedDate';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_Notifications_CreatedDate already exists';
END
GO

-- Index on type
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_Type' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_Type ON Notifications(type);
    PRINT '    ✅ Created index IX_Notifications_Type';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_Notifications_Type already exists';
END
GO

-- Index on relatedId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_RelatedId' AND object_id = OBJECT_ID('Notifications'))
BEGIN
    CREATE INDEX IX_Notifications_RelatedId ON Notifications(relatedId);
    PRINT '    ✅ Created index IX_Notifications_RelatedId';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_Notifications_RelatedId already exists';
END
GO

-- ============================================================================
-- PART 2: PASSWORD RESET SYSTEM
-- ============================================================================

PRINT '';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT 'PART 2: PASSWORD RESET SYSTEM SETUP';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT '';

-- ----------------------------------------------------------------------------
-- 2.1: Add Password Reset Columns to Users Table
-- ----------------------------------------------------------------------------

PRINT '2.1 Adding password reset columns to Users table...';

-- Add isTemporaryPassword column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'isTemporaryPassword')
BEGIN
    ALTER TABLE Users ADD isTemporaryPassword BIT DEFAULT 0;
    PRINT '    ✅ Added isTemporaryPassword column';
END
ELSE
BEGIN
    PRINT '    ℹ️  isTemporaryPassword column already exists';
END
GO

-- Add passwordResetRequired column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'passwordResetRequired')
BEGIN
    ALTER TABLE Users ADD passwordResetRequired BIT DEFAULT 0;
    PRINT '    ✅ Added passwordResetRequired column';
END
ELSE
BEGIN
    PRINT '    ℹ️  passwordResetRequired column already exists';
END
GO

-- Add lastPasswordChange column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'lastPasswordChange')
BEGIN
    ALTER TABLE Users ADD lastPasswordChange DATETIME NULL;
    PRINT '    ✅ Added lastPasswordChange column';
END
ELSE
BEGIN
    PRINT '    ℹ️  lastPasswordChange column already exists';
END
GO

-- ----------------------------------------------------------------------------
-- 2.2: Create PasswordResetRequests Table
-- ----------------------------------------------------------------------------

PRINT '';
PRINT '2.2 Creating PasswordResetRequests table...';

IF OBJECT_ID('PasswordResetRequests', 'U') IS NULL
BEGIN
    CREATE TABLE PasswordResetRequests (
        -- Primary Key
        requestId VARCHAR(50) PRIMARY KEY,
        
        -- User Information
        userId VARCHAR(50) NOT NULL,
        requestedBy VARCHAR(50) NOT NULL,
        
        -- Request Details
        requestDate DATETIME NOT NULL DEFAULT GETDATE(),
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Approved, Rejected, Completed
        
        -- Resolution Details
        resolvedBy VARCHAR(50) NULL,
        resolvedDate DATETIME NULL,
        notes NVARCHAR(500) NULL,
        
        -- Foreign Keys
        CONSTRAINT FK_PasswordResetRequests_UserId FOREIGN KEY (userId) REFERENCES Users(userId),
        CONSTRAINT FK_PasswordResetRequests_RequestedBy FOREIGN KEY (requestedBy) REFERENCES Users(userId)
    );
    
    PRINT '    ✅ Created PasswordResetRequests table';
END
ELSE
BEGIN
    PRINT '    ℹ️  PasswordResetRequests table already exists';
END
GO

-- ----------------------------------------------------------------------------
-- 2.3: Create Indexes for PasswordResetRequests
-- ----------------------------------------------------------------------------

PRINT '';
PRINT '2.3 Creating indexes for PasswordResetRequests table...';

-- Index on userId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetRequests_UserId' AND object_id = OBJECT_ID('PasswordResetRequests'))
BEGIN
    CREATE INDEX IX_PasswordResetRequests_UserId ON PasswordResetRequests(userId);
    PRINT '    ✅ Created index IX_PasswordResetRequests_UserId';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_PasswordResetRequests_UserId already exists';
END
GO

-- Index on status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetRequests_Status' AND object_id = OBJECT_ID('PasswordResetRequests'))
BEGIN
    CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status);
    PRINT '    ✅ Created index IX_PasswordResetRequests_Status';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_PasswordResetRequests_Status already exists';
END
GO

-- Index on requestDate
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetRequests_RequestDate' AND object_id = OBJECT_ID('PasswordResetRequests'))
BEGIN
    CREATE INDEX IX_PasswordResetRequests_RequestDate ON PasswordResetRequests(requestDate);
    PRINT '    ✅ Created index IX_PasswordResetRequests_RequestDate';
END
ELSE
BEGIN
    PRINT '    ℹ️  Index IX_PasswordResetRequests_RequestDate already exists';
END
GO

-- ----------------------------------------------------------------------------
-- 2.4: Update Existing Users with Default Values
-- ----------------------------------------------------------------------------

PRINT '';
PRINT '2.4 Updating existing users with default values...';

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'lastPasswordChange')
BEGIN
    UPDATE Users 
    SET lastPasswordChange = GETDATE() 
    WHERE lastPasswordChange IS NULL;
    
    DECLARE @UpdatedUsers INT = @@ROWCOUNT;
    PRINT '    ✅ Updated ' + CAST(@UpdatedUsers AS VARCHAR) + ' existing users with lastPasswordChange';
END
GO

-- ============================================================================
-- PART 3: VERIFICATION
-- ============================================================================

PRINT '';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT 'PART 3: VERIFICATION';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT '';

-- ----------------------------------------------------------------------------
-- 3.1: Verify Notifications Table
-- ----------------------------------------------------------------------------

PRINT '3.1 Verifying Notifications table...';
PRINT '';

IF OBJECT_ID('Notifications', 'U') IS NOT NULL
BEGIN
    DECLARE @NotifColumns INT;
    SELECT @NotifColumns = COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Notifications';
    
    PRINT '    ✅ Notifications table exists with ' + CAST(@NotifColumns AS VARCHAR) + ' columns';
    
    -- Show structure
    SELECT 
        COLUMN_NAME as [Column],
        DATA_TYPE as [Type],
        CHARACTER_MAXIMUM_LENGTH as [Length],
        IS_NULLABLE as [Nullable]
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Notifications'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '    ❌ ERROR: Notifications table was not created!';
END
GO

-- ----------------------------------------------------------------------------
-- 3.2: Verify Password Reset Tables
-- ----------------------------------------------------------------------------

PRINT '';
PRINT '3.2 Verifying Password Reset tables...';
PRINT '';

-- Check Users table columns
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'isTemporaryPassword')
   AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'passwordResetRequired')
   AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'lastPasswordChange')
BEGIN
    PRINT '    ✅ Users table has all password reset columns';
END
ELSE
BEGIN
    PRINT '    ❌ ERROR: Users table is missing password reset columns!';
END

-- Check PasswordResetRequests table
IF OBJECT_ID('PasswordResetRequests', 'U') IS NOT NULL
BEGIN
    DECLARE @ResetColumns INT;
    SELECT @ResetColumns = COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PasswordResetRequests';
    
    PRINT '    ✅ PasswordResetRequests table exists with ' + CAST(@ResetColumns AS VARCHAR) + ' columns';
    
    -- Show structure
    SELECT 
        COLUMN_NAME as [Column],
        DATA_TYPE as [Type],
        CHARACTER_MAXIMUM_LENGTH as [Length],
        IS_NULLABLE as [Nullable]
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PasswordResetRequests'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '    ❌ ERROR: PasswordResetRequests table was not created!';
END
GO

-- ----------------------------------------------------------------------------
-- 3.3: Verify Indexes
-- ----------------------------------------------------------------------------

PRINT '';
PRINT '3.3 Verifying indexes...';
PRINT '';

-- Count Notifications indexes
DECLARE @NotifIndexes INT;
SELECT @NotifIndexes = COUNT(DISTINCT i.name)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name = 'Notifications' AND i.name IS NOT NULL;

PRINT '    ✅ Notifications table has ' + CAST(@NotifIndexes AS VARCHAR) + ' indexes';

-- Count PasswordResetRequests indexes
DECLARE @ResetIndexes INT;
SELECT @ResetIndexes = COUNT(DISTINCT i.name)
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name = 'PasswordResetRequests' AND i.name IS NOT NULL;

PRINT '    ✅ PasswordResetRequests table has ' + CAST(@ResetIndexes AS VARCHAR) + ' indexes';
GO

-- ----------------------------------------------------------------------------
-- 3.4: Show Current Data Counts
-- ----------------------------------------------------------------------------

PRINT '';
PRINT '3.4 Current data counts...';
PRINT '';

DECLARE @NotificationCount INT, @ResetRequestCount INT, @UserCount INT;

SELECT @NotificationCount = COUNT(*) FROM Notifications;
SELECT @ResetRequestCount = COUNT(*) FROM PasswordResetRequests;
SELECT @UserCount = COUNT(*) FROM Users;

PRINT '    📊 Total Users: ' + CAST(@UserCount AS VARCHAR);
PRINT '    📊 Total Notifications: ' + CAST(@NotificationCount AS VARCHAR);
PRINT '    📊 Total Password Reset Requests: ' + CAST(@ResetRequestCount AS VARCHAR);
GO

-- ============================================================================
-- PART 4: USEFUL QUERIES FOR MANAGEMENT
-- ============================================================================

PRINT '';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT 'PART 4: USEFUL MANAGEMENT QUERIES';
PRINT '════════════════════════════════════════════════════════════════════════';
PRINT '';
PRINT 'Copy and use these queries for managing the system:';
PRINT '';
PRINT '-- View unread notifications for a user:';
PRINT 'SELECT * FROM Notifications WHERE userId = ''USER0001'' AND isRead = 0 ORDER BY createdDate DESC;';
PRINT '';
PRINT '-- Count unread notifications by user:';
PRINT 'SELECT userId, COUNT(*) as UnreadCount FROM Notifications WHERE isRead = 0 GROUP BY userId;';
PRINT '';
PRINT '-- View pending password reset requests:';
PRINT 'SELECT * FROM PasswordResetRequests WHERE status = ''Pending'' ORDER BY requestDate DESC;';
PRINT '';
PRINT '-- View users with temporary passwords:';
PRINT 'SELECT UserId, Username, FullName, isTemporaryPassword, passwordResetRequired FROM Users WHERE isTemporaryPassword = 1;';
PRINT '';
PRINT '-- Mark all notifications as read for a user:';
PRINT 'UPDATE Notifications SET isRead = 1, readDate = GETDATE() WHERE userId = ''USER0001'' AND isRead = 0;';
PRINT '';
PRINT '-- Delete old notifications (older than 30 days):';
PRINT 'DELETE FROM Notifications WHERE createdDate < DATEADD(day, -30, GETDATE());';
PRINT '';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

PRINT '';
PRINT '╔════════════════════════════════════════════════════════════════════════╗';
PRINT '║                                                                        ║';
PRINT '║                    ✅ SETUP COMPLETED SUCCESSFULLY                     ║';
PRINT '║                                                                        ║';
PRINT '╚════════════════════════════════════════════════════════════════════════╝';
PRINT '';
PRINT '📋 SUMMARY:';
PRINT '   ✅ Notifications System - READY';
PRINT '      • Notifications table created';
PRINT '      • 6 indexes created for performance';
PRINT '      • Foreign key constraint to Users table';
PRINT '';
PRINT '   ✅ Password Reset System - READY';
PRINT '      • Users table updated with 3 new columns';
PRINT '      • PasswordResetRequests table created';
PRINT '      • 3 indexes created for performance';
PRINT '      • Existing users updated with default values';
PRINT '';
PRINT '🚀 NEXT STEPS:';
PRINT '   1. ✅ Database setup complete';
PRINT '   2. 🔄 Restart your backend server (Node.js)';
PRINT '   3. 🔄 Clear browser cache and refresh frontend';
PRINT '   4. ✅ Test notifications by assigning a job to a user';
PRINT '   5. ✅ Test password reset by requesting a password reset';
PRINT '';
PRINT '📅 Setup Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '💾 Database: SuperShineCargoDb';
PRINT '';
PRINT '════════════════════════════════════════════════════════════════════════';
GO
