-- =====================================================
-- PARENT-CHILD PETTY CASH ASSIGNMENTS STRUCTURE
-- Run this script in SQL Server Management Studio
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

-- Step 2: Add isMainAssignment flag
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

-- Step 3: Backfill existing records as main assignments
UPDATE PettyCashAssignments
SET isMainAssignment = 1
WHERE parentAssignmentId IS NULL;

PRINT '✓ Backfill complete - existing assignments marked as main';

-- Step 4: Add foreign key constraint
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

PRINT '';
PRINT '✓ Migration completed successfully';
PRINT '';
PRINT 'Summary:';
PRINT '- Main assignments: isMainAssignment = 1, parentAssignmentId = NULL';
PRINT '- Sub assignments: isMainAssignment = 0, parentAssignmentId = [parent ID]';
PRINT '- Main assignment shows total of all sub-assignments';
