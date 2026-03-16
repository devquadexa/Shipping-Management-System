-- QUICK FIX: Office Executive Registration Error
-- Execute this script to fix the database constraint

USE SuperShineCargoDb;
GO

-- Drop old constraint
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_Role' AND parent_object_id = OBJECT_ID('Users'))
BEGIN
    ALTER TABLE Users DROP CONSTRAINT CK_Users_Role;
    PRINT '✓ Old constraint dropped';
END

-- Add new constraint with Office Executive
ALTER TABLE Users
ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Office Executive', 'Waff Clerk'));

PRINT '✓ New constraint added with Office Executive';

-- Verify
SELECT definition FROM sys.check_constraints 
WHERE name = 'CK_Users_Role' AND parent_object_id = OBJECT_ID('Users');

PRINT '✓ Fix complete - Office Executive users can now be created';
GO
