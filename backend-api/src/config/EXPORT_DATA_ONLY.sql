-- ============================================
-- Export Data as INSERT Statements
-- ============================================
-- Run this on YOUR database to export data
-- This will generate INSERT statements for all your data
-- ============================================

USE SuperShineCargoDb;
GO

PRINT '========================================';
PRINT 'Exporting Data as INSERT Statements';
PRINT '========================================';
PRINT '';
PRINT '-- Copy the output below and save as IMPORT_DATA.sql';
PRINT '-- Then send to developer to run after COMPLETE_DATABASE_SETUP.sql';
PRINT '';
PRINT '-- ============================================';
PRINT '-- Data Import Script';
PRINT '-- Generated from: ' + CAST(GETDATE() AS VARCHAR(50));
PRINT '-- ============================================';
PRINT '';
PRINT 'USE SuperShineCargoDb;';
PRINT 'GO';
PRINT '';

-- ============================================
-- Export Categories
-- ============================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- Categories Data';
PRINT '-- ============================================';
PRINT '';

DECLARE @SQL NVARCHAR(MAX);

SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
    'INSERT INTO Categories (categoryName, description, isActive) VALUES (' +
    '''' + categoryName + ''', ' +
    CASE WHEN description IS NULL THEN 'NULL' ELSE '''' + REPLACE(description, '''', '''''') + '''' END + ', ' +
    CAST(isActive AS VARCHAR(1)) + ');'
FROM Categories;

PRINT @SQL;

-- ============================================
-- Export Users (excluding passwords for security)
-- ============================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- Users Data (passwords need to be reset)';
PRINT '-- ============================================';
PRINT '';

SET @SQL = '';
SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
    'INSERT INTO Users (userId, username, password, fullName, email, role, isActive) VALUES (' +
    '''' + userId + ''', ' +
    '''' + username + ''', ' +
    '''admin123'', ' + -- Default password for all users
    '''' + REPLACE(fullName, '''', '''''') + ''', ' +
    '''' + email + ''', ' +
    '''' + role + ''', ' +
    CAST(isActive AS VARCHAR(1)) + ');'
FROM Users
WHERE username != 'admin'; -- Skip admin as it's created by setup script

PRINT @SQL;
PRINT '';
PRINT '-- NOTE: All user passwords set to ''admin123'' - users should change them';

-- ============================================
-- Export Customers
-- ============================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- Customers Data';
PRINT '-- ============================================';
PRINT '';

SET @SQL = '';
SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
    'INSERT INTO Customers (customerId, name, address, phone, email, categoryId, creditPeriodDays, isActive) VALUES (' +
    '''' + customerId + ''', ' +
    '''' + REPLACE(name, '''', '''''') + ''', ' +
    CASE WHEN address IS NULL THEN 'NULL' ELSE '''' + REPLACE(address, '''', '''''') + '''' END + ', ' +
    CASE WHEN phone IS NULL THEN 'NULL' ELSE '''' + phone + '''' END + ', ' +
    CASE WHEN email IS NULL THEN 'NULL' ELSE '''' + email + '''' END + ', ' +
    CASE WHEN categoryId IS NULL THEN 'NULL' ELSE CAST(categoryId AS VARCHAR(10)) END + ', ' +
    CASE WHEN creditPeriodDays IS NULL THEN '30' ELSE CAST(creditPeriodDays AS VARCHAR(10)) END + ', ' +
    CAST(isActive AS VARCHAR(1)) + ');'
FROM Customers;

PRINT @SQL;

-- ============================================
-- Export Contact Persons
-- ============================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ContactPersons')
BEGIN
    PRINT '';
    PRINT '-- ============================================';
    PRINT '-- Contact Persons Data';
    PRINT '-- ============================================';
    PRINT '';

    SET @SQL = '';
    SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
        'INSERT INTO ContactPersons (customerId, name, designation, phone, email, isPrimary, isActive) VALUES (' +
        '''' + customerId + ''', ' +
        '''' + REPLACE(name, '''', '''''') + ''', ' +
        CASE WHEN designation IS NULL THEN 'NULL' ELSE '''' + REPLACE(designation, '''', '''''') + '''' END + ', ' +
        CASE WHEN phone IS NULL THEN 'NULL' ELSE '''' + phone + '''' END + ', ' +
        CASE WHEN email IS NULL THEN 'NULL' ELSE '''' + email + '''' END + ', ' +
        CAST(isPrimary AS VARCHAR(1)) + ', ' +
        CAST(isActive AS VARCHAR(1)) + ');'
    FROM ContactPersons;

    PRINT @SQL;
END

-- ============================================
-- Export Jobs
-- ============================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- Jobs Data';
PRINT '-- ============================================';
PRINT '';

