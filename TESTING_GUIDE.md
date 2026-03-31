# Testing Guide - Parent-Child Petty Cash Assignments

## Prerequisites

Before testing, ensure:
- ✅ Database migration has been run successfully
- ✅ Backend server is running (npm start in backend-api folder)
- ✅ Frontend is running (npm start in frontend folder)
- ✅ You have valid login credentials

## Step 5: Testing the Functionality

### Test 1: Access the New Page ✅

**Steps:**
1. Login to the application
2. Look at the navigation menu
3. You should see two Petty Cash links:
   - "Petty Cash" (original view)
   - "Petty Cash (Grouped)" (new aggregated view)
4. Click on "Petty Cash (Grouped)"

**Expected Result:**
- Page loads without errors
- You see a table with grouped assignments
- Each row shows: Job ID, Category, Assigned To, Total Amount, Assignment Count, Status, Date

**If it fails:**
- Check browser console (F12) for errors
- Verify the component file exists: `frontend/src/components/PettyCashAggregated.js`
- Verify the CSS file exists: `frontend/src/styles/PettyCashAggregated.css`

---

### Test 2: View Existing Assignments ✅

**Steps:**
1. On the "Petty Cash (Grouped)" page
2. Look at the table rows
3. Check if existing assignments are displayed

**Expected Result:**
- If you have existing petty cash assignments, they should be grouped by Job ID + User
- Example: If JOB0002 has 2 assignments for Clerk 01, you should see ONE row showing:
  - Job ID: JOB0002
  - Assigned To: Clerk 01
  - Total Amount: Sum of both assignments (e.g., LKR 20,000)
  - Assignments: "2 assignments"

**If no data shows:**
- Check if you have any petty cash assignments in the database
- Check browser console for API errors
- Verify backend is running and accessible
- Check backend logs for errors

---

### Test 3: Expand/Collapse Functionality ✅

**Steps:**
1. Find a row with multiple assignments (shows "2 assignments" or more)
2. Click the expand button (▶) on the left side of the row
3. Observe the expanded view
4. Click the collapse button (▼) to close it

**Expected Result:**
- Row expands smoothly with animation
- Shows a detailed table with individual assignments:
  - Assignment ID
  - Amount
  - Actual Spent
  - Balance
  - Over Amount
  - Status
  - Dates
  - Notes
- Bottom row shows totals
- Collapse button (▼) appears
- Clicking collapse closes the expanded view smoothly

**If it fails:**
- Check if the expand button is clickable
- Check browser console for JavaScript errors
- Verify CSS animations are working

---

### Test 4: Create Sub-Assignment (Admin/Manager Only) ✅

**Prerequisites:**
- You must be logged in as Admin, Super Admin, or Manager
- You must have at least one existing assignment

**Steps:**
1. On the "Petty Cash (Grouped)" page
2. Find any row
3. Click the "+ Add" button on the right side
4. A modal should open
5. Fill in the form:
   - Amount: 5000
   - Notes: "Test sub-assignment"
6. Click "Create Sub-Assignment"

**Expected Result:**
- Modal opens smoothly
- Job ID and Assigned To fields are pre-filled and disabled
- Amount field is editable and required
- Notes field is optional
- After submitting:
  - Modal closes
  - Success message appears
  - The row's total amount increases by 5000
  - Assignment count increases by 1
  - If you expand the row, you see the new assignment

**If it fails:**
- Check if "+ Add" button is visible (only for Admin/Manager)
- Check browser console for errors
- Check backend logs for API errors
- Verify you have permission to create assignments

---

### Test 5: Role-Based Access Control ✅

**Test as Admin/Manager:**
- [ ] Can see "Petty Cash (Grouped)" in menu
- [ ] Can view all aggregated assignments
- [ ] Can see "+ Add" button
- [ ] Can create sub-assignments
- [ ] Can expand/collapse rows

**Test as Waff Clerk:**
- [ ] Can see "Petty Cash (Grouped)" in menu
- [ ] Can view only their own aggregated assignments
- [ ] CANNOT see "+ Add" button
- [ ] Can expand/collapse rows to view details

**Test as Office Executive:**
- [ ] CANNOT see "Petty Cash (Grouped)" in menu
- [ ] Redirected if trying to access directly

---

### Test 6: Responsive Design ✅

**Desktop (> 1200px):**
1. Open page on desktop browser
2. Verify all columns are visible
3. Check spacing and layout

**Tablet (768px - 1200px):**
1. Resize browser window to tablet size
2. Verify table is still readable
3. Check that all functionality works

