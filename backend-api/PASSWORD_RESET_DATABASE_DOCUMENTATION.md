# Password Reset & Forgot Password - Database Documentation

## 📊 Database Structure Overview

This document provides complete database structure and SQL scripts for the Password Reset and Forgot Password feature.

---

## 🗄️ Database Tables

### 1. Users Table (Modified)

**Existing Table:** `Users`  
**Action:** Added 3 new columns

#### New Columns Added:

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `isTemporaryPassword` | BIT | No | 0 | Indicates if the current password is temporary (set by admin) |
| `passwordResetRequired` | BIT | No | 0 | Forces user to reset password on next login |
| `lastPasswordChange` | DATETIME | Yes | NULL | Timestamp of last password change |

#### Complete Users Table Structure:

```sql
CREATE TABLE Users (
    -- Existing columns
    UserId VARCHAR(50) PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,  -- Now stores bcrypt hashed passwords
    FullName VARCHAR(200) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    Email VARCHAR(200) NOT NULL,
    CreatedDate DATETIME NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    -- New password reset columns
    isTemporaryPassword BIT DEFAULT 0,
    passwordResetRequired BIT DEFAULT 0,
    lastPasswordChange DATETIME NULL
);
```

---

### 2. PasswordResetRequests Table (New)

**New Table:** `PasswordResetRequests`  
**Purpose:** Store all password reset requests from users

#### Table Structure:

```sql
CREATE TABLE PasswordResetRequests (
    -- Primary Key
    requestId VARCHAR(50) PRIMARY KEY,
    
    -- User Information
    userId VARCHAR(50) NOT NULL,
    requestedBy VARCHAR(50) NOT NULL,
    
    -- Request Details
    requestDate DATETIME NOT NULL DEFAULT GETDATE(),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    
    -- Resolution Details
    resolvedBy VARCHAR(50) NULL,
    resolvedDate DATETIME NULL,
    notes NVARCHAR(500) NULL,
    
    -- Foreign Keys
    CONSTRAINT FK_PasswordResetRequests_UserId 
        FOREIGN KEY (userId) REFERENCES Users(userId),
    CONSTRAINT FK_PasswordResetRequests_RequestedBy 
        FOREIGN KEY (requestedBy) REFERENCES Users(userId)
);
```

#### Column Details:

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `requestId` | VARCHAR(50) | No | - | Unique identifier for the request (PK) |
| `userId` | VARCHAR(50) | No | - | User who needs password reset (FK to Users) |
| `requestedBy` | VARCHAR(50) | No | - | User who created the request (FK to Users) |
| `requestDate` | DATETIME | No | GETDATE() | When the request was created |
| `status` | VARCHAR(20) | No | 'Pending' | Request status (Pending/Approved/Rejected/Completed) |
| `resolvedBy` | VARCHAR(50) | Yes | NULL | Super Admin who resolved the request (FK to Users) |
| `resolvedDate` | DATETIME | Yes | NULL | When the request was resolved |
| `notes` | NVARCHAR(500) | Yes | NULL | Admin notes about the request |

#### Status Values:

- **Pending**: Request submitted, awaiting Super Admin review
- **Approved**: Super Admin approved and assigned temporary password
- **Rejected**: Super Admin rejected the request
- **Completed**: User successfully reset their password

---

## 🔑 Indexes

### PasswordResetRequests Table Indexes:

```sql
-- Index on userId for faster user lookups
CREATE INDEX IX_PasswordResetRequests_UserId 
ON PasswordResetRequests(userId);

-- Index on status for filtering by request status
CREATE INDEX IX_PasswordResetRequests_Status 
ON PasswordResetRequests(status);

-- Index on requestDate for sorting by date
CREATE INDEX IX_PasswordResetRequests_RequestDate 
ON PasswordResetRequests(requestDate);
```

**Purpose:**
- Improve query performance when filtering by user, status, or date
- Speed up Super Admin dashboard queries
- Optimize request history lookups

