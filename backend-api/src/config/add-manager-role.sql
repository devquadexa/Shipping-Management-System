-- Add Manager Role to Users Table
-- This script updates the CHECK constraint to include the Manager role

USE SuperShineCargoDb;
GO

-- Drop the existing CHECK constraint
ALTER TABLE Users
DROP CONSTRAINT CK__Users__Role__5DCAEF64;
GO

-- Add the new CHECK constraint with Manager role included
ALTER TABLE Users
ADD CONSTRAINT CK_Users_Role 
CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'User'));
GO

PRINT 'Manager role has been added to the Users table CHECK constraint successfully.';
GO
