-- =====================================================
-- COMPLETE GROUPING FIX - RUN THIS SCRIPT
-- =====================================================
-- This script will:
-- 1. Add groupId column (if it doesn't exist)
-- 2. Fill groupId for all existing assignments
-- 3. Verify the results
-- =====================================================

USE SuperShineCargoDb;
GO

PRINT '=== STARTING GROUPING FIX ===';
PRINT '';

-- Step 1: Add groupId column if it doesn't exist
IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'groupId'
)
BEGIN
  ALTER TABLE PettyCashAssignments ADD groupId NVARCHAR(100) NULL;
  PRINT '✓ Added groupId column';
END
ELSE
BEGIN
  PRINT '✓ groupId column already exists';
END

PRINT '';

-- Step 2: Fill groupId for ALL assignments (including existing ones)
UPDATE PettyCashAssignments
SET groupId = jobId + '_' + assignedTo
WHERE groupId IS NULL OR groupId = '';

DECLARE @UpdatedCount INT = @@ROWCOUNT;
PRINT '✓ Updated ' + CAST(@UpdatedCount AS VARCHAR) + ' assignments with groupId';

PRINT '';

-- Step 3: Verify the results
PRINT '=== VERIFICATION ===';
PRINT '';

-- Show total counts
SELECT 
    COUNT(*) as TotalAssignments,
    COUNT(groupId) as WithGroupId,
    COUNT(*) - COUNT(groupId) as MissingGroupId
FROM PettyCashAssignments;

PRINT '';

-- Show grouping summary
PRINT 'Grouping Summary:';
PRINT '----------------';

SELECT 
    groupId,
    COUNT(*) as AssignmentCount,
    SUM(assignedAmount) as TotalAmount,
    STRING_AGG(CAST(assignmentId AS VARCHAR), ', ') as AssignmentIDs
FROM PettyCashAssignments
GROUP BY groupId
ORDER BY groupId;

PRINT '';

-- Show which groups have multiple assignments (these will be grouped in UI)
PRINT 'Groups with Multiple Assignments (will be grouped in UI):';
PRINT '--------------------------------------------------------';

SELECT 
    groupId,
    COUNT(*) as Count,
    SUM(assignedAmount) as TotalAmount
FROM PettyCashAssignments
GROUP BY groupId
HAVING COUNT(*) > 1
ORDER BY groupId;

PRINT '';
PRINT '=== FIX COMPLETED SUCCESSFULLY ===';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Restart your backend server (npm start)';
PRINT '2. Clear browser cache (Ctrl+Shift+R)';
PRINT '3. Refresh the Petty Cash page';
PRINT '4. You should now see grouped assignments';
