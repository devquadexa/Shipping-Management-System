-- Add groupId to PettyCashAssignments to support grouped assignments
-- (multiple assignments for same job + same clerk)

IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'groupId'
)
BEGIN
  ALTER TABLE PettyCashAssignments ADD groupId NVARCHAR(100) NULL;
  PRINT 'Added groupId column to PettyCashAssignments';
END
ELSE
BEGIN
  PRINT 'groupId column already exists';
END
