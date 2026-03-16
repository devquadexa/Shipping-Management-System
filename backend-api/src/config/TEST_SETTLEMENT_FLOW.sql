-- ============================================
-- TEST SETTLEMENT FLOW
-- Super Shine Cargo Service Management System
-- ============================================
-- This script tests the complete settlement flow
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'TESTING COMPLETE SETTLEMENT FLOW';
PRINT '============================================';
PRINT '';

-- Test 1: Check if JOB0006 has petty cash assignments
PRINT 'Test 1: Checking petty cash assignments for JOB0006...';
SELECT 
    pa.assignmentId,
    pa.jobId,
    pa.assignedTo,
    u.fullName as AssignedToName,
    pa.assignedAmount,
    pa.status,
    pa.actualSpent,
    pa.settlementDate
FROM PettyCashAssignments pa
LEFT JOIN Users u ON pa.assignedTo = u.userId
WHERE pa.jobId = 'JOB0006';

PRINT '';

-- Test 2: Check settlement items for JOB0006 assignments
PRINT 'Test 2: Checking settlement items...';
SELECT 
    si.settlementItemId,
    si.assignmentId,
    si.itemName,
    si.actualCost,
    si.isCustomItem,
    si.paidBy,
    u.fullName as PaidByName,
    si.createdDate
FROM PettyCashSettlementItems si
LEFT JOIN Users u ON si.paidBy = u.userId
INNER JOIN PettyCashAssignments pa ON si.assignmentId = pa.assignmentId
WHERE pa.jobId = 'JOB0006'
ORDER BY si.createdDate DESC;

PRINT '';

-- Test 3: Check if JOB0006 has pay items
PRINT 'Test 3: Checking pay items for JOB0006...';
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PayItems')
BEGIN
    SELECT 
        pi.payItemId,
        pi.jobId,
        pi.description,
        pi.actualCost,
        pi.billingAmount,
        pi.addedBy,
        pi.addedDate
    FROM PayItems pi
    WHERE pi.jobId = 'JOB0006'
    ORDER BY pi.addedDate DESC;
END
ELSE
BEGIN
    PRINT '⚠ PayItems table does not exist';
END

PRINT '';

-- Test 4: Check job status
PRINT 'Test 4: Checking job status...';
SELECT 
    jobId,
    customerId,
    shipmentCategory,
    status,
    pettyCashStatus,
    assignedTo,
    openDate
FROM Jobs 
WHERE jobId = 'JOB0006';

PRINT '';

-- Test 5: Test the view that should be used by the API
PRINT 'Test 5: Testing settlement items view...';
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SettlementItemsWithUsers')
BEGIN
    SELECT * FROM vw_SettlementItemsWithUsers 
    WHERE jobId = 'JOB0006'
    ORDER BY createdDate DESC;
END
ELSE
BEGIN
    PRINT '⚠ vw_SettlementItemsWithUsers view does not exist';
END

PRINT '';

-- Test 6: Manual test of the API query
PRINT 'Test 6: Manual API query test...';
PRINT 'This simulates what the API should return:';

SELECT 
    pa.assignmentId,
    pa.jobId,
    pa.assignedTo,
    pa.assignedAmount,
    pa.status,
    pa.actualSpent,
    pa.balanceAmount,
    pa.overAmount,
    pa.settlementDate,
    u.fullName as assignedToName,
    (
        SELECT 
            si.settlementItemId,
            si.itemName,
            si.actualCost,
            si.isCustomItem,
            si.paidBy,
            pu.fullName as paidByName
        FROM PettyCashSettlementItems si
        LEFT JOIN Users pu ON si.paidBy = pu.userId
        WHERE si.assignmentId = pa.assignmentId
        FOR JSON PATH
    ) as settlementItemsJson
FROM PettyCashAssignments pa
LEFT JOIN Users u ON pa.assignedTo = u.userId
WHERE pa.jobId = 'JOB0006'
AND pa.status = 'Settled';

PRINT '';
PRINT '============================================';
PRINT 'TEST COMPLETE';
PRINT '============================================';
PRINT '';
PRINT 'Expected Results:';
PRINT '1. JOB0006 should have petty cash assignments';
PRINT '2. Assignments should have settlement items';
PRINT '3. Settlement items should have paidBy information';
PRINT '4. Job should have pettyCashStatus = "Settled"';
PRINT '5. PayItems table should have entries for JOB0006';

GO