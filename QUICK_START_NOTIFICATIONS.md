# Quick Start Guide - Notification System

## 🚀 Get Started in 5 Minutes

### Step 1: Start Backend Server (1 min)
```bash
cd "d:\Work and Learn\Quadexa\Shipping Management System\backend-api"
npm start
```
✅ Wait for: `Server running on port 5000`

### Step 2: Start Frontend (1 min)
```bash
cd "d:\Work and Learn\Quadexa\Shipping Management System\client"
npm start
```
✅ Wait for: `Compiled successfully!`
✅ Browser opens at `http://localhost:3000`

### Step 3: Test Notifications (3 min)

#### 3.1 Login as Admin
- Username: `admin` (or your admin username)
- Password: (your admin password)

#### 3.2 Create Petty Cash Assignment
1. Go to **Jobs** page
2. Select any job (or create a new one)
3. Click **Assign Petty Cash**
4. Select a Waff Clerk (e.g., USER0003)
5. Enter amount (e.g., 5000)
6. Click **Assign**

✅ **Notification is created automatically!**

#### 3.3 View Notification as Waff Clerk
1. Logout from admin
2. Login as Waff Clerk (USER0003)
3. Look at navbar - see bell icon with badge: 🔔¹
4. Click bell icon
5. See notification: "Petty cash of LKR 5,000 has been assigned..."

#### 3.4 Test Click-to-Redirect
1. Click the notification
2. ✅ You're redirected to Petty Cash page
3. ✅ Notification is marked as read
4. ✅ Badge count decreases

## 🎉 That's It!

You now have a fully working notification system with:
- ✅ Real-time notifications
- ✅ Click-to-redirect functionality
- ✅ Auto-refresh every 30 seconds
- ✅ Beautiful UI with icons
- ✅ Mark as read functionality

## 📋 What You Can Do Now

### View Notifications
- Click bell icon (🔔) in navbar
- See recent 10 unread notifications
- Click any notification to navigate

### Mark as Read
- Click notification → marks as read automatically
- Click "Mark all as read" → marks all as read

### View All Notifications
- Click "View all notifications" in dropdown
- Or navigate to `/notifications`
- Filter by: All, Unread, Read

### Test Different Notification Types
1. **Job Assignment**: Assign a job to a user
2. **Petty Cash**: Assign petty cash to a user
3. **Job Update**: Change job status
4. **Bill Generated**: Create an invoice

## 🔍 Verify It's Working

### Check 1: Bell Icon
- ✅ Bell icon appears in navbar
- ✅ Badge shows unread count
- ✅ Badge is red with white text

### Check 2: Dropdown
- ✅ Dropdown opens on click
- ✅ Shows notifications with icons
- ✅ Shows relative time (e.g., "5 mins ago")
- ✅ Unread notifications have blue background

### Check 3: Click Notification
- ✅ Navigates to correct page
- ✅ Notification marked as read
- ✅ Badge count updates
- ✅ Dropdown closes

### Check 4: Auto-Refresh
- ✅ Create notification in another tab
- ✅ Wait 30 seconds
- ✅ Notification appears automatically

## 🐛 Troubleshooting

### Issue: No bell icon in navbar
**Solution**: 
- Refresh page (Ctrl+R)
- Check browser console for errors
- Verify frontend is running

### Issue: No notifications appearing
**Solution**:
- Verify backend is running
- Check notification was created (see backend logs)
- Wait 30 seconds for auto-refresh
- Refresh page manually

### Issue: Click doesn't navigate
**Solution**:
- Check browser console for errors
- Verify routes are configured
- Try clicking again

### Issue: Badge not updating
**Solution**:
- Wait 30 seconds for auto-refresh
- Refresh page manually
- Check API response in Network tab

## 📚 Learn More

### Documentation:
1. **NOTIFICATION_SYSTEM_COMPLETE_SUMMARY.md** - Complete overview
2. **NOTIFICATION_CLICK_REDIRECT_IMPLEMENTATION.md** - Technical details
3. **NOTIFICATION_VISUAL_GUIDE.md** - Visual diagrams
4. **TARGET_PAGES_HIGHLIGHT_GUIDE.md** - Add highlight/scroll

### Key Files:
- `client/src/components/NotificationBell.js` - Bell component
- `client/src/components/Notifications.js` - Full page
- `client/src/components/Navbar.js` - Navbar with bell
- `backend-api/src/application/use-cases/pettycashassignment/CreatePettyCashAssignment.js` - Creates notifications

## 🎯 Next Steps

### Optional Enhancements:
1. **Add highlight/scroll** to target pages (15-20 min per page)
   - See: `TARGET_PAGES_HIGHLIGHT_GUIDE.md`
   - Makes redirect even better
   - Highlights and scrolls to the item

2. **Customize notification types**
   - Add more notification types
   - Customize icons and colors
   - Add notification sounds

3. **Add real-time updates**
   - Implement WebSocket
   - Get instant notifications
   - No need to wait 30 seconds

## ✅ Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Logged in as user
- [ ] Bell icon visible in navbar
- [ ] Created test notification
- [ ] Notification appears in dropdown
- [ ] Clicked notification
- [ ] Redirected to correct page
- [ ] Notification marked as read
- [ ] Badge count updated

## 🎉 Success!

If all checkboxes are checked, your notification system is working perfectly!

---

**Need Help?**
- Check documentation files
- Review browser console for errors
- Check backend logs for notification creation
- Verify API endpoints are responding

**Status**: Ready to Use
**Time to Complete**: 5 minutes
**Difficulty**: Easy
