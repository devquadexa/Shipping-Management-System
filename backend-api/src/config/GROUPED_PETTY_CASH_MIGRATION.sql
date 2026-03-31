-- =====================================================
-- GROUPED PETTY CASH ASSIGNMENTS MIGRATION
-- =====================================================
-- This migration adds support for grouping multiple petty cash
-- assignments for the same job and same waff clerk.
--
-- Example: JOB0001 assigned to Waff Clerk 01
--   - Assignment #001: LKR 10,000
--   - Assignment #002: LKR 10,000
--   - Total Group: LKR 20,000 (2 assignments)
--
-- The waff clerk settles all assignments in the group together.
-- =====================================================

-- Step 1: Add groupId column to PettyCashAssignments table
IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'groupId'
)
BEGIN
  ALTER TABLE PettyCashAssignments ADD groupId NVARCHAR(100) NULL;
  PRINT '✓ Added groupId column to PettyCashAssignments';
END
ELSE
BEGIN
  PRINT '✓ groupId column already exists';
END

-- Step 2: Backfill existing records with groupId (jobId + assignedTo)
UPDATE PettyCashAssignments
SET groupId = jobId + '_' + assignedTo
WHERE groupId IS NULL;

PRINT '✓ Backfill complete - existing assignments grouped by job+user';

-- Step 3: Verify the migration
SELECT 
  COUNT(*) as TotalAssignments,
  COUNT(DISTINCT groupId) as TotalGroups,
  COUNT(*) - COUNT(DISTINCT groupId) as MultipleAssignmentsInGroups
FROM PettyCashAssignments;

PRINT '✓ Migration completed successfully';
PRINT '';
PRINT 'Summary:';
PRINT '- Multiple assignments for same job+user will share a groupId';
PRINT '- Waff clerks can settle all assignments in a group together';
PRINT '- Each assignment maintains its own record and settlement items';
PRINT '- UI shows grouped view with expandable details';
