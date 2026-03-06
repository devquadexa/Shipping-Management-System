-- Update Job Status Constraint to Support New Status Values
-- This script removes the old CHECK constraint and adds a new one with updated status values

USE SuperShineCargoDb;
GO

-- Drop the existing CHECK constraints (there might be multiple)
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK__Jobs__Status__477199F1')
BEGIN
    ALTER TABLE Jobs DROP CONSTRAINT CK__Jobs__Status__477199F1;
    PRINT 'Old status constraint CK__Jobs__Status__477199F1 dropped successfully';
END
GO

IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Jobs_Status')
BEGIN
    ALTER TABLE Jobs DROP CONSTRAINT CK_Jobs_Status;
    PRINT 'Old status constraint CK_Jobs_Status dropped successfully';
END
GO

-- Add new CHECK constraint with updated status values
ALTER TABLE Jobs
ADD CONSTRAINT CK_Jobs_Status CHECK (
    Status IN (
        'Open', 
        'In Progress', 
        'Pending Payment', 
        'Payment Collected', 
        'Overdue', 
        'Completed', 
        'Canceled',
        -- Legacy statuses for backward compatibility
        'Started',
        'Cancelled'
    )
);
GO

PRINT 'New status constraint added successfully';
PRINT 'Allowed statuses: Open, In Progress, Pending Payment, Payment Collected, Overdue, Completed, Canceled';
GO

-- Verify the constraint
SELECT 
    OBJECT_NAME(parent_object_id) AS TableName,
    name AS ConstraintName,
    definition AS ConstraintDefinition
FROM sys.check_constraints
WHERE OBJECT_NAME(parent_object_id) = 'Jobs'
    AND name LIKE '%Status%';
GO
