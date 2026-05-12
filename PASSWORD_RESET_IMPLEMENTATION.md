# Password Reset & Forgot Password Implementation Guide

## Overview
Complete implementation of password reset and forgot password functionality with temporary password support.

## Features Implemented

### 1. **First Login with Temporary Password**
- Super Admin creates user with temporary password
- User logs in with temporary password
- System automatically redirects to Password Reset page
- User must set new password before accessing system

### 2. **Profile Password Reset**
- Profile dropdown in top-right corner
- "Reset Password" option in dropdown
- Form with: Old Password, New Password, Confirm New Password
- Secure password update

### 3. **Forgot Password Flow**
- "Forgot Password" button on login page
- User enters username
- System creates password reset request for Super Admin
- Super Admin assigns new temporary password
- User logs in with temporary password
- System redirects to Password Reset page

## Database Schema

### Users Table Updates
```sql
- isTemporaryPassword BIT (indicates if current password is temporary)
- passwordResetRequired BIT (forces password reset on next login)
- lastPasswordChange DATETIME (tracks when password was last changed)
```

### PasswordResetRequests Table
```sql
- requestId VARCHAR(50) PRIMARY KEY
- userId VARCHAR(50) (user requesting reset)
- requestedBy VARCHAR(50) (who made the request)
- requestDate DATETIME
- status VARCHAR(20) (Pending, Approved, Rejected, Completed)
- resolvedBy VARCHAR(50) (admin who resolved)
- resolvedDate DATETIME
- notes NVARCHAR(500)
```

## Backend Structure

### Use Cases
1. **ChangePassword** - User changes password (knows old password)
2. **ResetPasswordWithTemp** - User resets with temporary password
3. **RequestPasswordReset** - User requests password reset (forgot password)
4. **GetPasswordResetRequests** - Admin views pending requests
5. **ApprovePasswordResetRequest** - Admin assigns temporary password
6. **RejectPasswordResetRequest** - Admin rejects request

### API Endpoints
```
POST /api/auth/change-password
POST /api/auth/reset-password-temp
POST /api/auth/request-password-reset
GET /api/auth/password-reset-requests
POST /api/auth/approve-password-reset/:requestId
POST /api/auth/reject-password-reset/:requestId
```

## Frontend Components

### 1. **ResetPassword.js**
- Shown when user logs in with temporary password
- Fields: Temporary Password, New Password, Confirm New Password
- Validates and updates password

### 2. **ChangePassword.js**
- Accessed from profile dropdown
- Fields: Old Password, New Password, Confirm New Password
- Validates and updates password

### 3. **ForgotPassword.js**
- Shown when user clicks "Forgot Password" on login
- Field: Username
- Submits password reset request

### 4. **PasswordResetRequests.js** (Admin)
- Shows all pending password reset requests
- Admin can approve (assign temp password) or reject
- Only accessible by Super Admin

### 5. **Login.js Updates**
- Add "Forgot Password" link
- Check if user has temporary password after login
- Redirect to ResetPassword if needed

### 6. **Navbar.js Updates**
- Add "Reset Password" option in profile dropdown

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **Temporary Password Flags**: Track temporary passwords
3. **Force Password Reset**: Redirect users with temporary passwords
4. **Password Validation**: Minimum 6 characters
5. **Old Password Verification**: Required for profile password change
6. **No Password Reuse**: New password must be different

## UI/UX Design

- Professional, modern design matching existing system
- Same color theme (#101036 primary, white backgrounds)
- Consistent card-based layouts
- Clear validation messages
- Loading states
- Success/error alerts
- Responsive design

## Implementation Steps

### Step 1: Database Setup
```bash
# Run the SQL script
sqlcmd -S localhost -d SuperShineCargoDb -i add-password-reset-columns.sql
```

### Step 2: Backend Implementation
1. Create domain entities
2. Create use cases
3. Create repositories
4. Create routes
5. Register in DI container

### Step 3: Frontend Implementation
1. Create password reset components
2. Update login flow
3. Update navbar with password reset option
4. Create admin password reset requests page
5. Add routing

### Step 4: Testing
1. Test first login with temporary password
2. Test profile password change
3. Test forgot password flow
4. Test admin approval/rejection
5. Test validation and error handling

## Files to Create/Modify

### Backend Files (New)
- `add-password-reset-columns.sql`
- `src/domain/entities/PasswordResetRequest.js`
- `src/domain/repositories/IPasswordResetRepository.js`
- `src/infrastructure/repositories/MSSQLPasswordResetRepository.js`
- `src/application/use-cases/auth/ChangePassword.js`
- `src/application/use-cases/auth/ResetPasswordWithTemp.js`
- `src/application/use-cases/auth/RequestPasswordReset.js`
- `src/application/use-cases/auth/GetPasswordResetRequests.js`
- `src/application/use-cases/auth/ApprovePasswordResetRequest.js`
- `src/application/use-cases/auth/RejectPasswordResetRequest.js`
- `src/presentation/routes/passwordReset.js`

### Backend Files (Modified)
- `src/infrastructure/repositories/MSSQLUserRepository.js` (add updatePassword method)
- `src/infrastructure/di/container.js` (register new use cases)
- `src/index.js` (register password reset routes)
- `src/presentation/routes/auth.js` (add password reset endpoints)

### Frontend Files (New)
- `src/components/ResetPassword.js`
- `src/components/ChangePassword.js`
- `src/components/ForgotPassword.js`
- `src/components/PasswordResetRequests.js`
- `src/styles/PasswordReset.css`
- `src/api/services/passwordResetService.js`

### Frontend Files (Modified)
- `src/components/Login.js` (add forgot password link, check temp password)
- `src/components/Navbar.js` (add reset password in dropdown)
- `src/App.js` (add new routes)
- `src/components/Users.js` (add temp password checkbox when creating user)

## Next Steps

Would you like me to:
1. Continue with the complete backend implementation?
2. Continue with the complete frontend implementation?
3. Implement both backend and frontend together?

This is a large feature that will take multiple steps to complete properly.
