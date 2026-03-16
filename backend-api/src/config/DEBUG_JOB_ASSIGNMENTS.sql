-- ============================================
-- DEBUG JOB ASSIGNMENTS
-- Super Shine Cargo Service Management System
-- ============================================
-- This script will help debug why Waff Clerks can't see their assigned jobs
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'DEBUGGING JOB ASSIGNMENTS';
PRINT '============================================';
PRINT '';

-- Step 1: Check if JobAssignments table exists and has data
PRINT 'Step 1: Checking JobAssignments table...';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
BEGIN
    PRINT '✓ JobAssignments table exists';
    
    SELECT COUNT(*) as TotalAssignments FROM JobAssignments;
    PRINT 'Total assignments in JobAssignments table:';
    
    -- Show all assignments
    PRINT '';
    PRINT 'All Job Assignments:';
    SELECT 
        ja.assignmentId,
        ja.jobId,
        ja.userId,
        u.fullName as UserName,
        u.role as UserRole,
        ja.assignedDate,
        ja.assignedBy
    FROM JobAssignments ja
    LEFT JOIN Users u ON ja.userId = u.userId
    ORDER BY ja.assignedDate DESC;
END
ELSE
BEGIN
    PRINT '✗ JobAssignments table does not exist!';
END

PRINT '';

-- Step 2: Check Jobs table
PRINT 'Step 2: Checking Jobs table...';
PRINT 'Recent Jobs (last 10):';
SELECT TOP 10
    jobId,
    customerId,
    shipmentCategory,
    status,
    assignedTo,
    openDate
FROM Jobs
ORDER BY openDate DESC;

PRINT '';

-- Step 3: Check specific job JOB0006
PRINT 'Step 3: Checking JOB0006 specifically...';
IF EXISTS (SELECT * FROM Jobs WHERE jobId = 'JOB0006')
BEGIN
    PRINT '✓ JOB0006 exists in Jobs table';
    
    SELECT 
        jobId,
        customerId,
        shipmentCategory,
        status,
        assignedTo,
        openDate
    FROM Jobs 
    WHERE jobId = 'JOB0006';
    
    -- Check assignments for JOB0006
    IF EXISTS (SELECT * FROM sys.tables WHERE name = 'JobAssignments')
    BEGIN
        PRINT '';
        PRINT 'Assignments for JOB0006:';
        SELECT 
            ja.assignmentId,
            ja.jobId,
            ja.userId,
            u.fullName as UserName,
            u.role as UserRole,
            ja.assignedDate
        FROM JobAssignments ja
        LEFT JOIN Users u ON ja.userId = u.userId
        WHERE ja.jobId = 'JOB0006';
    END
END
ELSE
BEGIN
    PRINT '✗ JOB0006 does not exist in Jobs table!';
END

PRINT '';

-- Step 4: Check Waff Clerk users
PRINT 'Step 4: Checking Waff Clerk users...';
SELECT 
    userId,
    fullName,
    email,
    role
FROM Users 
WHERE role = 'Waff Clerk'
ORDER BY fullName;

PRINT '';

-- Step 5: Test the query that should return jobs for Waff Clerks
PRINT 'Step 5: Testing job retrieval query...';
PRINT 'Jobs that should be visible to Waff Clerks:';

-- Get a Waff Clerk user ID for testing
DECLARE @TestUserId VARCHAR(50);
SELECT TOP 1 @TestUserId = userId FROM Users WHERE role = 'Waff Clerk';

IF @TestUserId IS NOT NULL
BEGIN
    PRINT 'Testing with user: ' + @TestUserId;
    
    -- Test the actual query used by the repository
    SELECT DISTINCT j.* 
    FROM Jobs j
    INNER JOIN JobAssignments ja ON j.jobId = ja.jobId
    WHERE ja.userId = @TestUserId
    ORDER BY j.openDate DESC;
    
    PRINT '';
    PRINT 'Legacy assignments (assignedTo field):';
    SELECT * FROM Jobs WHERE assignedTo = @TestUserId ORDER BY openDate DESC;
END
ELSE
BEGIN
    PRINT '✗ No Waff Clerk users found!';
END

PRINT '';
PRINT '============================================';
PRINT 'DEBUG COMPLETE';
PRINT '============================================';

GO