---

## 📝 Complete SQL Scripts

### Installation Script

**File:** `PASSWORD_RESET_DATABASE_SCRIPTS.sql`

This comprehensive script includes:
1. ✅ Add columns to Users table
2. ✅ Create PasswordResetRequests table
3. ✅ Create indexes
4. ✅ Update existing users with default values
5. ✅ Verification queries
6. ✅ Sample data (optional)
7. ✅ Useful management queries
8. ✅ Cleanup scripts (for rollback)

### How to Run:

```bash
# Using sqlcmd
sqlcmd -S localhost,63951 -d SuperShineCargoDb -U SUPER_SHINE_CARGO -P "1234@SuperShineDB" -C -i PASSWORD_RESET_DATABASE_SCRIPTS.sql

# Using SQL Server Management Studio (SSMS)
# 1. Open SSMS
# 2. Connect to your database
# 3. Open PASSWORD_RESET_DATABASE_SCRIPTS.sql
# 4. Execute (F5)
```

---

## 🔍 Useful Queries

### 1. View All Pending Password Reset Requests

```sql
SELECT 
    r.requestId,
    r.userId,
    u.Username,
    u.FullName,
    r.requestDate,
    r.status
FROM PasswordResetRequests r
INNER JOIN Users u ON r.userId = u.UserId
WHERE r.status = 'Pending'
ORDER BY r.requestDate DESC;
```

### 2. View All Users with Temporary Passwords

```sql
SELECT 
    UserId,
    Username,
    FullName,
    Email,
    isTemporaryPassword,
    passwordResetRequired,
    lastPasswordChange
FROM Users
WHERE isTemporaryPassword = 1
ORDER BY lastPasswordChange DESC;
```

### 3. View Password Reset Request History for a User

```sql
SELECT 
    r.requestId,
    r.requestDate,
    r.status,
    r.resolvedDate,
    admin.FullName AS ResolvedBy,
    r.notes
FROM PasswordResetRequests r
LEFT JOIN Users admin ON r.resolvedBy = admin.UserId
WHERE r.userId = 'USER0001'  -- Replace with actual userId
ORDER BY r.requestDate DESC;
```

### 4. Count Requests by Status

```sql
SELECT 
    status,
    COUNT(*) AS RequestCount
FROM PasswordResetRequests
GROUP BY status
ORDER BY RequestCount DESC;
```

### 5. View Recent Password Changes

```sql
SELECT 
    UserId,
    Username,
    FullName,
    lastPasswordChange,
    DATEDIFF(day, lastPasswordChange, GETDATE()) AS DaysSinceChange
FROM Users
WHERE lastPasswordChange IS NOT NULL
ORDER BY lastPasswordChange DESC;
```

### 6. Find Users Who Haven't Changed Password in 90 Days

```sql
SELECT 
    UserId,
    Username,
    FullName,
    lastPasswordChange,
    DATEDIFF(day, lastPasswordChange, GETDATE()) AS DaysSinceChange
FROM Users
WHERE lastPasswordChange IS NOT NULL
AND DATEDIFF(day, lastPasswordChange, GETDATE()) > 90
ORDER BY lastPasswordChange ASC;
```

### 7. View Complete Request Details with User Information

```sql
SELECT 
    r.requestId,
    r.requestDate,
    r.status,
    u.Username AS RequestedUser,
    u.FullName AS RequestedUserName,
    u.Email AS RequestedUserEmail,
    requester.Username AS RequestedByUsername,
    resolver.FullName AS ResolvedByName,
    r.resolvedDate,
    r.notes
FROM PasswordResetRequests r
INNER JOIN Users u ON r.userId = u.UserId
INNER JOIN Users requester ON r.requestedBy = requester.UserId
LEFT JOIN Users resolver ON r.resolvedBy = resolver.UserId
ORDER BY r.requestDate DESC;
```

---

## 🔄 Data Flow Examples

