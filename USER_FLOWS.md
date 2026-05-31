# Password Reset System - User Flows

## 🔄 Complete User Journey Diagrams

---

## Flow 1: First-Time Login with Temporary Password

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN CREATES USER                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Management │
                    │      Page        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Add New  │
                    │      User"       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Fill User Form: │
                    │  - Username      │
                    │  - Full Name     │
                    │  - Role          │
                    │  - Password      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  System Sets:    │
                    │  isTemporary = 1 │
                    │  resetRequired=1 │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPER ADMIN SHARES CREDENTIALS WITH USER            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER FIRST LOGIN                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Login Page     │
                    │  Enter Username  │
                    │  Enter Temp Pass │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Sign In" │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  System Checks:  │
                    │  isTemporary = 1?│
                    └──────────────────┘
                              │
                              ▼ YES
                    ┌──────────────────┐
                    │  Auto-Redirect   │
                    │  to /reset-      │
                    │  password        │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESET PASSWORD PAGE                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Enters:    │
                    │  - Temp Password │
                    │  - New Password  │
                    │  - Confirm Pass  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  System Validates│
                    │  - Temp correct? │
                    │  - Pass match?   │
                    │  - Min 6 chars?  │
                    └──────────────────┘
                              │
                              ▼ VALID
                    ┌──────────────────┐
                    │  Update Password │
                    │  isTemporary = 0 │
                    │  resetRequired=0 │
                    │  lastChange=NOW  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Success Message │
                    │  "Password Reset │
                    │   Successfully"  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Auto-Redirect   │
                    │  to Dashboard    │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER CAN NOW USE SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 2: Change Password (Logged In User)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER IS LOGGED IN                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click Profile   │
                    │  Icon (Top-Right)│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Dropdown Opens  │
                    │  - Settings      │
                    │  - Reset Pass ✓  │
                    │  - Logout        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Reset    │
                    │   Password"      │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHANGE PASSWORD MODAL OPENS                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Enters:    │
                    │  - Old Password  │
                    │  - New Password  │
                    │  - Confirm Pass  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Change   │
                    │   Password"      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  System Validates│
                    │  - Old correct?  │
                    │  - Pass match?   │
                    │  - Min 6 chars?  │
                    └──────────────────┘
                              │
                              ▼ VALID
                    ┌──────────────────┐
                    │  Update Password │
                    │  lastChange=NOW  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Success Toast   │
                    │  "Password       │
                    │   Changed!"      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Modal Closes    │
                    │  User Continues  │
                    └──────────────────┘
```

---

## Flow 3: Forgot Password Request

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER FORGOT PASSWORD                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Login Page     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Forgot   │
                    │   Password?"     │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FORGOT PASSWORD PAGE                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Enters:    │
                    │  - Username      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Submit   │
                    │   Request"       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  System Creates  │
                    │  Reset Request   │
                    │  Status: Pending │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Success Message │
                    │  "Request sent   │
                    │   to Admin"      │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SUPER ADMIN NOTIFICATION                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Super Admin     │
                    │  Logs In         │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Navigates to    │
                    │  /password-reset-│
                    │  requests        │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PASSWORD RESET REQUESTS PAGE                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  View Request    │
                    │  - Username      │
                    │  - Full Name     │
                    │  - Request Date  │
                    │  - Status        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Approve" │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Modal Opens:    │
                    │  Enter Temp Pass │
                    │  Enter Notes     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Approve  │
                    │   Request"       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  System Updates: │
                    │  - Status=       │
                    │    Approved      │
                    │  - User gets     │
                    │    temp pass     │
                    │  - isTemporary=1 │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          SUPER ADMIN SHARES TEMP PASSWORD WITH USER              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER LOGS IN WITH TEMP PASSWORD                     │
│         (FOLLOWS FLOW 1: FIRST-TIME LOGIN)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 4: Super Admin Rejects Request

```
┌─────────────────────────────────────────────────────────────────┐
│              PASSWORD RESET REQUESTS PAGE                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  View Request    │
                    │  Status: Pending │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Reject"  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Modal Opens:    │
                    │  Enter Reason    │
                    │  (Optional)      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Click "Reject   │
                    │   Request"       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  System Updates: │
                    │  - Status=       │
                    │    Rejected      │
                    │  - resolvedBy=   │
                    │    Admin ID      │
                    │  - resolvedDate= │
                    │    NOW           │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Success Message │
                    │  Request list    │
                    │  refreshes       │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER MUST CONTACT ADMIN DIRECTLY                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Decision Points

