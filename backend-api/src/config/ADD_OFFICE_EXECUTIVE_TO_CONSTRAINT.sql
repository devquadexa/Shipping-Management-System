-- Update Users Table CHECK Constraint to Include Office Executive Role
-- This script removes the old constraint and adds a new one with Office Executive

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Updating Users Table Role Constraint';
PRINT '========================================';
PRINT '';

-- Step 1: Drop the existing CHECK constraint
PRINT 'Step 1: Dropping existing CHECK constraint...';
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
        PRINT '⚠ Constraint CK_Users_Role not found (may have different name)';
        
        -- Try to find and drop any role constraint
        DECLARE @ConstraintName NVARCHAR(200);
        SELECT @ConstraintName = name 
        FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('Users')
        AND definition LIKE '%Role%';
        
        IF @ConstraintName IS NOT NULL
        BEGIN
            DECLARE @SQL NVARCHAR(MAX);
            SET @SQL = 'ALTER TABLE Users DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
            EXEC sp_executesql @SQL;
            PRINT '✓ Found and dropped constraint: ' + @ConstraintName;
        END
    END
END TRY
BEGIN CATCH
    PRINT '✗ Error dropping constraint: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- Step 2: Add new CHECK constraint with Office Executive included
PRINT 'Step 2: Adding new CHECK constraint with Office Executive...';
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
    PRINT '  - Office Executive (NEW)';
    PRINT '  - Waff Clerk';
END TRY
BEGIN CATCH
    PRINT '✗ Error adding constraint: ' + ERROR_MESSAGE();
END CATCH

PRINT '';

-- Step 3: Verify the constraint
PRINT 'Step 3: Verifying constraint...';
SELECT 
    name AS ConstraintName,
    definition AS ConstraintDefinition
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('Users')
AND name = 'CK_Users_Role';

PRINT '';
PRINT '========================================';
PRINT 'Constraint Update Complete';
PRINT '========================================';
PRINT 'You can now create users with Office Executive role';
PRINT '';

GO
