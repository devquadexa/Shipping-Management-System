-- =====================================================
-- ADD GROUPID COLUMN TO PETTY CASH ASSIGNMENTS
-- =====================================================
-- This migration adds groupId column for grouping assignments
-- =====================================================

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
GO

-- Step 2: Backfill groupId for existing records
UPDATE PettyCashAssignments
SET groupId = jobId + '_' + assignedTo
WHERE groupId IS NULL;

PRINT '✓ Backfilled groupId for existing assignments';
GO

-- Step 3: Verify the update
SELECT 
  COUNT(*) as TotalAssignments,
  COUNT(groupId) as AssignmentsWithGroupId,
  COUNT(*) - COUNT(groupId) as AssignmentsWithoutGroupId
FROM PettyCashAssignments;

PRINT '';
PRINT '✓ Migration completed successfully';
PRINT '';
PRINT 'Summary:';
PRINT '- groupId column added (if it did not exist)';
PRINT '- Existing assignments backfilled with groupId = jobId_assignedTo';
PRINT '- Assignments with same job and user will now be grouped together';
