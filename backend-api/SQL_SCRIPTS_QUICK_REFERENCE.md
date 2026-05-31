# Password Reset - SQL Scripts Quick Reference

## 🚀 Quick Start

### Run Complete Installation Script

```bash
sqlcmd -S localhost,63951 -d SuperShineCargoDb -U SUPER_SHINE_CARGO -P "1234@SuperShineDB" -C -i PASSWORD_RESET_DATABASE_SCRIPTS.sql
```

---

## 📋 Individual Scripts

### 1. Add Columns to Users Table

```sql
ALTER TABLE Users ADD isTemporaryPassword BIT DEFAULT 0;
ALTER TABLE Users ADD passwordResetRequired BIT DEFAULT 0;
ALTER TABLE Users ADD lastPasswordChange DATETIME NULL;
```

### 2. Create PasswordResetRequests Table

```sql
CREATE TABLE PasswordResetRequests (
    requestId VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    requestedBy VARCHAR(50) NOT NULL,
    requestDate DATETIME NOT NULL DEFAULT GETDATE(),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    resolvedBy VARCHAR(50) NULL,
    resolvedDate DATETIME NULL,
    notes NVARCHAR(500) NULL,
    FOREIGN KEY (userId) REFERENCES Users(userId),
    FOREIGN KEY (requestedBy) REFERENCES Users(userId)
);
```

### 3. Create Indexes

```sql
CREATE INDEX IX_PasswordResetRequests_UserId ON PasswordResetRequests(userId);
CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status);
CREATE INDEX IX_PasswordResetRequests_RequestDate ON PasswordResetRequests(requestDate);
```

---

## 🔍 Verification Queries

### Check if Tables Exist

```sql
-- Check Users table columns
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' 
AND COLUMN_NAME IN ('isTemporaryPassword', 'passwordResetRequired', 'lastPasswordChange');

-- Check PasswordResetRequests table
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'PasswordResetRequests';
```

### View Current Data

```sql
-- View users with temporary passwords
SELECT UserId, Username, FullName, isTemporaryPassword, passwordResetRequired 
FROM Users 
WHERE isTemporaryPassword = 1;

-- View pending requests
SELECT * FROM PasswordResetRequests 
WHERE status = 'Pending' 
ORDER BY requestDate DESC;
```

---

## 📊 Common Queries

### View All Pending Requests

```sql
SELECT 
    r.requestId,
    u.Username,
    u.FullName,
    r.requestDate,
    r.status
FROM PasswordResetRequests r
INNER JOIN Users u ON r.userId = u.UserId
WHERE r.status = 'Pending'
ORDER BY r.requestDate DESC;
```

### View Request History for User

```sql
SELECT * FROM PasswordResetRequests 
WHERE userId = 'USER0001' 
ORDER BY requestDate DESC;
```

### Count Requests by Status

```sql
SELECT status, COUNT(*) as Count 
FROM PasswordResetRequests 
GROUP BY status;
```

### View Recent Password Changes

```sql
SELECT UserId, Username, FullName, lastPasswordChange 
FROM Users 
WHERE lastPasswordChange IS NOT NULL 
ORDER BY lastPasswordChange DESC;
```

---

## 🔧 Management Scripts

### Approve Password Reset Request

```sql
-- Update request status
UPDATE PasswordResetRequests
SET 
    status = 'Approved',
    resolvedBy = 'USER0001',  -- Super Admin userId
    resolvedDate = GETDATE(),
    notes = 'Approved - temporary password assigned'
WHERE requestId = 'REQ0001';

-- Update user with temporary password
UPDATE Users
SET 
    Password = '$2b$10$hashedTempPassword',
    isTemporaryPassword = 1,
    passwordResetRequired = 1
WHERE UserId = 'USER0005';
```

### Reject Password Reset Request

```sql
UPDATE PasswordResetRequests
SET 
    status = 'Rejected',
    resolvedBy = 'USER0001',
    resolvedDate = GETDATE(),
    notes = 'Rejected - please contact IT department'
WHERE requestId = 'REQ0001';
```

### Reset User Password (Manual)

```sql
UPDATE Users
SET 
    Password = '$2b$10$newHashedPassword',
    isTemporaryPassword = 0,
    passwordResetRequired = 0,
    lastPasswordChange = GETDATE()
WHERE UserId = 'USER0005';
```

---

## 🧹 Cleanup Scripts

### Delete Old Completed Requests

```sql
DELETE FROM PasswordResetRequests
WHERE status = 'Completed'
AND resolvedDate < DATEADD(day, -90, GETDATE());
```

### Reset All Temporary Password Flags

```sql
UPDATE Users
SET 
    isTemporaryPassword = 0,
    passwordResetRequired = 0
WHERE isTemporaryPassword = 1;
```

---

## 🔄 Rollback Scripts (Use with Caution!)

### Remove Password Reset Feature

```sql
-- Drop indexes
DROP INDEX IX_PasswordResetRequests_UserId ON PasswordResetRequests;
DROP INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests;
DROP INDEX IX_PasswordResetRequests_RequestDate ON PasswordResetRequests;

-- Drop table
DROP TABLE PasswordResetRequests;

-- Remove columns from Users table
ALTER TABLE Users DROP COLUMN isTemporaryPassword;
ALTER TABLE Users DROP COLUMN passwordResetRequired;
ALTER TABLE Users DROP COLUMN lastPasswordChange;
```

---

## 📁 File Locations

| File | Purpose |
|------|---------|
| `PASSWORD_RESET_DATABASE_SCRIPTS.sql` | Complete installation script |
| `PASSWORD_RESET_DATABASE_DOCUMENTATION.md` | Full documentation |
| `SQL_SCRIPTS_QUICK_REFERENCE.md` | This quick reference |
| `add-password-reset-columns.sql` | Simplified migration script |

---

## 🎯 Quick Commands

### Connect to Database

```bash
sqlcmd -S localhost,63951 -d SuperShineCargoDb -U SUPER_SHINE_CARGO -P "1234@SuperShineDB" -C
```

### Run Script File

```bash
sqlcmd -S localhost,63951 -d SuperShineCargoDb -U SUPER_SHINE_CARGO -P "1234@SuperShineDB" -C -i SCRIPT_FILE.sql
```

### Run Single Query

```bash
sqlcmd -S localhost,63951 -d SuperShineCargoDb -U SUPER_SHINE_CARGO -P "1234@SuperShineDB" -C -Q "SELECT * FROM PasswordResetRequests"
```

---

## 📊 Database Connection Details

- **Server:** localhost,63951
- **Database:** SuperShineCargoDb
- **User:** SUPER_SHINE_CARGO
- **Password:** 1234@SuperShineDB
- **Trust Certificate:** Yes (-C flag)

---

## ✅ Installation Checklist

- [ ] Run `PASSWORD_RESET_DATABASE_SCRIPTS.sql`
- [ ] Verify Users table has 3 new columns
- [ ] Verify PasswordResetRequests table exists
- [ ] Verify 3 indexes created
- [ ] Test creating a user with temporary password
- [ ] Test submitting a password reset request
- [ ] Test approving a request
- [ ] Test rejecting a request

---

**Quick Reference Version:** 1.0  
**Last Updated:** May 11, 2026  
**Status:** Ready to Use
