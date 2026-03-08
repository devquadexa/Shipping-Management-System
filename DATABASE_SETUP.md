# Database Setup - Quick Guide

## For New Developers

This guide will help you set up the SQL Server database for Super Shine Cargo Service.

---

## Quick Setup Steps

### 1. Install SQL Server Express

Download and install: https://www.microsoft.com/en-us/sql-server/sql-server-downloads

- Choose "Basic" installation
- Note your server name (usually `localhost\SQLEXPRESS`)
- Set SA password during installation

### 2. Enable TCP/IP and Set Port

1. Open **SQL Server Configuration Manager**
2. Go to: `SQL Server Network Configuration` → `Protocols for SQLEXPRESS`
3. Enable **TCP/IP**
4. Right-click TCP/IP → Properties → IP Addresses tab
5. Scroll to **IPAll** section
6. Set **TCP Port** to `1433` (or `53181` if 1433 is in use)
7. Restart SQL Server service

### 3. Run Database Setup Script

Open **SQL Server Management Studio (SSMS)** and run this complete script:

```sql
-- ============================================
-- Super Shine Cargo Service - Database Setup
-- ============================================

-- Step 1: Create Login
USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'SUPER_SHINE_CARGO')
BEGIN
    CREATE LOGIN SUPER_SHINE_CARGO 
    WITH PASSWORD = 'SuperShine@2024',
    CHECK_POLICY = OFF;
    PRINT '✓ Login created';
END
ELSE
    PRINT '✓ Login already exists';
GO

-- Step 2: Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SuperShineCargoDb')
BEGIN
    CREATE DATABASE SuperShineCargoDb;
    PRINT '✓ Database created';
END
ELSE
    PRINT '✓ Database already exists';
GO

-- Step 3: Create User and Grant Permissions
USE SuperShineCargoDb;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'SUPER_SHINE_CARGO')
BEGIN
    CREATE USER SUPER_SHINE_CARGO FOR LOGIN SUPER_SHINE_CARGO;
    ALTER ROLE db_owner ADD MEMBER SUPER_SHINE_CARGO;
    PRINT '✓ User created and permissions granted';
END
ELSE
    PRINT '✓ User already exists';
GO

PRINT '';
PRINT '========================================';
PRINT 'Database setup completed successfully!';
PRINT '========================================';
PRINT 'Database: SuperShineCargoDb';
PRINT 'Username: SUPER_SHINE_CARGO';
PRINT 'Password: SuperShine@2024';
PRINT '';
PRINT 'Next step: Run the schema initialization scripts';
```

### 4. Initialize Database Schema

Run these SQL scripts in order (located in `backend-api/src/config/`):

1. **init-database.sql** - Creates all tables
2. **add-contact-person-fields.sql** - Adds contact person fields
3. **add-credit-period-and-invoice-tracking.sql** - Adds invoice tracking
4. **add-pay-items-settings.sql** - Adds pay items
5. **add-petty-cash-workflow.sql** - Adds petty cash workflow
6. **update-job-status-constraint.sql** - Updates job status
7. **update-existing-jobs-petty-cash-status.sql** - Updates existing jobs
8. **add-manager-role.sql** - Adds Manager role

**To run each script in SSMS:**
- File → Open → Select the SQL file
- Press F5 or click Execute

### 5. Create First Super Admin User

```sql
USE SuperShineCargoDb;
GO

-- Create Super Admin
INSERT INTO Users (userId, username, password, fullName, email, role, createdDate, isActive)
VALUES 
('SA_001', 'admin', 'admin123', 'System Administrator', 'admin@supershine.lk', 'Super Admin', GETDATE(), 1);
GO

PRINT 'Super Admin created!';
PRINT 'Username: admin';
PRINT 'Password: admin123';
```

### 6. Update Backend .env File

Create/edit `backend-api/.env`:

```env
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=SuperShineCargoDb
DB_USER=SUPER_SHINE_CARGO
DB_PASSWORD=SuperShine@2024
DB_ENCRYPT=false

PORT=5000
JWT_SECRET=your-secret-key-change-this
NODE_ENV=development
```

**Important:** Change `DB_PORT` to match your SQL Server port!

---

## Verify Setup

Run this query to verify all tables exist:

```sql
USE SuperShineCargoDb;
GO

SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

Expected tables:
- Bills
- Categories
- ContactPersons
- Customers
- Jobs
- PayItemTemplates
- PettyCashAssignments
- PettyCashEntries
- PettyCashSettlementItems
- Users

---

## Test Connection

From `backend-api` folder:

```bash
node src/config/database.js
```

Should show: `✅ Connected to MSSQL database`

---

## Common Issues

### "Login failed for user"
- Enable SQL Server Authentication (Mixed Mode)
- Restart SQL Server service after enabling

### "Cannot connect to server"
- Check SQL Server service is running
- Verify TCP/IP is enabled
- Check port number matches .env file

### "SSL/TLS error"
- Set `DB_ENCRYPT=false` in .env file

---

## Connection String Format

```
Server: localhost,1433
Database: SuperShineCargoDb
User: SUPER_SHINE_CARGO
Password: SuperShine@2024
```

---

## Need Help?

1. Check SETUP_GUIDE.md for detailed instructions
2. Review error messages in console
3. Verify SQL Server service is running
4. Check Windows Firewall settings

---

**Quick Reference:**
- Default Port: 1433 (or 53181)
- Database Name: SuperShineCargoDb
- Username: SUPER_SHINE_CARGO
- Password: SuperShine@2024
- Default Admin: admin / admin123
