-- ============================================
-- Multi-User Job Assignment System
-- Version: 1.0
-- Description: Enables assigning multiple users to a single job
-- ============================================
-- This script creates all necessary database objects for the
-- multi-user job assignment feature including:
-- - JobAssignments table
-- - Stored procedures for assignment operations
-- - View for assignment summaries
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Multi-User Job Assignment System Setup';
PRINT 'Version 1.0';
PRINT '========================================';
PRINT '';

-- ============================================
-- STEP 1: Create JobAssignments Table
-- ============================================
PRINT 'Step 1: Creating JobAssignments table...';

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
BEGIN
    CREATE TABLE JobAssignments (
        assignmentId INT IDENTITY(1,1) PRIMARY KEY,
        jobId VARCHAR(50) NOT NULL,
        userId VARCHAR(50) NOT NULL,
        assignedDate DATETIME NOT NULL DEFAULT GETDATE(),
        assignedBy VARCHAR(50) NOT NULL,
        isActive BIT NOT NULL DEFAULT 1,
        notes NVARCHAR(500) NULL,
        CONSTRAINT FK_JobAssignments_Jobs FOREIGN KEY (jobId) REFERENCES Jobs(JobId),
        CONSTRAINT FK_JobAssignments_Users FOREIGN KEY (userId) REFERENCES Users(UserId),
        CONSTRAINT FK_JobAssignments_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(UserId)
    );
    
    PRINT '  ✓ JobAssignments table created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ JobAssignments table already exists';
END
GO

-- ============================================
-- STEP 2: Create Indexes for Performance
-- ============================================
PRINT '';
PRINT 'Step 2: Creating indexes...';

-- Index on jobId for faster job assignment lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobAssignments_JobId' AND object_id = OBJECT_ID('JobAssignments'))
BEGIN
    CREATE INDEX IX_JobAssignments_JobId ON JobAssignments(jobId);
    PRINT '  ✓ Index on jobId created';
END
ELSE
BEGIN
    PRINT '  ✓ Index on jobId already exists';
END

-- Index on userId for faster user job lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobAssignments_UserId' AND object_id = OBJECT_ID('JobAssignments'))
BEGIN
    CREATE INDEX IX_JobAssignments_UserId ON JobAssignments(userId);
    PRINT '  ✓ Index on userId created';
END
ELSE
BEGIN
    PRINT '  ✓ Index on userId already exists';
END

-- Composite index for active assignments
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobAssignments_JobId_IsActive' AND object_id = OBJECT_ID('JobAssignments'))
BEGIN
    CREATE INDEX IX_JobAssignments_JobId_IsActive ON JobAssignments(jobId, isActive);
    PRINT '  ✓ Composite index on jobId and isActive created';
END
ELSE
BEGIN
    PRINT '  ✓ Composite index on jobId and isActive already exists';
END
GO

-- ============================================
-- STEP 3: Create Stored Procedure - Assign Users to Job
-- ============================================
PRINT '';
PRINT 'Step 3: Creating sp_AssignUsersToJob procedure...';

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_AssignUsersToJob')
BEGIN
    DROP PROCEDURE sp_AssignUsersToJob;
    PRINT '  ✓ Dropped existing procedure';
END
GO

CREATE PROCEDURE sp_AssignUsersToJob
    @jobId VARCHAR(50),
    @userIds VARCHAR(MAX),
    @assignedBy VARCHAR(50),
    @notes NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @AssignedCount INT = 0;
    DECLARE @userId VARCHAR(50);
    DECLARE @pos INT;
    DECLARE @userIdList VARCHAR(MAX) = @userIds + ',';
    
    -- First, deactivate all existing assignments for this job
    UPDATE JobAssignments 
    SET isActive = 0 
    WHERE jobId = @jobId;
    
    -- Parse comma-separated user IDs and insert assignments
    WHILE CHARINDEX(',', @userIdList) > 0
    BEGIN
        SET @pos = CHARINDEX(',', @userIdList);
        SET @userId = LTRIM(RTRIM(SUBSTRING(@userIdList, 1, @pos - 1)));
        SET @userIdList = SUBSTRING(@userIdList, @pos + 1, LEN(@userIdList));
        
        IF LEN(@userId) > 0
        BEGIN
            -- Check if assignment already exists
            IF EXISTS (SELECT 1 FROM JobAssignments WHERE jobId = @jobId AND userId = @userId)
            BEGIN
                -- Reactivate existing assignment
                UPDATE JobAssignments 
                SET isActive = 1, 
                    assignedDate = GETDATE(),
                    assignedBy = @assignedBy,
                    notes = @notes
                WHERE jobId = @jobId AND userId = @userId;
            END
            ELSE
            BEGIN
                -- Create new assignment
                INSERT INTO JobAssignments (jobId, userId, assignedBy, notes)
                VALUES (@jobId, @userId, @assignedBy, @notes);
            END
            
            SET @AssignedCount = @AssignedCount + 1;
        END
    END
    
    SELECT @AssignedCount AS AssignedCount;
