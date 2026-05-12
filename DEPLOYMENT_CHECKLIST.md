# Password Reset Feature - Deployment Checklist

## 🚀 Quick Deployment Guide

### Prerequisites
- ✅ All code changes committed and pushed to repository
- ✅ Frontend built and copied to `backend-api/public/`
- ✅ Database script ready: `backend-api/add-password-reset-columns.sql`

---

## Step-by-Step Deployment

### 1️⃣ Run Database Migration
```bash
# Connect to SQL Server and run the schema script
sqlcmd -S localhost -d SuperShineCargoDb -i backend-api/add-password-reset-columns.sql
```

**Expected Output:**
```
Password reset columns and table created successfully
```

**Verify:**
```sql
-- Check Users table has new columns
SELECT TOP 1 isTemporaryPassword, passwordResetRequired, lastPasswordChange 
FROM Users;

-- Check PasswordResetRequests table exists
SELECT COUNT(*) FROM PasswordResetRequests;
```

---

### 2️⃣ Commit and Push Changes
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Implement password reset and forgot password functionality

- Add database schema for password reset
- Implement 6 backend use cases for password management
- Create 4 frontend components (ResetPassword, ChangePassword, ForgotPassword, PasswordResetRequests)
- Update Login, Navbar, and App.js with password reset integration
- Add professional styling matching system theme
- Deploy built frontend to backend-api/public/"

# Push to repository
git push origin main
```

---

### 3️⃣ Rebuild Docker Containers
```bash
# Pull latest changes on server
git pull origin main

# Rebuild backend container (includes new frontend files in public/)
docker compose build --no-cache backend

# Rebuild frontend container
docker compose build --no-cache frontend

# Restart containers
docker compose up -d

# Verify containers are running
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                    STATUS
xxxxx          cargo_backend            Up X seconds
xxxxx          cargo_frontend           Up X seconds
```

---

### 4️⃣ Verify Deployment

#### Backend Verification
```bash
# Check backend logs
docker logs cargo_backend --tail 50

# Test API endpoint
curl -X GET https://supershinecargo.cloud/api/password-reset/requests \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Frontend Verification
1. Open browser: https://supershinecargo.cloud
2. Clear browser cache: `Ctrl + Shift + Delete`
3. Hard refresh: `Ctrl + F5`
4. Check login page has "Forgot Password?" link
5. Log in and check profile dropdown has "Reset Password" option

---

### 5️⃣ Test Complete Workflows

#### Test 1: Create User with Temporary Password
1. Log in as Super Admin
2. Go to Users page
3. Create new user with temporary password
4. Note the username and temporary password

#### Test 2: First-Time Login
1. Log out
2. Log in with new user credentials (temporary password)
3. Verify redirect to `/reset-password` page
4. Enter temporary password and new password
5. Verify successful password reset
6. Verify redirect to dashboard

#### Test 3: Change Password (Logged In)
1. Click profile icon (top-right)
2. Click "Reset Password"
3. Enter old password and new password
4. Verify success message
5. Log out and log in with new password

#### Test 4: Forgot Password Flow
1. Log out
2. Click "Forgot Password?" on login page
3. Enter username
4. Verify success message
5. Log in as Super Admin
6. Navigate to `/password-reset-requests`
7. Verify request appears with "Pending" status
8. Approve request and assign temporary password
9. Log out
10. Log in with temporary password
11. Verify redirect to reset password page
12. Create new permanent password

---

## 🔍 Verification Checklist

### Database
- [ ] Users table has `isTemporaryPassword` column
- [ ] Users table has `passwordResetRequired` column
- [ ] Users table has `lastPasswordChange` column
- [ ] PasswordResetRequests table exists
- [ ] Indexes created on PasswordResetRequests table

### Backend
- [ ] Container `cargo_backend` is running
- [ ] No errors in backend logs
- [ ] API endpoint `/api/password-reset/change-password` accessible
- [ ] API endpoint `/api/password-reset/reset-with-temp` accessible
- [ ] API endpoint `/api/password-reset/request` accessible
- [ ] API endpoint `/api/password-reset/requests` accessible (Super Admin only)
- [ ] API endpoint `/api/password-reset/approve/:requestId` accessible (Super Admin only)
- [ ] API endpoint `/api/password-reset/reject/:requestId` accessible (Super Admin only)

