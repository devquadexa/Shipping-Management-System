-- ============================================
-- TEST JOB ASSIGNMENTS
-- Super Shine Cargo Service Management System
-- ============================================
-- This script will test if job assignments are working correctly
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'TESTING JOB ASSIGNMENTS';
PRINT '============================================';
PRINT '';

-- Test 1: Check if JOB0006 exists
PRINT 'Test 1: Checking if JOB0006 exists...';
IF EXISTS (SELECT * FROM Jobs WHERE jobId = 'JOB0006')
BEGIN
    PRINT '✓ JOB0006 exists';
    
    SELECT 
        jobId,
        customerId,
        shipmentCategory,
        status,
        assignedTo,
        openDate
    FROM Jobs 
    WHERE jobId = 'JOB0006';
END
ELSE
BEGIN
    PRINT '✗ JOB0006 does not exist';
END

PRINT '';

-- Test 2: Check JobAssignments for JOB0006
PRINT 'Test 2: Checking JobAssignments for JOB0006...';
IF EXISTS (SELECT * FROM JobAssignments WHERE jobId = 'JOB0006')
BEGIN
    PRINT '✓ JOB0006 has assignments';
    
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
    WHERE ja.jobId = 'JOB0006';
END
ELSE
BEGIN
    PRINT '✗ JOB0006 has no assignments in JobAssignments table';
END

PRINT '';

-- Test 3: Test the query that Waff Clerks use to see their jobs
PRINT 'Test 3: Testing Waff Clerk job visibility...';

-- Get Waff Clerk user IDs
DECLARE @WaffClerk1 VARCHAR(50), @WaffClerk2 VARCHAR(50);

SELECT TOP 1 @WaffClerk1 = userId FROM Users WHERE role = 'Waff Clerk' AND fullName LIKE '%01%';
SELECT TOP 1 @WaffClerk2 = userId FROM Users WHERE role = 'Waff Clerk' AND fullName LIKE '%02%';

PRINT 'Waff Clerk 1 ID: ' + ISNULL(@WaffClerk1, 'NOT FOUND');
PRINT 'Waff Clerk 2 ID: ' + ISNULL(@WaffClerk2, 'NOT FOUND');

IF @WaffClerk1 IS NOT NULL
BEGIN
    PRINT '';
    PRINT 'Jobs visible to Waff Clerk 1 (' + @WaffClerk1 + '):';
    
    -- Test the exact query used by the repository
    SELECT DISTINCT j.* 
    FROM Jobs j
    INNER JOIN JobAssignments ja ON j.jobId = ja.jobId
    WHERE ja.userId = @WaffClerk1
    ORDER BY j.openDate DESC;
    
    -- Also check legacy assignments
    PRINT '';
    PRINT 'Legacy assignments for Waff Clerk 1:';
    SELECT * FROM Jobs WHERE assignedTo = @WaffClerk1;
END

IF @WaffClerk2 IS NOT NULL
BEGIN
    PRINT '';
    PRINT 'Jobs visible to Waff Clerk 2 (' + @WaffClerk2 + '):';
    
    -- Test the exact query used by the repository
    SELECT DISTINCT j.* 
    FROM Jobs j
    INNER JOIN JobAssignments ja ON j.jobId = ja.jobId
    WHERE ja.userId = @WaffClerk2
    ORDER BY j.openDate DESC;
    
    -- Also check legacy assignments
    PRINT '';
    PRINT 'Legacy assignments for Waff Clerk 2:';
    SELECT * FROM Jobs WHERE assignedTo = @WaffClerk2;
END

PRINT '';

-- Test 4: Manual assignment test (if needed)
PRINT 'Test 4: Manual assignment verification...';
PRINT 'If JOB0006 should be assigned to both Waff Clerks but isn''t showing, run this:';
PRINT '';
PRINT '-- Manual assignment commands (uncomment if needed):';
PRINT '-- INSERT INTO JobAssignments (jobId, userId, assignedBy) VALUES (''JOB0006'', ''' + ISNULL(@WaffClerk1, 'WAFF_CLERK_1_ID') + ''', ''admin'');';
PRINT '-- INSERT INTO JobAssignments (jobId, userId, assignedBy) VALUES (''JOB0006'', ''' + ISNULL(@WaffClerk2, 'WAFF_CLERK_2_ID') + ''', ''admin'');';

PRINT '';
PRINT '============================================';
PRINT 'TEST COMPLETE';
PRINT '============================================';

GO