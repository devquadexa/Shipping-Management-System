# Password Reset System - Quick Reference Card

## 🚀 Quick Start

### For Super Admin

#### Create User with Temporary Password
1. Navigate to **Users** page
2. Click **"Add New User"**
3. Fill in user details and password
4. System automatically marks as temporary
5. Share credentials with user

#### Manage Password Reset Requests
1. Navigate to `/password-reset-requests`
2. View all pending requests
3. Click **"Approve"** or **"Reject"**
4. For approval: Enter temporary password
5. Share temporary password with user

---

### For End Users

#### First-Time Login
1. Go to login page
2. Enter username and temporary password
3. System redirects to reset password page
4. Enter temporary password + new password
5. Click **"Reset Password"**
6. Redirected to dashboard

#### Change Password (Logged In)
1. Click profile icon (top-right)
2. Select **"Reset Password"**
3. Enter old password + new password
4. Click **"Change Password"**
5. Success! Continue using system

#### Forgot Password
1. Click **"Forgot Password?"** on login page
2. Enter your username
3. Click **"Submit Request"**
4. Wait for Super Admin approval
5. Receive temporary password
6. Log in with temporary password
7. System redirects to reset password page

---

## 📋 API Quick Reference

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/password-reset/change-password` | POST | ✅ | Change password (logged in) |
| `/api/password-reset/reset-with-temp` | POST | ❌ | Reset with temporary password |
| `/api/password-reset/request` | POST | ❌ | Request password reset |
| `/api/password-reset/requests` | GET | ✅ SA | Get all requests |
| `/api/password-reset/approve/:id` | POST | ✅ SA | Approve request |
| `/api/password-reset/reject/:id` | POST | ✅ SA | Reject request |

**Legend:** ✅ = Authenticated, SA = Super Admin Only, ❌ = Public

---

## 🗄️ Database Quick Reference

### Users Table (New Columns)
```sql
isTemporaryPassword BIT DEFAULT 0
passwordResetRequired BIT DEFAULT 0
lastPasswordChange DATETIME NULL
```

### PasswordResetRequests Table
```sql
requestId VARCHAR(50) PRIMARY KEY
userId VARCHAR(50) NOT NULL
requestedBy VARCHAR(50) NOT NULL
requestDate DATETIME NOT NULL
status VARCHAR(20) NOT NULL  -- Pending, Approved, Rejected, Completed
resolvedBy VARCHAR(50) NULL
resolvedDate DATETIME NULL
notes NVARCHAR(500) NULL
```

---

## 🔧 Common Commands

### Run Database Migration
```bash
sqlcmd -S localhost -d SuperShineCargoDb -i backend-api/add-password-reset-columns.sql
```

### Build Frontend
```bash
cd frontend
npm run build
cp -r build/* ../backend-api/public/
```

### Rebuild Docker Containers
```bash
docker compose build --no-cache backend
docker compose build --no-cache frontend
docker compose up -d
```

### Check Container Status
```bash
docker ps
docker logs cargo_backend --tail 50
docker logs cargo_frontend --tail 50
```

---

## 🎨 Routes Quick Reference

### Public Routes
- `/login` - Login page
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page (temp password)

### Protected Routes
- `/` - Dashboard (all authenticated users)
- `/password-reset-requests` - Request management (Super Admin only)

### Modal
- Change Password Modal - Accessible from profile dropdown

---

## 🔐 Password Requirements

- **Minimum Length:** 6 characters
- **Validation:** New password must match confirm password
- **Security:** Passwords hashed with bcrypt (10 rounds)

---

## 🐛 Troubleshooting Quick Fixes

### User Not Redirected After Login
```sql
-- Check user's temporary password flag
SELECT isTemporaryPassword, passwordResetRequired 
FROM Users 
WHERE username = 'USERNAME';

-- Fix if needed
UPDATE Users 
SET isTemporaryPassword = 1, passwordResetRequired = 1 
WHERE username = 'USERNAME';
```

### Frontend Changes Not Visible
```bash
# Clear browser cache
Ctrl + Shift + Delete

# Hard refresh
Ctrl + F5

# Verify build files
ls -la backend-api/public/static/js/
```

### API Returns 403
```bash
# Check JWT token
# Verify user role
# Check backend logs
docker logs cargo_backend --tail 100 | grep "password-reset"
```

---

## 📊 Status Values

### Request Status
- `Pending` - Awaiting Super Admin review
- `Approved` - Approved, temporary password assigned
- `Rejected` - Rejected by Super Admin
- `Completed` - User has reset password

---

## 🎯 Key Files

### Backend
- `backend-api/src/presentation/routes/passwordReset.js` - API routes
- `backend-api/src/application/use-cases/auth/` - Business logic
- `backend-api/add-password-reset-columns.sql` - Database schema

### Frontend
- `frontend/src/components/ResetPassword.js` - Reset password page
- `frontend/src/components/ChangePassword.js` - Change password modal
- `frontend/src/components/ForgotPassword.js` - Forgot password page
- `frontend/src/components/PasswordResetRequests.js` - Admin management
- `frontend/src/styles/PasswordReset.css` - Styling

---

## 📞 Quick Support

### Check Documentation
1. `PASSWORD_RESET_COMPLETE.md` - Complete implementation guide
2. `DEPLOYMENT_CHECKLIST.md` - Deployment steps
3. `USER_FLOWS.md` - User journey diagrams
4. `IMPLEMENTATION_SUMMARY.md` - Overview

### Common Issues
- **Database:** Check schema is applied
- **Frontend:** Clear cache and hard refresh
- **Backend:** Check container logs
- **Auth:** Verify JWT token and role

---

## ✅ Quick Verification

### After Deployment
- [ ] Database script executed
- [ ] Containers rebuilt and running
- [ ] Login page shows "Forgot Password?" link
- [ ] Profile dropdown shows "Reset Password"
- [ ] Super Admin can access `/password-reset-requests`
- [ ] Test complete workflow end-to-end

---

## 🔄 Quick Workflows

### Workflow 1: First Login
```
Login → Auto-redirect → Reset Password → Dashboard
```

### Workflow 2: Change Password
```
Profile Icon → Reset Password → Modal → Change → Success
```

### Workflow 3: Forgot Password
```
Forgot Link → Enter Username → Request Created → 
Admin Approves → Temp Password → Login → Reset → Dashboard
```

---

## 💡 Pro Tips

1. **Always clear browser cache** after frontend deployment
2. **Check container logs** for debugging
3. **Verify database schema** before testing
4. **Test with real user accounts** not just admin
5. **Document temporary passwords** securely
6. **Monitor password reset requests** regularly

---

## 📱 Mobile Responsive

All pages are fully responsive:
- ✅ Login page
- ✅ Forgot password page
- ✅ Reset password page
- ✅ Change password modal
- ✅ Password reset requests page

---

## 🎨 UI Colors

- **Primary:** #101036 (Dark Blue)
- **Success:** #10b981 (Green)
- **Error:** #ef4444 (Red)
- **Warning:** #f59e0b (Orange)
- **Info:** #3b82f6 (Blue)

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT authentication
- [x] Role-based access control
- [x] Minimum password length enforced
- [x] Temporary password tracking
- [x] Password change history
- [x] Request audit trail
- [x] Secure password reset workflow

---

**Version:** 1.0  
**Last Updated:** May 11, 2026  
**Status:** Production Ready
