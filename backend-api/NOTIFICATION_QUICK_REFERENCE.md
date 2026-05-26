# Notification System - Quick Reference Card

## 🔔 Notification Types

| Type | Trigger | Message | Recipient |
|------|---------|---------|-----------|
| **JOB_ASSIGNED** | User assigned to job | "You have been assigned to Job #[ID]" | Assigned user(s) |
| **PETTY_CASH_ASSIGNED** | Petty cash assigned | "Petty cash of LKR [amount] has been assigned to you for Job #[ID]" | Assigned user |
| **PETTY_CASH_ASSIGNED** | Additional petty cash | "Additional petty cash of LKR [amount] has been assigned to you for Job #[ID]" | Assigned user |
| **invoice_review** | Invoice review sent | "New invoice review from [sender]" | Clerk |

---

## 🧪 Quick Test Commands

```bash
# Verify system is working
node verify-notification-system.js

# Test job notifications
node debug-notification-issue.js

# Test petty cash notifications
node test-petty-cash-notification.js

# View all notifications
node show-notifications.js

# View user's notifications
node show-notifications.js USER0002
```

---

## 📊 Quick SQL Queries

```sql
-- View all notifications
SELECT * FROM Notifications ORDER BY createdDate DESC;

-- View unread notifications for a user
SELECT * FROM Notifications 
WHERE userId = 'USER0002' AND isRead = 0;

-- View notifications by type
SELECT * FROM Notifications WHERE type = 'JOB_ASSIGNED';
SELECT * FROM Notifications WHERE type = 'PETTY_CASH_ASSIGNED';

-- Unread count by user
SELECT userId, COUNT(*) as unreadCount 
FROM Notifications WHERE isRead = 0 GROUP BY userId;

-- Delete test notifications
DELETE FROM Notifications WHERE relatedId LIKE 'TEST%';
```

---

## 🔧 Quick Fixes

### Fix Missing Columns
```bash
node fix-notifications-table.js
```

### Restart Backend Server
```bash
# Stop server (Ctrl+C)
cd backend-api
npm start
```

### Clear Test Data
```bash
node cleanup-test-notifications.js
```

---

## 📝 Manual Test Steps

### Test Job Assignment
1. Create job → Assign to user → Login as user → Check bell

### Test Petty Cash
1. Create petty cash assignment → Login as user → Check bell

### Test Sub-Assignment
1. Add more petty cash to existing assignment → Login as user → Check bell

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No notifications | Run `node verify-notification-system.js` |
| Backend errors | Check `.env` file, run `node fix-notifications-table.js` |
| Wrong count | Check database: `SELECT * FROM Notifications WHERE userId = 'USER0002'` |
| Not appearing | Check backend logs for `[NOTIFICATION]` messages |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README_NOTIFICATION_FIX.md** | 👈 START HERE - Complete overview |
| **NOTIFICATION_QUICK_START.md** | Quick start guide |
| **NOTIFICATION_COMPLETE_SUMMARY.md** | Complete implementation summary |
| **PETTY_CASH_NOTIFICATION_IMPLEMENTATION.md** | Petty cash details |
| **NOTIFICATION_QUICK_REFERENCE.md** | This file |

---

## ✅ Status Check

```bash
# Run this to check everything
node verify-notification-system.js
```

**Expected:** All checks pass ✅

---

## 🎯 Key Points

- ✅ 3 notification types implemented
- ✅ Database schema fixed
- ✅ All use cases updated
- ✅ Error handling in place
- ✅ Comprehensive logging
- ✅ Fully tested
- ✅ Well documented

---

**Status:** ✅ READY TO USE  
**Date:** May 24, 2026
