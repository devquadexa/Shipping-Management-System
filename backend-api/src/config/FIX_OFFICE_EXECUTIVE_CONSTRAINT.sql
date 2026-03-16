-- Fix Users Table CHECK Constraint to Include Office Executive Role
-- This script updates the database constraint to allow Office Executive role registration

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Fixing Users Table Role Constraint';
PRINT 'Issue: Office Executive role not in constraint';
PRINT '========================================';
PRINT '';

-- Step 1: Check current constraint
PRINT 'Step 1: Checking current constraint...';
SELECT 
    name AS ConstraintName,
    definition AS ConstraintDefinition
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('Users')
AND name = 'CK_Users_Role';

PRINT '';

-- Step 2: Drop the existing CHECK constraint
PRINT 'Step 2: Dropping existing CHECK constraint...';
BEGIN TRY
    IF EXISTS (
        SELECT 1 
        FROM sys.check_constraints 
        WHERE name = 'CK_Users_Role' 
        AND parent_object_id = OBJECT_ID('Users')
    )
    BEGIN
        ALTER TABLE Users DROP CONSTRAINT CK_Users_Role;
        PRINT '✓ Old constraint dropped successfully';
    END
    ELSE
    BEGIN
        PRINT '⚠ Constraint CK_Users_Role not found';
    END
END TRY
BEGIN CATCH
    PRINT '✗ Error dropping constraint: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- Step 3: Add new CHECK constraint with Office Executive included
PRINT 'Step 3: Adding new CHECK constraint with Office Executive...';
BEGIN TRY
    ALTER TABLE Users
    ADD CONSTRAINT CK_Users_Role 
    CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Office Executive', 'Waff Clerk'));
    
    PRINT '✓ New constraint added successfully';
    PRINT '';
    PRINT 'Valid roles are now:';
    PRINT '  - Super Admin';
    PRINT '  - Admin';
    PRINT '  - Manager';
    PRINT '  - Office Executive';
    PRINT '  - Waff Clerk';
END TRY
BEGIN CATCH
    PRINT '✗ Error adding constraint: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- Step 4: Verify the constraint
PRINT 'Step 4: Verifying constraint...';
SELECT 
    name AS ConstraintName,
    definition AS ConstraintDefinition
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('Users')
AND name = 'CK_Users_Role';

PRINT '';
PRINT '========================================';
PRINT 'Constraint Fix Complete';
PRINT '========================================';
PRINT 'You can now create users with Office Executive role';
PRINT '';

GO