### Frontend
- [ ] Container `cargo_frontend` is running
- [ ] Login page shows "Forgot Password?" link
- [ ] Profile dropdown shows "Reset Password" option
- [ ] Route `/reset-password` accessible
- [ ] Route `/forgot-password` accessible
- [ ] Route `/password-reset-requests` accessible (Super Admin only)
- [ ] All forms styled consistently with system theme
- [ ] No console errors in browser

### Functionality
- [ ] User with temporary password redirected to reset page on login
- [ ] User can reset password with temporary password
- [ ] User can change password from profile dropdown
- [ ] User can request password reset via forgot password
- [ ] Super Admin can view all password reset requests
- [ ] Super Admin can approve password reset requests
- [ ] Super Admin can reject password reset requests
- [ ] Non-Super Admin cannot access password reset requests page
- [ ] Password validation works (minimum 6 characters)
- [ ] Confirm password validation works (must match new password)

---

## 🐛 Common Issues and Solutions

### Issue: Database script fails
**Solution:**
```sql
-- Check if columns already exist
SELECT * FROM sys.columns 
WHERE object_id = OBJECT_ID(N'Users') 
AND name IN ('isTemporaryPassword', 'passwordResetRequired', 'lastPasswordChange');

-- Check if table already exists
SELECT * FROM sys.tables WHERE name = 'PasswordResetRequests';
```

### Issue: Frontend changes not visible
**Solution:**
```bash
# Verify files copied correctly
ls -la backend-api/public/static/js/
ls -la backend-api/public/static/css/

# Check file timestamps (should be recent)
stat backend-api/public/static/js/main.*.js

# Clear browser cache completely
# Chrome: Ctrl+Shift+Delete > Cached images and files > Clear data
# Then hard refresh: Ctrl+F5
```

### Issue: API returns 403 Forbidden
**Solution:**
```bash
# Check JWT token is valid
# Check user role in token payload
# Verify middleware in backend routes

# Check backend logs
docker logs cargo_backend --tail 100 | grep "password-reset"
```

### Issue: User not redirected after login with temp password
**Solution:**
```sql
-- Check user's temporary password flag
SELECT userId, username, isTemporaryPassword, passwordResetRequired 
FROM Users 
WHERE username = 'YOUR_USERNAME';

-- If not set, update manually
UPDATE Users 
SET isTemporaryPassword = 1, passwordResetRequired = 1 
WHERE username = 'YOUR_USERNAME';
```

---

## 📊 Post-Deployment Monitoring

### Monitor for 24 Hours
- [ ] Check backend logs for errors
- [ ] Monitor database for new password reset requests
- [ ] Verify no authentication issues
- [ ] Check user feedback

### Metrics to Track
- Number of password reset requests created
- Number of requests approved/rejected
- Average time to resolve requests
- Number of users with temporary passwords
- Failed login attempts

---

## 📞 Rollback Plan (If Needed)

### If Critical Issues Occur:

1. **Revert Frontend:**
```bash
# Restore previous build from git
git checkout HEAD~1 frontend/build
cp -r frontend/build/* backend-api/public/
docker compose restart frontend
```

2. **Revert Backend Code:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Rebuild containers
docker compose build --no-cache backend
docker compose up -d
```

3. **Database Rollback (CAUTION):**
```sql
-- Only if absolutely necessary
-- This will lose all password reset request data

DROP TABLE PasswordResetRequests;

ALTER TABLE Users DROP COLUMN isTemporaryPassword;
ALTER TABLE Users DROP COLUMN passwordResetRequired;
ALTER TABLE Users DROP COLUMN lastPasswordChange;
```

---

## ✅ Sign-Off

### Deployment Completed By:
- **Name:** _________________
- **Date:** _________________
- **Time:** _________________

### Verification Completed By:
- **Name:** _________________
- **Date:** _________________
- **Time:** _________________

### Issues Encountered:
- [ ] None
- [ ] Minor (documented below)
- [ ] Major (escalated)

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Deployment Status:** ⏳ PENDING  
**Last Updated:** May 11, 2026