### Example 1: User Creation with Temporary Password

```sql
-- Super Admin creates a new user
INSERT INTO Users (
    UserId, Username, Password, FullName, Role, Email, 
    CreatedDate, IsActive, isTemporaryPassword, 
    passwordResetRequired, lastPasswordChange
)
VALUES (
    'USER0005',
    'john.doe',
    '$2b$10$hashedPasswordHere',  -- bcrypt hashed
    'John Doe',
    'Waff Clerk',
    'john.doe@example.com',
    GETDATE(),
    1,
    1,  -- isTemporaryPassword = true
    1,  -- passwordResetRequired = true
    GETDATE()
);
```

### Example 2: User Submits Forgot Password Request

```sql
-- User submits password reset request
INSERT INTO PasswordResetRequests (
    requestId, userId, requestedBy, requestDate, status
)
VALUES (
    'REQ' + FORMAT(GETDATE(), 'yyyyMMddHHmmss'),
    'USER0005',
    'USER0005',
    GETDATE(),
    'Pending'
);
```

### Example 3: Super Admin Approves Request

```sql
-- Super Admin approves the request
UPDATE PasswordResetRequests
SET 
    status = 'Approved',
    resolvedBy = 'USER0001',  -- Super Admin userId
    resolvedDate = GETDATE(),
    notes = 'Approved - temporary password: TempPass123'
WHERE requestId = 'REQ20260511120000';

-- Update user with temporary password
UPDATE Users
SET 
    Password = '$2b$10$newHashedTempPassword',
    isTemporaryPassword = 1,
    passwordResetRequired = 1
WHERE UserId = 'USER0005';
```

### Example 4: User Resets Password

```sql
-- User successfully resets password
UPDATE Users
SET 
    Password = '$2b$10$newHashedPermanentPassword',
    isTemporaryPassword = 0,
    passwordResetRequired = 0,
    lastPasswordChange = GETDATE()
WHERE UserId = 'USER0005';

-- Mark request as completed
UPDATE PasswordResetRequests
SET status = 'Completed'
WHERE userId = 'USER0005' 
AND status = 'Approved';
```

---

## 🛡️ Security Considerations

### Password Storage

- **Hashing Algorithm:** bcrypt with 10 rounds
- **Storage:** Passwords stored as hashed strings (60 characters)
- **Format:** `$2b$10$...` (bcrypt hash format)

### Password Migration

The system supports both plain text (legacy) and hashed passwords:

```sql
-- Check if password is hashed
SELECT 
    UserId,
    Username,
    CASE 
        WHEN Password LIKE '$2%' THEN 'Hashed (bcrypt)'
        ELSE 'Plain Text (Legacy)'
    END AS PasswordType
FROM Users;
```

**Auto-Migration:** When a user with plain text password logs in, the system automatically hashes their password.

---

## 📊 Database Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Users Table                          │
├─────────────────────────────────────────────────────────────┤
│ UserId (PK)                                                  │
│ Username                                                     │
│ Password (bcrypt hashed)                                     │
│ FullName                                                     │
│ Role                                                         │
│ Email                                                        │
│ CreatedDate                                                  │
│ IsActive                                                     │
│ isTemporaryPassword ← NEW                                    │
│ passwordResetRequired ← NEW                                  │
│ lastPasswordChange ← NEW                                     │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ FK: userId
                              │ FK: requestedBy
                              │ FK: resolvedBy
                              │
┌─────────────────────────────────────────────────────────────┐
│                PasswordResetRequests Table                   │
├─────────────────────────────────────────────────────────────┤
│ requestId (PK)                                               │
│ userId (FK → Users.UserId)                                   │
│ requestedBy (FK → Users.UserId)                              │
│ requestDate                                                  │
│ status (Pending/Approved/Rejected/Completed)                 │
│ resolvedBy (FK → Users.UserId)                               │
│ resolvedDate                                                 │
│ notes                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Queries

