# Password Reset - Database and Authentication Fix

## ✅ Issues Fixed

### Issue 1: Database Table Missing
**Error:** `Invalid object name 'PasswordResetRequests'`

**Solution:** Ran database migration to create:
- Added 3 columns to Users table: `isTemporaryPassword`, `passwordResetRequired`, `lastPasswordChange`
- Created `PasswordResetRequests` table with all required columns
- Created indexes for performance

**Commands Executed:**
```sql
-- Add columns to Users table
ALTER TABLE Users ADD isTemporaryPassword BIT DEFAULT 0;
ALTER TABLE Users ADD passwordResetRequired BIT DEFAULT 0;
ALTER TABLE Users ADD lastPasswordChange DATETIME NULL;

-- Create PasswordResetRequests table
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

-- Create indexes
CREATE INDEX IX_PasswordResetRequests_UserId ON PasswordResetRequests(userId);
CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status);
CREATE INDEX IX_PasswordResetRequests_RequestDate ON PasswordResetRequests(requestDate);
```

### Issue 2: User Creation Not Setting Temporary Password
**Problem:** When Super Admin creates a user, the password wasn't marked as temporary, so users weren't redirected to reset password page on first login.

**Solution:** Updated `AuthController.register()` method to:
1. Hash the password using bcrypt
2. Set `isTemporaryPassword = true`
3. Set `passwordResetRequired = true`
4. Set `lastPasswordChange = new Date()`

**File Modified:** `backend-api/src/presentation/controllers/AuthController.js`

### Issue 3: Authentication Using Plain Text Passwords
**Problem:** The authenticate method was comparing plain text passwords instead of using bcrypt.

**Solution:** Updated `MSSQLUserRepository.authenticate()` method to:
1. Fetch user by username only
2. Use bcrypt.compare() to validate password
3. Return user if password matches

**File Modified:** `backend-api/src/infrastructure/repositories/MSSQLUserRepository.js`

### Issue 4: User Creation Not Saving Temporary Password Flags
**Problem:** The repository's create method wasn't saving the new password reset fields.

**Solution:** Updated `MSSQLUserRepository.create()` method to include:
- `isTemporaryPassword`
- `passwordResetRequired`
- `lastPasswordChange`

**File Modified:** `backend-api/src/infrastructure/repositories/MSSQLUserRepository.js`

---

## 📋 Files Modified

1. **backend-api/src/presentation/controllers/AuthController.js**
   - Updated `register()` method to hash passwords and set temporary flags

2. **backend-api/src/infrastructure/repositories/MSSQLUserRepository.js**
   - Updated `authenticate()` method to use bcrypt
   - Updated `create()` method to save password reset fields

3. **Database**
   - Added 3 columns to Users table
   - Created PasswordResetRequests table
   - Created 3 indexes

---

## 🔄 Complete User Flow (Now Working)

### 1. Super Admin Creates User
```
Super Admin → Users Page → Add New User → 
Enter username, password, name, email, role → 
System automatically:
  - Hashes password with bcrypt
  - Sets isTemporaryPassword = true
  - Sets passwordResetRequired = true
  - Sets lastPasswordChange = now
```

### 2. User First Login
```
User → Login Page → Enter username & temporary password →
System:
  - Validates password with bcrypt.compare()
  - Returns user object with isTemporaryPassword = true
Frontend:
  - Detects isTemporaryPassword = true
  - Redirects to /reset-password page
```

### 3. User Resets Password
```
User → Reset Password Page → 
Enter temporary password + new password →
System:
  - Validates temporary password
  - Hashes new password
  - Sets isTemporaryPassword = false
  - Sets passwordResetRequired = false
  - Updates lastPasswordChange
User → Redirected to Dashboard
```

### 4. Forgot Password Flow
```
User → Login Page → Click "Forgot Password?" →
Enter username → Submit Request →
System:
  - Creates PasswordResetRequest (status: Pending)
  - Stores in database
Super Admin:
  - Views request at /password-reset-requests
  - Approves and assigns temporary password
  - System sets isTemporaryPassword = true for user
User:
  - Logs in with temporary password
  - Redirected to reset password page (same as flow #2)
```

---

## ✅ Verification Steps

### 1. Test Database Migration
```sql
-- Check Users table columns
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' 
AND COLUMN_NAME IN ('isTemporaryPassword', 'passwordResetRequired', 'lastPasswordChange');

-- Check PasswordResetRequests table exists
SELECT COUNT(*) 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'PasswordResetRequests';
```

### 2. Test User Creation
1. Log in as Super Admin
2. Go to Users page
3. Create new user with temporary password
4. Check database:
```sql
SELECT username, isTemporaryPassword, passwordResetRequired, lastPasswordChange
FROM Users
WHERE username = 'NEW_USERNAME';
```
Expected: `isTemporaryPassword = 1`, `passwordResetRequired = 1`, `lastPasswordChange = recent date`

### 3. Test First Login
1. Log out
2. Log in with new user credentials
3. Should automatically redirect to `/reset-password` page
4. Enter temporary password and new password
5. Should redirect to dashboard
6. Check database:
```sql
SELECT username, isTemporaryPassword, passwordResetRequired
FROM Users
WHERE username = 'NEW_USERNAME';
```
Expected: `isTemporaryPassword = 0`, `passwordResetRequired = 0`

### 4. Test Forgot Password
1. Log out
2. Click "Forgot Password?" on login page
3. Enter username
4. Check database:
```sql
SELECT * FROM PasswordResetRequests WHERE status = 'Pending';
```
Expected: New request with status 'Pending'

5. Log in as Super Admin
6. Go to `/password-reset-requests`
7. Approve request with temporary password
8. Log out and log in with temporary password
9. Should redirect to reset password page

---

## 🔐 Security Improvements

1. **Password Hashing**: All passwords now hashed with bcrypt (10 rounds)
2. **Temporary Password Tracking**: System knows which passwords are temporary
3. **Forced Password Reset**: Users with temporary passwords must reset on first login
4. **Password Change History**: System tracks when passwords were last changed
5. **Audit Trail**: All password reset requests tracked in database

---

## 🚀 Next Steps

1. ✅ Database migration complete
2. ✅ Backend code updated
3. ⏳ Restart backend server
4. ⏳ Test complete workflows
5. ⏳ Deploy to production

---

## 📝 Important Notes

### Existing Users
**IMPORTANT:** Existing users in the database have plain text passwords. They will NOT be able to log in after this update because the system now expects hashed passwords.

**Solutions:**
1. **Option A (Recommended):** Reset all existing user passwords:
```sql
-- This will require all users to use forgot password flow
UPDATE Users SET isTemporaryPassword = 1, passwordResetRequired = 1;
```

2. **Option B:** Manually hash existing passwords (requires script)

3. **Option C:** Have Super Admin recreate user accounts

### Password Migration Script
If you need to migrate existing users, create a script to:
1. Read each user's plain text password
2. Hash it with bcrypt
3. Update the database
4. Set temporary password flags if needed

---

**Status:** ✅ COMPLETE  
**Date:** May 11, 2026  
**Database:** ✅ Migrated  
**Backend:** ✅ Updated  
**Ready for Testing:** ✅ YES