END
GO

PRINT '  ✓ sp_AssignUsersToJob procedure created';
GO

-- ============================================
-- STEP 4: Create Stored Procedure - Remove User from Job
-- ============================================
PRINT '';
PRINT 'Step 4: Creating sp_RemoveUserFromJob procedure...';

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RemoveUserFromJob')
BEGIN
    DROP PROCEDURE sp_RemoveUserFromJob;
    PRINT '  ✓ Dropped existing procedure';
END
GO

CREATE PROCEDURE sp_RemoveUserFromJob
    @jobId VARCHAR(50),
    @userId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RemovedCount INT = 0;
    
    UPDATE JobAssignments 
    SET isActive = 0 
    WHERE jobId = @jobId AND userId = @userId AND isActive = 1;
    
    SET @RemovedCount = @@ROWCOUNT;
    
    SELECT @RemovedCount AS RemovedCount;
END
GO

PRINT '  ✓ sp_RemoveUserFromJob procedure created';
GO

-- ============================================
-- STEP 5: Create View - Job Assignment Summary
-- ============================================
PRINT '';
PRINT 'Step 5: Creating vw_JobAssignmentSummary view...';

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_JobAssignmentSummary')
BEGIN
    DROP VIEW vw_JobAssignmentSummary;
    PRINT '  ✓ Dropped existing view';
END
GO

CREATE VIEW vw_JobAssignmentSummary AS
SELECT 
    ja.jobId,
    COUNT(DISTINCT ja.userId) AS assignedUserCount,
    STRING_AGG(u.FullName, ', ') AS assignedUserNames,
    STRING_AGG(ja.userId, ',') AS assignedUserIds,
    MAX(ja.assignedDate) AS lastAssignedDate
FROM JobAssignments ja
INNER JOIN Users u ON ja.userId = u.UserId
WHERE ja.isActive = 1
GROUP BY ja.jobId;
GO

PRINT '  ✓ vw_JobAssignmentSummary view created';
GO

-- ============================================
-- STEP 6: Verification
-- ============================================
PRINT '';
PRINT '========================================';
PRINT 'Verification';
PRINT '========================================';

-- Check table
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
    PRINT '✓ JobAssignments table exists';
ELSE
    PRINT '✗ JobAssignments table NOT found';

-- Check indexes
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobAssignments_JobId')
    PRINT '✓ Index on jobId exists';
ELSE
    PRINT '✗ Index on jobId NOT found';

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobAssignments_UserId')
    PRINT '✓ Index on userId exists';
ELSE
    PRINT '✗ Index on userId NOT found';

-- Check procedures
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_AssignUsersToJob')
    PRINT '✓ sp_AssignUsersToJob procedure exists';
ELSE
    PRINT '✗ sp_AssignUsersToJob procedure NOT found';

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RemoveUserFromJob')
    PRINT '✓ sp_RemoveUserFromJob procedure exists';
ELSE
    PRINT '✗ sp_RemoveUserFromJob procedure NOT found';

-- Check view
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_JobAssignmentSummary')
    PRINT '✓ vw_JobAssignmentSummary view exists';
ELSE
    PRINT '✗ vw_JobAssignmentSummary view NOT found';

PRINT '';
PRINT '========================================';
PRINT 'Setup Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Features Enabled:';
PRINT '  • Assign multiple users to a single job';
PRINT '  • View all users assigned to a job';
PRINT '  • Remove users from job assignments';
PRINT '  • Track assignment history';
PRINT '';
PRINT 'Usage:';
PRINT '  1. Create a job in the Job Management page';
PRINT '  2. Select multiple users from the dropdown';
PRINT '  3. All selected users will see the job when they login';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Restart your backend server';
PRINT '  2. Refresh your browser';
PRINT '  3. Test creating a job with multiple users';
PRINT '';
GO

-- ============================================
-- STEP 7: Sample Test Query (Optional)
-- ============================================
PRINT '========================================';
PRINT 'Sample Test Queries';
PRINT '========================================';
PRINT '';
PRINT '-- View all active job assignments:';
PRINT 'SELECT ja.assignmentId, ja.jobId, ja.userId, u.FullName, ja.assignedDate';
PRINT 'FROM JobAssignments ja';
PRINT 'INNER JOIN Users u ON ja.userId = u.UserId';
PRINT 'WHERE ja.isActive = 1;';
PRINT '';
PRINT '-- View assignment summary for all jobs:';
PRINT 'SELECT * FROM vw_JobAssignmentSummary;';
PRINT '';
PRINT '-- Test assigning users to a job:';
PRINT 'EXEC sp_AssignUsersToJob @jobId = ''JOB0001'', @userIds = ''USER001,USER002'', @assignedBy = ''ADMIN001'';';
PRINT '';
GO
