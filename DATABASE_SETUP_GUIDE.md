# Super Shine Cargo Service - Production Database Setup Guide

## 📋 Overview

This guide will help you set up the **Notifications System** and **Password Reset functionality** on your production database.

---

## 🎯 Features Included

### 1. Notifications System
- Real-time notifications for job assignments
- Petty cash assignment notifications
- Job status update notifications
- Payment received notifications
- Mark as read/unread functionality
- Notification history tracking

### 2. Password Reset System
- Forgot password functionality
- Admin-initiated password reset
- Temporary password support
- Password reset request tracking
- Force password change on next login

---

## ⚠️ IMPORTANT: Before You Start

### Prerequisites
1. **Backup your database** - Always backup before running any scripts
2. **SQL Server Management Studio (SSMS)** - Installed and configured
3. **Database access** - You need admin/owner permissions on SuperShineCargoDb
4. **Backend server** - Should be stopped during database updates

### Backup Command
```sql
BACKUP DATABASE SuperShineCargoDb 
TO DISK = 'C:\Backups\SuperShineCargoDb_Backup_20260531.bak'
WITH FORMAT, INIT, NAME = 'Full Backup Before Notifications and Password Reset';
```

---

## 🚀 Installation Steps

### Step 1: Backup Database
1. Open SQL Server Management Studio (SSMS)
2. Connect to your production server
3. Right-click on `SuperShineCargoDb` → Tasks → Back Up
4. Choose backup location and click OK
5. Wait for backup to complete

### Step 2: Run Setup Script
1. In SSMS, click **File** → **Open** → **File**
2. Navigate to: `PRODUCTION_DATABASE_SETUP.sql`
3. Make sure `SuperShineCargoDb` is selected in the database dropdown
4. Click **Execute** (or press F5)
5. Review the output messages

### Step 3: Verify Installation
Check the output messages for:
- ✅ Green checkmarks = Success
- ℹ️ Info messages = Already exists (OK)
- ❌ Red X = Error (needs attention)

### Step 4: Restart Backend Server
1. Stop the Node.js backend server
2. Start it again
3. Check console for any errors

### Step 5: Test the Features
1. **Test Notifications:**
   - Login as Super Admin
   - Create a new job
   - Assign it to a user
   - Login as that user
   - Check notification bell icon

2. **Test Password Reset:**
   - Login as any user
   - Click "Forgot Password"
   - Submit request
   - Login as Super Admin
   - Approve the request
   - User should receive temporary password

---

## 📊 Database Changes Summary

### New Tables Created

#### 1. Notifications Table
```
Columns:
- notificationId (VARCHAR(50), Primary Key)
- userId (VARCHAR(50), Foreign Key to Users)
- type (VARCHAR(50))
- title (NVARCHAR(255))
- message (NVARCHAR(MAX))
- relatedId (VARCHAR(50))
- relatedType (VARCHAR(50))
- isRead (BIT)
- readDate (DATETIME)
- metadata (NVARCHAR(MAX))
- createdDate (DATETIME)
- createdBy (VARCHAR(50))

Indexes: 6 indexes for performance
```

#### 2. PasswordResetRequests Table
```
Columns:
- requestId (VARCHAR(50), Primary Key)
- userId (VARCHAR(50), Foreign Key to Users)
- requestedBy (VARCHAR(50), Foreign Key to Users)
- requestDate (DATETIME)
- status (VARCHAR(20))
- resolvedBy (VARCHAR(50))
- resolvedDate (DATETIME)
- notes (NVARCHAR(500))

Indexes: 3 indexes for performance
```

### Modified Tables

#### Users Table - New Columns Added
```
- isTemporaryPassword (BIT) - Flag for temporary passwords
- passwordResetRequired (BIT) - Force password change on login
- lastPasswordChange (DATETIME) - Track password change date
```

---

## 🔍 Verification Queries

### Check Notifications Table
```sql
-- View table structure
SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Notifications';

-- Count notifications
SELECT COUNT(*) as TotalNotifications FROM Notifications;

-- View unread notifications
SELECT userId, COUNT(*) as UnreadCount 
FROM Notifications 
WHERE isRead = 0 
GROUP BY userId;
```

### Check Password Reset Table
```sql
-- View table structure
SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PasswordResetRequests';

-- Count reset requests
SELECT COUNT(*) as TotalRequests FROM PasswordResetRequests;

-- View pending requests
SELECT * FROM PasswordResetRequests 
WHERE status = 'Pending' 
ORDER BY requestDate DESC;
```

### Check Users Table Updates
```sql
-- View new columns
SELECT UserId, Username, FullName, 
       isTemporaryPassword, 
       passwordResetRequired, 
       lastPasswordChange 
FROM Users;

-- Count users with temporary passwords
SELECT COUNT(*) as TempPasswordUsers 
FROM Users 
WHERE isTemporaryPassword = 1;
```

---

## 📝 Useful Management Queries

### Notifications Management

