-- Drop unique key constraint on Customers.Email to allow duplicate emails

ALTER TABLE Customers DROP CONSTRAINT UQ__Customer__A9D105343AA9EB68;
GO

PRINT 'Unique constraint on Customers.Email dropped successfully';
GO
