-- Add Office Executive Role to the System
-- Office Executive can:
-- - Access Dashboard
-- - Add, Edit, Delete Customers
-- - Access Job Management
-- - Add Office Pay Items
-- - NO access to view billing amounts

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Adding Office Executive Role';
PRINT '========================================';

-- Check if Office Executive role already exists
IF NOT EXISTS (SELECT 1 FROM Users WHERE role = 'Office Executive')
BEGIN
    PRINT 'Office Executive role does not exist in Users table yet';
    PRINT 'Role will be available for new user creation';
END
ELSE
BEGIN
    PRINT 'Office Executive role already exists in system';
    SELECT userId, username, fullName, role, email 
    FROM Users 
    WHERE role = 'Office Executive';
END

PRINT '';
PRINT '========================================';
PRINT 'Office Executive Permissions Summary';
PRINT '========================================';
PRINT '✓ Dashboard Access: YES';
PRINT '✓ Customer Management: YES (Add, Edit, Delete)';
PRINT '✓ Job Management: YES (Full Access)';
PRINT '✓ Office Pay Items: YES (Add payments)';
PRINT '✗ Billing Amounts: NO (Hidden)';
PRINT '✗ Invoicing: NO';
PRINT '✗ Accounting Dashboard: NO';
PRINT '✗ User Management: NO';
PRINT '';

-- Sample user creation (commented out - uncomment to create a test user)
/*
DECLARE @newUserId VARCHAR(50);
DECLARE @hashedPassword VARCHAR(255);

-- Generate next user ID
SELECT @newUserId = 'USR' + RIGHT('000000' + CAST(ISNULL(MAX(CAST(SUBSTRING(userId, 4, 6) AS INT)), 0) + 1 AS VARCHAR), 6)
FROM Users
WHERE userId LIKE 'USR%';

-- Hash password (use bcrypt in application, this is just a placeholder)
SET @hashedPassword = 'hashed_password_here';

-- Insert Office Executive user
INSERT INTO Users (userId, username, password, fullName, role, email, createdDate, updatedDate)
VALUES (
    @newUserId,
    'office.executive',
    @hashedPassword,
    'Office Executive',
    'Office Executive',
    'executive@supershine.com',
    GETDATE(),
    GETDATE()
);

PRINT 'Sample Office Executive user created:';
PRINT 'Username: office.executive';
PRINT 'Role: Office Executive';
PRINT 'User ID: ' + @newUserId;
*/

PRINT '';
PRINT '========================================';
PRINT 'Role Addition Complete';
PRINT '========================================';
PRINT 'Office Executive role is now available in the system';
PRINT 'Create users with this role through the User Management interface';
PRINT '';

GO
