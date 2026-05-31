-- Add password reset columns to Users table
-- Run this script to add the necessary columns for password reset functionality

-- Check if columns exist before adding them
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'isTemporaryPassword')
BEGIN
    ALTER TABLE Users ADD isTemporaryPassword BIT DEFAULT 0;
    PRINT 'Added isTemporaryPassword column';
END
ELSE
BEGIN
    PRINT 'isTemporaryPassword column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'passwordResetRequired')
BEGIN
    ALTER TABLE Users ADD passwordResetRequired BIT DEFAULT 0;
    PRINT 'Added passwordResetRequired column';
END
ELSE
BEGIN
    PRINT 'passwordResetRequired column already exists';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'lastPasswordChange')
BEGIN
    ALTER TABLE Users ADD lastPasswordChange DATETIME NULL;
    PRINT 'Added lastPasswordChange column';
END
ELSE
BEGIN
    PRINT 'lastPasswordChange column already exists';
END

-- Create PasswordResetRequests table if it doesn't exist
IF OBJECT_ID('PasswordResetRequests', 'U') IS NULL
BEGIN
    CREATE TABLE PasswordResetRequests (
        requestId VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        requestedBy VARCHAR(50) NOT NULL,
        requestDate DATETIME NOT NULL DEFAULT GETDATE(),
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        resolvedBy VARCHAR(50) NULL,
        resolvedDate DATETIME NULL,
        notes NVARCHAR(500) NULL,
        FOREIGN KEY (userId) REFERENCES Users(userId),
        FOREIGN KEY (requestedBy) REFERENCES Users(userId)
    );
    
    CREATE INDEX IX_PasswordResetRequests_UserId ON PasswordResetRequests(userId);
    CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status);
    CREATE INDEX IX_PasswordResetRequests_RequestDate ON PasswordResetRequests(requestDate);
    
    PRINT 'Created PasswordResetRequests table';
END
ELSE
BEGIN
    PRINT 'PasswordResetRequests table already exists';
END

-- Update existing users to have lastPasswordChange set (only if column exists)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'lastPasswordChange')
BEGIN
    UPDATE Users 
    SET lastPasswordChange = GETDATE() 
    WHERE lastPasswordChange IS NULL;
    
    PRINT 'Updated existing users with lastPasswordChange';
END

PRINT 'Password reset migration completed successfully';
