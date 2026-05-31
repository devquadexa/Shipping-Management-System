-- ============================================================================
-- PASSWORD RESET & FORGOT PASSWORD - COMPLETE DATABASE SCRIPTS
-- ============================================================================
-- Database: SuperShineCargoDb
-- Purpose: Add password reset and forgot password functionality
-- Date: May 11, 2026
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD COLUMNS TO EXISTING USERS TABLE
-- ============================================================================

-- Add isTemporaryPassword column
-- Purpose: Flag to indicate if the user's password is temporary (set by admin)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'isTemporaryPassword')
BEGIN
    ALTER TABLE Users ADD isTemporaryPassword BIT DEFAULT 0;
    PRINT '✅ Added isTemporaryPassword column to Users table';
END
ELSE
BEGIN
    PRINT 'ℹ️  isTemporaryPassword column already exists';
END
GO

-- Add passwordResetRequired column
-- Purpose: Flag to force user to reset password on next login
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'passwordResetRequired')
BEGIN
    ALTER TABLE Users ADD passwordResetRequired BIT DEFAULT 0;
    PRINT '✅ Added passwordResetRequired column to Users table';
END
ELSE
BEGIN
    PRINT 'ℹ️  passwordResetRequired column already exists';
END
GO

-- Add lastPasswordChange column
-- Purpose: Track when the password was last changed
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'lastPasswordChange')
BEGIN
    ALTER TABLE Users ADD lastPasswordChange DATETIME NULL;
    PRINT '✅ Added lastPasswordChange column to Users table';
END
ELSE
BEGIN
    PRINT 'ℹ️  lastPasswordChange column already exists';
END
GO

-- ============================================================================
-- SECTION 2: CREATE PASSWORD RESET REQUESTS TABLE
-- ============================================================================

-- Create PasswordResetRequests table
-- Purpose: Store all password reset requests from users
IF OBJECT_ID('PasswordResetRequests', 'U') IS NULL
BEGIN
    CREATE TABLE PasswordResetRequests (
        -- Primary Key
        requestId VARCHAR(50) PRIMARY KEY,
        
        -- User Information
        userId VARCHAR(50) NOT NULL,
        requestedBy VARCHAR(50) NOT NULL,  -- User who made the request (usually same as userId)
        
        -- Request Details
        requestDate DATETIME NOT NULL DEFAULT GETDATE(),
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Approved, Rejected, Completed
        
        -- Resolution Details
        resolvedBy VARCHAR(50) NULL,  -- Super Admin who approved/rejected
        resolvedDate DATETIME NULL,
        notes NVARCHAR(500) NULL,  -- Admin notes about the request
        
        -- Foreign Keys
        CONSTRAINT FK_PasswordResetRequests_UserId FOREIGN KEY (userId) REFERENCES Users(userId),
        CONSTRAINT FK_PasswordResetRequests_RequestedBy FOREIGN KEY (requestedBy) REFERENCES Users(userId)
    );
    
    PRINT '✅ Created PasswordResetRequests table';
END
ELSE
BEGIN
    PRINT 'ℹ️  PasswordResetRequests table already exists';
END
GO

-- ============================================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on userId for faster lookups by user
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetRequests_UserId' AND object_id = OBJECT_ID('PasswordResetRequests'))
BEGIN
    CREATE INDEX IX_PasswordResetRequests_UserId ON PasswordResetRequests(userId);
    PRINT '✅ Created index IX_PasswordResetRequests_UserId';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_PasswordResetRequests_UserId already exists';
END
GO

-- Index on status for filtering by request status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetRequests_Status' AND object_id = OBJECT_ID('PasswordResetRequests'))
BEGIN
    CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status);
    PRINT '✅ Created index IX_PasswordResetRequests_Status';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_PasswordResetRequests_Status already exists';
END
GO

-- Index on requestDate for sorting by date
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PasswordResetRequests_RequestDate' AND object_id = OBJECT_ID('PasswordResetRequests'))
BEGIN
    CREATE INDEX IX_PasswordResetRequests_RequestDate ON PasswordResetRequests(requestDate);
    PRINT '✅ Created index IX_PasswordResetRequests_RequestDate';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_PasswordResetRequests_RequestDate already exists';
END
GO

-- ============================================================================
-- SECTION 4: UPDATE EXISTING USERS WITH DEFAULT VALUES
-- ============================================================================

-- Set lastPasswordChange for existing users (if not already set)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'lastPasswordChange')
BEGIN
    UPDATE Users 
    SET lastPasswordChange = GETDATE() 
    WHERE lastPasswordChange IS NULL;
    
    PRINT '✅ Updated existing users with lastPasswordChange';
END
GO

-- ============================================================================
-- SECTION 5: VERIFICATION QUERIES
-- ============================================================================

-- Verify Users table structure
PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION: Users Table Structure';
PRINT '========================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' 
AND COLUMN_NAME IN ('isTemporaryPassword', 'passwordResetRequired', 'lastPasswordChange')
ORDER BY ORDINAL_POSITION;
GO

