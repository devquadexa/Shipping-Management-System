-- ============================================
-- Rename "User" Role to "Waff Clerk"
-- Super Shine Cargo Service Management System
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '============================================';
PRINT 'Renaming User role to Waff Clerk';
PRINT '============================================';
PRINT '';

-- Step 1: Drop existing role constraint FIRST
PRINT 'Step 1: Dropping existing role constraint...';
DECLARE @ConstraintName NVARCHAR(200);
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('Users') 
AND definition LIKE '%Role%';

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @DropSQL NVARCHAR(500);
    SET @DropSQL = 'ALTER TABLE Users DROP CONSTRAINT ' + @ConstraintName;
    EXEC sp_executesql @DropSQL;
    PRINT '✓ Dropped old constraint: ' + @ConstraintName;
END
ELSE
BEGIN
    PRINT '⚠ No role constraint found to drop';
END
PRINT '';

-- Step 2: Update all existing users with 'User' role to 'Waff Clerk'
PRINT 'Step 2: Updating existing users...';
DECLARE @UpdateCount INT;
UPDATE Users 
SET role = 'Waff Clerk' 
WHERE role = 'User';
SET @UpdateCount = @@ROWCOUNT;
PRINT '✓ Updated ' + CAST(@UpdateCount AS VARCHAR) + ' user(s) from User to Waff Clerk';
PRINT '';

-- Step 3: Add new constraint with 'Waff Clerk' instead of 'User'
PRINT 'Step 3: Adding new constraint...';
ALTER TABLE Users ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk'));
PRINT '✓ Added new constraint with Waff Clerk role';
PRINT '';

-- Step 4: Verify the changes
PRINT '============================================';
PRINT 'Verification';
PRINT '============================================';
PRINT '';

-- Check constraint
IF EXISTS (SELECT * FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('Users') AND definition LIKE '%Waff Clerk%')
    PRINT '✓ Users.Role constraint includes Waff Clerk'
ELSE
    PRINT '✗ Users.Role constraint MISSING Waff Clerk';

-- Check user records
DECLARE @WaffClerkCount INT;
SELECT @WaffClerkCount = COUNT(*) FROM Users WHERE role = 'Waff Clerk';
PRINT '✓ Total Waff Clerk users: ' + CAST(@WaffClerkCount AS VARCHAR);

-- Check for any remaining 'User' role
DECLARE @OldUserCount INT;
SELECT @OldUserCount = COUNT(*) FROM Users WHERE role = 'User';
IF @OldUserCount > 0
    PRINT '⚠ Warning: ' + CAST(@OldUserCount AS VARCHAR) + ' user(s) still have User role'
ELSE
    PRINT '✓ No users with old User role found';

PRINT '';
PRINT '============================================';
PRINT 'Role Rename Complete!';
PRINT '============================================';
PRINT '';
PRINT 'Current Users by Role:';
SELECT role, COUNT(*) as count 
FROM Users 
GROUP BY role 
ORDER BY role;

GO