**Mobile (< 768px):**
1. Open on mobile device or resize browser to mobile size
2. Verify horizontal scroll works
3. Check that expand/collapse works
4. Verify modal is responsive

---

### Test 7: Data Accuracy ✅

**Steps:**
1. Expand a grouped row
2. Manually calculate the sum of individual assignment amounts
3. Compare with the total shown in the main row

**Expected Result:**
- Total Amount in main row = Sum of all individual assignment amounts
- Assignment count matches the number of individual assignments shown
- All individual assignment details are correct

---

### Test 8: API Endpoints ✅

**Using Browser DevTools (F12 → Network tab):**

1. **Load Page:**
   - Should call: `GET /api/petty-cash-assignments/aggregated` (or `/my-aggregated` for Waff Clerk)
   - Status: 200 OK
   - Response: Array of aggregated assignments

2. **Create Sub-Assignment:**
   - Should call: `POST /api/petty-cash-assignments/:id/sub-assignment`
   - Status: 201 Created
   - Response: New assignment object

**If API calls fail:**
- Check backend server is running
- Check authentication token is valid
- Check backend logs for errors
- Verify database migration was successful

---

### Test 9: Error Handling ✅

**Test Invalid Token:**
1. Clear localStorage in browser console: `localStorage.clear()`
2. Refresh page
3. Should redirect to login

**Test Network Error:**
1. Stop backend server
2. Try to load the page
3. Should show error message

**Test Empty State:**
1. If no assignments exist, should show "No assignments found"

---

### Test 10: Performance ✅

**Check:**
- [ ] Page loads in < 2 seconds
- [ ] Expand/collapse is smooth (no lag)
- [ ] Modal opens/closes smoothly
- [ ] No console errors or warnings
- [ ] No memory leaks (check DevTools → Memory)

---

## Common Issues and Solutions

### Issue 1: "Component not found" error
**Solution:**
- Verify file exists: `frontend/src/components/PettyCashAggregated.js`
- Check import statement in App.js is correct
- Restart frontend development server

### Issue 2: Styles not applied
**Solution:**
- Verify file exists: `frontend/src/styles/PettyCashAggregated.css`
- Check import statement in component
- Clear browser cache (Ctrl+Shift+R)

### Issue 3: API returns 404
**Solution:**
- Verify backend server is running
- Check backend logs for route registration
- Verify database migration was successful
- Restart backend server

### Issue 4: Data not showing
**Solution:**
- Check if you have petty cash assignments in database
- Check browser console for errors
- Verify API endpoint is correct
- Check authentication token is valid

### Issue 5: "+ Add" button not visible
**Solution:**
- Verify you're logged in as Admin, Super Admin, or Manager
- Check role-based access control logic
- Check browser console for errors

---

## Testing Checklist Summary

### Basic Functionality
- [ ] Page loads without errors
- [ ] Navigation links are visible
- [ ] Data displays correctly
- [ ] Expand/collapse works
- [ ] Totals are accurate

### Admin/Manager Features
- [ ] "+ Add" button visible
- [ ] Can create sub-assignments
- [ ] Modal works correctly
- [ ] Success messages appear

### Waff Clerk Features
- [ ] Can view own assignments
- [ ] Cannot see "+ Add" button
- [ ] Can expand/collapse rows

### Design & UX
- [ ] Professional appearance
- [ ] Smooth animations
- [ ] Responsive on all devices
- [ ] Color coding works
- [ ] Status badges display correctly

### Technical
- [ ] No console errors
- [ ] API calls successful
- [ ] Good performance
- [ ] Error handling works
- [ ] Role-based access works

---

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Professional appearance
✅ Smooth user experience
✅ Role-based access working
✅ Data accuracy verified

---

## Next Steps After Testing

1. **If all tests pass:**
   - Mark feature as complete
   - Train users on new interface
   - Monitor for any issues

2. **If tests fail:**
   - Document the issue
   - Check the troubleshooting section
   - Review implementation documentation
   - Fix issues and re-test

3. **Gather feedback:**
   - Ask users for feedback
   - Document any enhancement requests
   - Plan future improvements

---

## Support

For issues during testing:
1. Check browser console (F12)
2. Check backend logs
3. Review documentation:
   - PARENT_CHILD_IMPLEMENTATION.md
   - QUICK_START_PARENT_CHILD.md
   - PARENT_CHILD_VISUAL_GUIDE.md
4. Verify all prerequisites are met