```sql
-- View all unread notifications for a specific user
SELECT * FROM Notifications 
WHERE userId = 'USER0001' AND isRead = 0 
ORDER BY createdDate DESC;

-- Mark all notifications as read for a user
UPDATE Notifications 
SET isRead = 1, readDate = GETDATE() 
WHERE userId = 'USER0001' AND isRead = 0;

-- Delete old notifications (older than 30 days)
DELETE FROM Notifications 
WHERE createdDate < DATEADD(day, -30, GETDATE());

-- Count notifications by type
SELECT type, COUNT(*) as Count 
FROM Notifications 
GROUP BY type;

-- View notifications for a specific job
SELECT * FROM Notifications 
WHERE relatedId = 'JOB0001' 
ORDER BY createdDate DESC;
```

### Password Reset Management

```sql
-- View all pending password reset requests
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

-- View users with temporary passwords
SELECT UserId, Username, FullName, 
       isTemporaryPassword, 
       passwordResetRequired,
       lastPasswordChange
FROM Users 
WHERE isTemporaryPassword = 1;

-- View password reset history for a user
SELECT * FROM PasswordResetRequests 
WHERE userId = 'USER0001' 
ORDER BY requestDate DESC;

-- Count requests by status
SELECT status, COUNT(*) as Count 
FROM PasswordResetRequests 
GROUP BY status;
```

---

## 🛠️ Troubleshooting

### Issue: Script fails with "Table already exists"
**Solution:** This is normal if you've run the script before. The script checks for existing tables and only creates what's missing.

### Issue: Foreign key constraint error
**Solution:** Make sure the Users table exists and has the correct structure. The userId column must exist in the Users table.

### Issue: Permission denied
**Solution:** You need db_owner or sysadmin permissions to run this script. Contact your database administrator.

### Issue: Notifications not appearing in frontend
**Solution:**
1. Restart backend server
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+F5)
4. Check browser console for errors (F12)

### Issue: Password reset not working
**Solution:**
1. Verify PasswordResetRequests table exists
2. Check Users table has new columns
3. Restart backend server
4. Check backend logs for errors

---

## 📞 Support

If you encounter any issues:

1. **Check the output messages** from the SQL script
2. **Review the verification queries** to ensure tables were created
3. **Check backend server logs** for any errors
4. **Check browser console** (F12) for frontend errors

---

## 🔄 Rollback (If Needed)

If you need to remove these features:

```sql
-- WARNING: This will delete all notifications and password reset data!

-- Drop Notifications system
DROP INDEX IF EXISTS IX_Notifications_UserId ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_IsRead ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_UserId_IsRead ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_CreatedDate ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_Type ON Notifications;
DROP INDEX IF EXISTS IX_Notifications_RelatedId ON Notifications;
DROP TABLE IF EXISTS Notifications;

-- Drop Password Reset system
DROP INDEX IF EXISTS IX_PasswordResetRequests_UserId ON PasswordResetRequests;
DROP INDEX IF EXISTS IX_PasswordResetRequests_Status ON PasswordResetRequests;
DROP INDEX IF EXISTS IX_PasswordResetRequests_RequestDate ON PasswordResetRequests;
DROP TABLE IF EXISTS PasswordResetRequests;

-- Remove columns from Users table
ALTER TABLE Users DROP COLUMN IF EXISTS isTemporaryPassword;
ALTER TABLE Users DROP COLUMN IF EXISTS passwordResetRequired;
ALTER TABLE Users DROP COLUMN IF EXISTS lastPasswordChange;
```

---

## ✅ Post-Installation Checklist

- [ ] Database backup completed
- [ ] SQL script executed successfully
- [ ] All verification queries passed
- [ ] Backend server restarted
- [ ] Frontend cache cleared
- [ ] Notifications tested (create job → assign → check notification)
- [ ] Password reset tested (request → approve → login with temp password)
- [ ] All users can login successfully
- [ ] No errors in backend logs
- [ ] No errors in browser console

---

## 📅 Maintenance

### Regular Maintenance Tasks

1. **Clean old notifications** (monthly)
   ```sql
   DELETE FROM Notifications 
   WHERE createdDate < DATEADD(day, -30, GETDATE());
   ```

2. **Archive old password reset requests** (quarterly)
   ```sql
   -- Create archive table first (one time)
   SELECT * INTO PasswordResetRequests_Archive 
   FROM PasswordResetRequests WHERE 1=0;
   
   -- Move old records
   INSERT INTO PasswordResetRequests_Archive
   SELECT * FROM PasswordResetRequests 
   WHERE requestDate < DATEADD(month, -3, GETDATE());
   
   DELETE FROM PasswordResetRequests 
   WHERE requestDate < DATEADD(month, -3, GETDATE());
   ```

3. **Monitor notification counts** (weekly)
   ```sql
   SELECT 
       COUNT(*) as TotalNotifications,
       SUM(CASE WHEN isRead = 0 THEN 1 ELSE 0 END) as UnreadCount,
       COUNT(DISTINCT userId) as UsersWithNotifications
   FROM Notifications;
   ```

---

## 📄 Version History

- **Version 1.0** (May 31, 2026)
  - Initial release
  - Notifications system
  - Password reset functionality

---

**Document prepared by:** Kiro AI Assistant  
**Date:** May 31, 2026  
**For:** Super Shine Cargo Service - Shipping Management System