SET @SQL = '';
SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
    'INSERT INTO Jobs (jobId, customerId, shipmentCategory, openDate, status, assignedTo, pettyCashStatus, notes, payItems) VALUES (' +
    '''' + jobId + ''', ' +
    '''' + customerId + ''', ' +
    '''' + REPLACE(shipmentCategory, '''', '''''') + ''', ' +
    '''' + CONVERT(VARCHAR(23), openDate, 121) + ''', ' +
    '''' + Status + ''', ' +
    CASE WHEN assignedTo IS NULL THEN 'NULL' ELSE '''' + assignedTo + '''' END + ', ' +
    CASE WHEN pettyCashStatus IS NULL THEN '''Not Assigned''' ELSE '''' + pettyCashStatus + '''' END + ', ' +
    CASE WHEN notes IS NULL THEN 'NULL' ELSE '''' + REPLACE(notes, '''', '''''') + '''' END + ', ' +
    CASE WHEN payItems IS NULL THEN 'NULL' ELSE '''' + REPLACE(payItems, '''', '''''') + '''' END + ');'
FROM Jobs;

PRINT @SQL;

-- ============================================
-- Export Bills
-- ============================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Bills')
BEGIN
    PRINT '';
    PRINT '-- ============================================';
    PRINT '-- Bills Data';
    PRINT '-- ============================================';
    PRINT '';

    SET @SQL = '';
    SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
        'INSERT INTO Bills (jobId, billingAmount, paymentStatus, invoiceDate, dueDate, isOverdue, paidDate, notes) VALUES (' +
        '''' + jobId + ''', ' +
        CAST(billingAmount AS VARCHAR(20)) + ', ' +
        '''' + paymentStatus + ''', ' +
        CASE WHEN invoiceDate IS NULL THEN 'GETDATE()' ELSE '''' + CONVERT(VARCHAR(23), invoiceDate, 121) + '''' END + ', ' +
        CASE WHEN dueDate IS NULL THEN 'NULL' ELSE '''' + CONVERT(VARCHAR(23), dueDate, 121) + '''' END + ', ' +
        CAST(isOverdue AS VARCHAR(1)) + ', ' +
        CASE WHEN paidDate IS NULL THEN 'NULL' ELSE '''' + CONVERT(VARCHAR(23), paidDate, 121) + '''' END + ', ' +
        CASE WHEN notes IS NULL THEN 'NULL' ELSE '''' + REPLACE(notes, '''', '''''') + '''' END + ');'
    FROM Bills;

    PRINT @SQL;
END

-- ============================================
-- Export Petty Cash Entries
-- ============================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCashEntries')
BEGIN
    PRINT '';
    PRINT '-- ============================================';
    PRINT '-- Petty Cash Entries Data';
    PRINT '-- ============================================';
    PRINT '';

    SET @SQL = '';
    SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
        'INSERT INTO PettyCashEntries (entryType, amount, description, entryDate, createdBy) VALUES (' +
        '''' + entryType + ''', ' +
        CAST(amount AS VARCHAR(20)) + ', ' +
        CASE WHEN description IS NULL THEN 'NULL' ELSE '''' + REPLACE(description, '''', '''''') + '''' END + ', ' +
        '''' + CONVERT(VARCHAR(23), entryDate, 121) + ''', ' +
        CASE WHEN createdBy IS NULL THEN 'NULL' ELSE '''' + createdBy + '''' END + ');'
    FROM PettyCashEntries;

    PRINT @SQL;
END

-- ============================================
-- Export Petty Cash Assignments
-- ============================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCashAssignments')
BEGIN
    PRINT '';
    PRINT '-- ============================================';
    PRINT '-- Petty Cash Assignments Data';
    PRINT '-- ============================================';
    PRINT '';

    SET @SQL = '';
    SELECT @SQL = COALESCE(@SQL + CHAR(13) + CHAR(10), '') + 
        'INSERT INTO PettyCashAssignments (jobId, assignedTo, assignedBy, assignedAmount, actualSpent, balanceAmount, overAmount, status, assignedDate, settlementDate, notes) VALUES (' +
        '''' + jobId + ''', ' +
        '''' + assignedTo + ''', ' +
        '''' + assignedBy + ''', ' +
        CAST(assignedAmount AS VARCHAR(20)) + ', ' +
        CASE WHEN actualSpent IS NULL THEN 'NULL' ELSE CAST(actualSpent AS VARCHAR(20)) END + ', ' +
        CASE WHEN balanceAmount IS NULL THEN 'NULL' ELSE CAST(balanceAmount AS VARCHAR(20)) END + ', ' +
        CASE WHEN overAmount IS NULL THEN 'NULL' ELSE CAST(overAmount AS VARCHAR(20)) END + ', ' +
        '''' + status + ''', ' +
        '''' + CONVERT(VARCHAR(23), assignedDate, 121) + ''', ' +
        CASE WHEN settlementDate IS NULL THEN 'NULL' ELSE '''' + CONVERT(VARCHAR(23), settlementDate, 121) + '''' END + ', ' +
        CASE WHEN notes IS NULL THEN 'NULL' ELSE '''' + REPLACE(notes, '''', '''''') + '''' END + ');'
    FROM PettyCashAssignments;

    PRINT @SQL;
END

PRINT '';
PRINT 'GO';
PRINT '';
PRINT '-- ============================================';
PRINT '-- Data Import Completed';
PRINT '-- ============================================';
PRINT '';

GO
