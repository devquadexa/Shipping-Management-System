# Backend Server Restart Guide

## ⚠️ IMPORTANT: Server Must Be Restarted!

The petty cash notification code has been added, but **the backend server needs to be restarted** to load the new code.

---

## 🔄 How to Restart the Backend Server

### Step 1: Stop the Server
1. Find the terminal/command prompt where the backend server is running
2. You should see messages like:
   ```
   Server running on port 5000
   📊 Database Configuration:
   ```
3. Press **Ctrl+C** to stop the server
4. Wait for the process to terminate

### Step 2: Start the Server
1. In the same terminal, run:
   ```bash
   npm start
   ```
2. Wait for these messages:
   ```
   📊 Database Configuration:
      Server: localhost:63951
      Database: SuperShineCargoDb
   ✅ Connected to MSSQL database
   ✅ Database migrations applied
   Server running on port 5000
   ```

### Step 3: Verify Server is Running
Run this command in a new terminal:
```bash
cd backend-api
node check-server-status.js
```

---

## 🧪 Test Petty Cash Notifications

### After Restarting the Server:

1. **Login as Admin or Manager**
2. **Go to Petty Cash section**
3. **Create a NEW petty cash assignment:**
   - Select a job
   - Select a user (e.g., waff clerk 01 - USER0002)
   - Enter amount (e.g., 5000)
   - Click "Assign"
4. **Check backend server logs** - You should see:
   ```
   [NOTIFICATION] Creating PETTY_CASH_ASSIGNED notification for user USER0002
   [CreateNotification] Creating notification for user USER0002, type: PETTY_CASH_ASSIGNED
   [CreateNotification] Generated notification ID: NOTIF00004
   [CreateNotification] Persisting notification to database
   [CreateNotification] Notification created successfully
   [NOTIFICATION] Successfully created notification for user USER0002
   ```
5. **Logout and login as the assigned user**
6. **Check the notification bell** - You should see:
   - Red badge with count
   - Notification: "Petty cash of LKR 5,000 has been assigned to you for Job #[JOB_ID]"

---

## 🐛 Troubleshooting

### Server won't stop?
- Press Ctrl+C multiple times
- Or close the terminal and open a new one
- Check if port 5000 is in use:
  ```bash
  netstat -ano | findstr :5000
  ```

### Server won't start?
- Check if another instance is running
- Check `.env` file exists and has correct database credentials
- Check for syntax errors in the code

### Still no notifications?
1. **Verify server has latest code:**
   ```bash
   node debug-petty-cash-assignment.js
   ```
   Should show: "✅ createPettyCashAssignment has createNotification"

2. **Check server logs** when creating petty cash assignment
   - Look for `[NOTIFICATION]` messages
   - If you don't see them, the server might not have restarted properly

3. **Check database:**
   ```bash
   node show-notifications.js USER0002
   ```

---

## ✅ Verification Checklist

After restarting the server:

- [ ] Server starts without errors
- [ ] See "Server running on port 5000" message
- [ ] Create a NEW petty cash assignment
- [ ] See `[NOTIFICATION]` logs in server console
- [ ] Login as assigned user
- [ ] See notification in bell dropdown
- [ ] Badge shows correct count

---

## 📝 Important Notes

1. **Old assignments won't have notifications** - Only NEW assignments created AFTER the server restart will have notifications

2. **Server must be restarted** - Code changes don't take effect until the server is restarted

3. **Check the logs** - The server logs will show if notifications are being created

4. **Test with a new assignment** - Don't expect notifications for assignments created before the code changes

---

## 🎯 Quick Commands

```bash
# Check if server is running
node check-server-status.js

# Debug petty cash notifications
node debug-petty-cash-assignment.js

# View notifications for a user
node show-notifications.js USER0002

# Verify notification system
node verify-notification-system.js
```

---

## 📞 Need Help?

If you're still having issues after restarting:

1. Run the debug script:
   ```bash
   node debug-petty-cash-assignment.js
   ```

2. Check the output - it will tell you exactly what's wrong

3. Look at the backend server console logs when creating a petty cash assignment

4. Check if notifications are in the database:
   ```sql
   SELECT * FROM Notifications 
   WHERE type = 'PETTY_CASH_ASSIGNED' 
   ORDER BY createdDate DESC;
   ```

---

**Status:** ✅ Code is ready - Server needs restart  
**Next Step:** Restart the backend server and test!