### Decision 1: Is Password Temporary?
```
Login Successful
       │
       ▼
   ┌───────┐
   │ Check │
   │isTemp?│
   └───┬───┘
       │
   ┌───┴───┐
   │       │
  YES     NO
   │       │
   ▼       ▼
Reset   Dashboard
Page
```

### Decision 2: Password Validation
```
User Submits Form
       │
       ▼
   ┌───────┐
   │Validate│
   └───┬───┘
       │
   ┌───┴───┐
   │       │
 VALID  INVALID
   │       │
   ▼       ▼
Update   Show
Success  Error
```

### Decision 3: Request Approval
```
Super Admin Reviews
       │
       ▼
   ┌───────┐
   │Decision│
   └───┬───┘
       │
   ┌───┴───┐
   │       │
Approve  Reject
   │       │
   ▼       ▼
Assign   Update
Temp     Status
Pass     Only
```

---

## 📱 Screen Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN PAGE                               │
│                      /login (Public)                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  [Forgot Password?] ──────────────────────┐        │         │
│  └────────────────────────────────────────────┼────────┘         │
└────────────────────────────────────────────────┼──────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────┐
                    │                            │            │
                    ▼                            ▼            ▼
         ┌──────────────────┐        ┌──────────────────┐   │
         │  FORGOT PASSWORD │        │ RESET PASSWORD   │   │
         │  /forgot-password│        │ /reset-password  │   │
         │    (Public)      │        │   (Public)       │   │
         └──────────────────┘        └──────────────────┘   │
                                                             │
                                                             │
┌────────────────────────────────────────────────────────────┼────┐
│                         DASHBOARD                          │    │
│                      / (Protected)                         │    │
│                                                            │    │
│  ┌─────────────────────────────────────────────────────┐  │    │
│  │  [Profile Icon] ──────────────────────────┐         │  │    │
│  │    ├─ Settings                            │         │  │    │
│  │    ├─ Reset Password ─────────────────────┼─────┐   │  │    │
│  │    └─ Logout                              │     │   │  │    │
│  └────────────────────────────────────────────┼─────┼───┘  │    │
└────────────────────────────────────────────────┼─────┼──────┼────┘
                                                 │     │      │
                                                 │     ▼      │
                                                 │  ┌──────┐  │
                                                 │  │CHANGE│  │
                                                 │  │PASS  │  │
                                                 │  │MODAL │  │
                                                 │  └──────┘  │
                                                 │            │
                                                 ▼            │
                                    ┌──────────────────────┐ │
                                    │ PASSWORD RESET       │ │
                                    │ REQUESTS             │ │
                                    │ /password-reset-     │ │
                                    │ requests             │ │
                                    │ (Super Admin Only)   │ │
                                    └──────────────────────┘ │
                                                             │
                                    ┌────────────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  ALL OTHER PAGES │
                          │  - Customers     │
                          │  - Jobs          │
                          │  - Billing       │
                          │  - Reports       │
                          │  - etc.          │
                          └──────────────────┘
```

---

## 🔐 Access Control Matrix

| Page/Feature | Public | User | Admin | Super Admin |
|--------------|--------|------|-------|-------------|
| Login | ✅ | ✅ | ✅ | ✅ |
| Forgot Password | ✅ | ✅ | ✅ | ✅ |
| Reset Password (Temp) | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ✅ | ✅ |
| Change Password | ❌ | ✅ | ✅ | ✅ |
| Password Reset Requests | ❌ | ❌ | ❌ | ✅ |
| Approve Requests | ❌ | ❌ | ❌ | ✅ |
| Reject Requests | ❌ | ❌ | ❌ | ✅ |

---

## 📊 State Transitions

### User Password State
```
┌─────────────┐
│   Created   │
│  (Temp=1)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ First Login │
│  Redirect   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Reset Success│
│  (Temp=0)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │
│  (Normal)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Change    │
│  Password   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │
│  (Updated)  │
└─────────────┘
```

### Request State
```
┌─────────────┐
│   Created   │
│  (Pending)  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐ ┌──────┐
│Approve│ │Reject│
└───┬──┘ └───┬──┘
    │        │
    ▼        ▼
┌──────┐ ┌──────┐
│Approved│Rejected│
└───┬──┘ └──────┘
    │
    ▼
┌──────┐
│Complete│
└──────┘
```

---

**Document Version:** 1.0  
**Last Updated:** May 11, 2026  
**Status:** Complete
