-- =====================================================
-- PARENT-CHILD PETTY CASH ASSIGNMENTS STRUCTURE
-- =====================================================
-- This migration adds parent-child relationship for petty cash assignments
-- Main assignment shows total, sub-assignments show individual amounts
-- =====================================================

-- Step 1: Add parentAssignmentId column
IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'parentAssignmentId'
)
BEGIN
  ALTER TABLE PettyCashAssignments ADD parentAssignmentId INT NULL;
  PRINT '✓ Added parentAssignmentId column';
END
ELSE
BEGIN
  PRINT '✓ parentAssignmentId column already exists';
END

-- Step 2: Add foreign key constraint
IF NOT EXISTS (
  SELECT * FROM sys.foreign_keys 
  WHERE name = 'FK_PettyCashAssignments_Parent'
)
BEGIN
  ALTER TABLE PettyCashAssignments
  ADD CONSTRAINT FK_PettyCashAssignments_Parent
  FOREIGN KEY (parentAssignmentId) REFERENCES PettyCashAssignments(assignmentId);
  PRINT '✓ Added foreign key constraint';
END
ELSE
BEGIN
  PRINT '✓ Foreign key constraint already exists';
END

-- Step 3: Add isMainAssignment flag
IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'isMainAssignment'
)
BEGIN
  ALTER TABLE PettyCashAssignments ADD isMainAssignment BIT NOT NULL DEFAULT 1;
  PRINT '✓ Added isMainAssignment column';
END
ELSE
BEGIN
  PRINT '✓ isMainAssignment column already exists';
END

-- Step 4: Backfill existing records as main assignments
UPDATE PettyCashAssignments
SET isMainAssignment = 1
WHERE parentAssignmentId IS NULL;

PRINT '✓ Backfill complete - existing assignments marked as main';
GO

-- Step 5: Create view for easy querying
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_PettyCashAssignmentsWithChildren')
BEGIN
  DROP VIEW vw_PettyCashAssignmentsWithChildren;
END;
GO

CREATE VIEW vw_PettyCashAssignmentsWithChildren AS
SELECT 
  parent.assignmentId,
  parent.jobId,
  parent.assignedTo,
  parent.assignedBy,
  parent.assignedAmount as mainAmount,
  parent.assignedDate,
  parent.status,
  parent.settlementDate,
  parent.actualSpent,
  parent.balanceAmount,
  parent.overAmount,
  parent.notes,
  parent.groupId,
  parent.isMainAssignment,
  parent.parentAssignmentId,
  (
    SELECT SUM(assignedAmount) 
    FROM PettyCashAssignments 
    WHERE parentAssignmentId = parent.assignmentId OR assignmentId = parent.assignmentId
  ) as totalAssignedAmount,
  (
    SELECT COUNT(*) 
    FROM PettyCashAssignments 
    WHERE parentAssignmentId = parent.assignmentId
  ) as subAssignmentCount
FROM PettyCashAssignments parent
WHERE parent.isMainAssignment = 1;
GO

PRINT '✓ Created view vw_PettyCashAssignmentsWithChildren';

PRINT '';
PRINT '✓ Migration completed successfully';
PRINT '';
PRINT 'Summary:';
PRINT '- Main assignments: isMainAssignment = 1, parentAssignmentId = NULL';
PRINT '- Sub assignments: isMainAssignment = 0, parentAssignmentId = [parent ID]';
PRINT '- Main assignment shows total of all sub-assignments';
PRINT '- Waff clerk settles entire group as one record';