### Test 1: Verify Table Structure

```sql
-- Check Users table columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users'
AND COLUMN_NAME IN ('isTemporaryPassword', 'passwordResetRequired', 'lastPasswordChange');

-- Check PasswordResetRequests table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'PasswordResetRequests'
ORDER BY ORDINAL_POSITION;
```

### Test 2: Verify Indexes

```sql
SELECT 
    i.name AS IndexName,
    c.name AS ColumnName,
    i.type_desc AS IndexType
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('PasswordResetRequests')
ORDER BY i.name;
```

### Test 3: Verify Foreign Keys

```sql
SELECT 
    fk.name AS ForeignKeyName,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
WHERE tp.name = 'PasswordResetRequests';
```

---

## 🔧 Maintenance Scripts

### Clean Up Old Completed Requests (Older than 90 days)

```sql
DELETE FROM PasswordResetRequests
WHERE status = 'Completed'
AND resolvedDate < DATEADD(day, -90, GETDATE());
```

### Archive Old Requests

```sql
-- Create archive table (run once)
CREATE TABLE PasswordResetRequests_Archive (
    requestId VARCHAR(50),
    userId VARCHAR(50),
    requestedBy VARCHAR(50),
    requestDate DATETIME,
    status VARCHAR(20),
    resolvedBy VARCHAR(50),
    resolvedDate DATETIME,
    notes NVARCHAR(500),
    archivedDate DATETIME DEFAULT GETDATE()
);

-- Move old completed requests to archive
INSERT INTO PasswordResetRequests_Archive
SELECT *, GETDATE()
FROM PasswordResetRequests
WHERE status = 'Completed'
AND resolvedDate < DATEADD(day, -90, GETDATE());

-- Delete archived requests from main table
DELETE FROM PasswordResetRequests
WHERE status = 'Completed'
AND resolvedDate < DATEADD(day, -90, GETDATE());
```

---

## 📋 Backup and Restore

### Backup Password Reset Data

```sql
-- Backup PasswordResetRequests table
SELECT * INTO PasswordResetRequests_Backup_20260511
FROM PasswordResetRequests;

-- Backup Users password-related columns
SELECT 
    UserId, Username, isTemporaryPassword, 
    passwordResetRequired, lastPasswordChange
INTO Users_PasswordData_Backup_20260511
FROM Users;
```

### Restore from Backup

```sql
-- Restore PasswordResetRequests
TRUNCATE TABLE PasswordResetRequests;
INSERT INTO PasswordResetRequests
SELECT requestId, userId, requestedBy, requestDate, status, 
       resolvedBy, resolvedDate, notes
FROM PasswordResetRequests_Backup_20260511;
```

---

## 📞 Support and Troubleshooting

### Common Issues

**Issue 1: Foreign Key Constraint Error**
```sql
-- Check if referenced users exist
SELECT DISTINCT userId FROM PasswordResetRequests
WHERE userId NOT IN (SELECT UserId FROM Users);
```

**Issue 2: Duplicate Request IDs**
```sql
-- Find duplicate request IDs
SELECT requestId, COUNT(*) as Count
FROM PasswordResetRequests
GROUP BY requestId
HAVING COUNT(*) > 1;
```

**Issue 3: Orphaned Requests**
```sql
-- Find requests for deleted users
SELECT r.*
FROM PasswordResetRequests r
LEFT JOIN Users u ON r.userId = u.UserId
WHERE u.UserId IS NULL;
```

---

## 📄 File Reference

- **Main Script:** `PASSWORD_RESET_DATABASE_SCRIPTS.sql`
- **Documentation:** `PASSWORD_RESET_DATABASE_DOCUMENTATION.md` (this file)
- **Migration Script:** `add-password-reset-columns.sql` (simplified version)

---

**Database:** SuperShineCargoDb  
**Version:** 1.0  
**Last Updated:** May 11, 2026  
**Status:** Production Ready