-- Verify PasswordResetRequests table structure
PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION: PasswordResetRequests Table';
PRINT '========================================';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PasswordResetRequests'
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
WHERE t.name = 'PasswordResetRequests'
ORDER BY i.name;
GO

-- ============================================================================
-- SECTION 6: SAMPLE DATA (FOR TESTING ONLY - OPTIONAL)
-- ============================================================================

-- Uncomment the following section to insert sample password reset requests for testing

/*
-- Sample Request 1: Pending request
INSERT INTO PasswordResetRequests (requestId, userId, requestedBy, requestDate, status)
VALUES ('REQ0001', 'USER0001', 'USER0001', GETDATE(), 'Pending');

-- Sample Request 2: Approved request
INSERT INTO PasswordResetRequests (requestId, userId, requestedBy, requestDate, status, resolvedBy, resolvedDate, notes)
VALUES ('REQ0002', 'USER0002', 'USER0002', DATEADD(day, -1, GETDATE()), 'Approved', 'USER0001', GETDATE(), 'Approved - temporary password sent');

-- Sample Request 3: Rejected request
INSERT INTO PasswordResetRequests (requestId, userId, requestedBy, requestDate, status, resolvedBy, resolvedDate, notes)
VALUES ('REQ0003', 'USER0003', 'USER0003', DATEADD(day, -2, GETDATE()), 'Rejected', 'USER0001', DATEADD(day, -1, GETDATE()), 'User should contact IT department');

PRINT '✅ Inserted sample password reset requests';
*/

-- ============================================================================
-- SECTION 7: USEFUL QUERIES FOR MANAGEMENT
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT 'USEFUL MANAGEMENT QUERIES';
PRINT '========================================';
PRINT '';
PRINT '-- View all pending password reset requests:';
PRINT 'SELECT * FROM PasswordResetRequests WHERE status = ''Pending'' ORDER BY requestDate DESC;';
PRINT '';
PRINT '-- View all users with temporary passwords:';
PRINT 'SELECT UserId, Username, FullName, isTemporaryPassword, passwordResetRequired FROM Users WHERE isTemporaryPassword = 1;';
PRINT '';
PRINT '-- View password reset request history for a specific user:';
PRINT 'SELECT * FROM PasswordResetRequests WHERE userId = ''USER0001'' ORDER BY requestDate DESC;';
PRINT '';
PRINT '-- Count requests by status:';
PRINT 'SELECT status, COUNT(*) as Count FROM PasswordResetRequests GROUP BY status;';
PRINT '';
PRINT '-- View recent password changes:';
PRINT 'SELECT UserId, Username, FullName, lastPasswordChange FROM Users WHERE lastPasswordChange IS NOT NULL ORDER BY lastPasswordChange DESC;';
GO

-- ============================================================================
-- SECTION 8: CLEANUP SCRIPTS (USE WITH CAUTION)
-- ============================================================================

-- Uncomment the following section ONLY if you need to completely remove the password reset feature

/*
PRINT '';
PRINT '========================================';
PRINT 'WARNING: CLEANUP SCRIPTS';
PRINT '========================================';
PRINT 'The following scripts will REMOVE all password reset functionality';
PRINT 'Uncomment and run ONLY if you need to rollback the feature';
PRINT '';

-- Drop indexes
DROP INDEX IF EXISTS IX_PasswordResetRequests_UserId ON PasswordResetRequests;
DROP INDEX IF EXISTS IX_PasswordResetRequests_Status ON PasswordResetRequests;
DROP INDEX IF EXISTS IX_PasswordResetRequests_RequestDate ON PasswordResetRequests;
PRINT '✅ Dropped indexes';

-- Drop PasswordResetRequests table
DROP TABLE IF EXISTS PasswordResetRequests;
PRINT '✅ Dropped PasswordResetRequests table';

-- Remove columns from Users table
ALTER TABLE Users DROP COLUMN IF EXISTS isTemporaryPassword;
ALTER TABLE Users DROP COLUMN IF EXISTS passwordResetRequired;
ALTER TABLE Users DROP COLUMN IF EXISTS lastPasswordChange;
PRINT '✅ Removed password reset columns from Users table';

PRINT '';
PRINT '✅ Password reset feature completely removed';
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

PRINT '';
PRINT '========================================';
PRINT '✅ PASSWORD RESET DATABASE SETUP COMPLETE';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  ✅ Users table updated with 3 new columns';
PRINT '  ✅ PasswordResetRequests table created';
PRINT '  ✅ 3 indexes created for performance';
PRINT '  ✅ Existing users updated with default values';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Verify the changes using the verification queries above';
PRINT '  2. Restart the backend server to use the new schema';
PRINT '  3. Test user creation with temporary passwords';
PRINT '  4. Test forgot password workflow';
PRINT '';
PRINT 'Database: SuperShineCargoDb';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
GO
