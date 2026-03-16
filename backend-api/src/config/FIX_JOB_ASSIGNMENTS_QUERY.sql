-- ============================================
-- FIX JOB ASSIGNMENTS QUERY
-- Super Shine Cargo Service Management System
-- ============================================
-- This script will test and fix the job assignments query
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'FIXING JOB ASSIGNMENTS QUERY';
PRINT '============================================';
PRINT '';

-- Step 1: Check actual column names in Jobs table
PRINT 'Step 1: Checking Jobs table column names...';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Jobs'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- Step 2: Check actual column names in JobAssignments table
PRINT 'Step 2: Checking JobAssignments table column names...';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'JobAssignments'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- Step 3: Test different query variations to find the working one
PRINT 'Step 3: Testing query variations...';

DECLARE @TestUserId VARCHAR(50) = 'USER0006'; -- Waff Clerk 01

PRINT 'Testing with user: ' + @TestUserId;
PRINT '';

-- Test 1: Original query (likely failing)
PRINT 'Test 1: Original query (j.jobId = ja.jobId)';
BEGIN TRY
    SELECT COUNT(*) as ResultCount FROM (
        SELECT DISTINCT j.* 
        FROM Jobs j
        INNER JOIN JobAssignments ja ON j.jobId = ja.jobId
        WHERE ja.userId = @TestUserId
    ) as Results;
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- Test 2: Try with different case combinations
PRINT 'Test 2: Mixed case query (j.JobId = ja.jobId)';
BEGIN TRY
    SELECT COUNT(*) as ResultCount FROM (
        SELECT DISTINCT j.* 
        FROM Jobs j
        INNER JOIN JobAssignments ja ON j.JobId = ja.jobId
        WHERE ja.userId = @TestUserId
    ) as Results;
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- Test 3: Try with all uppercase
PRINT 'Test 3: Uppercase query (j.JOBID = ja.JOBID)';
BEGIN TRY
    SELECT COUNT(*) as ResultCount FROM (
        SELECT DISTINCT j.* 
        FROM Jobs j
        INNER JOIN JobAssignments ja ON j.JOBID = ja.JOBID
        WHERE ja.USERID = @TestUserId
    ) as Results;
END TRY
BEGIN CATCH
    PRINT 'ERROR: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- Test 4: Manual check of the data
PRINT 'Test 4: Manual data verification';
PRINT 'Jobs table sample:';
SELECT TOP 3 * FROM Jobs WHERE jobId LIKE 'JOB%' ORDER BY openDate DESC;

PRINT '';
PRINT 'JobAssignments table sample:';
SELECT TOP 5 * FROM JobAssignments ORDER BY assignedDate DESC;

PRINT '';

-- Test 5: Direct join test
PRINT 'Test 5: Direct join test for JOB0006';
SELECT 
    j.jobId as JobId_from_Jobs,
    ja.jobId as JobId_from_JobAssignments,
    ja.userId,
    u.fullName
FROM Jobs j
INNER JOIN JobAssignments ja ON j.jobId = ja.jobId
INNER JOIN Users u ON ja.userId = u.userId
WHERE j.jobId = 'JOB0006';

PRINT '';
PRINT '============================================';
PRINT 'DIAGNOSIS COMPLETE';
PRINT '============================================';

GO