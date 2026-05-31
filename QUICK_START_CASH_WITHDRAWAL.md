# Quick Start Guide - Cash Withdrawal Feature

## Overview
This guide will help you quickly test the new cash withdrawal feature in the Petty Cash Management system.

## Prerequisites
- Backend server running on port 5000
- Frontend running on port 3000
- Admin or Super Admin account credentials
- MSSQL database connected

## Step-by-Step Testing

### 1. Start the Application

**Backend:**
```bash
cd backend-api
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```

### 2. Login
- Open browser: `http://localhost:3000`
- Login with Admin or Super Admin credentials

### 3. Navigate to Petty Cash
- Click on "Petty Cash" in the navigation menu
- You should see the Petty Cash Management page

### 4. Find Cash Withdrawals Section
- Scroll down past the "User Petty Cash Summary" section
- Look for "Cash Withdrawals from Bank" section
- You should see a "+ Record Withdrawal" button

### 5. Record a Test Withdrawal

**Click "+ Record Withdrawal"**
- A modal popup will appear

**Fill in the form:**
- **Amount**: 50000 (or any amount)
- **Bank Name**: Commercial Bank
- **Withdrawal Date**: Select today's date (default)
- **Notes**: "Test withdrawal for petty cash" (optional)

**Submit:**
- Click "Record Withdrawal" button
- Modal should close
- Success message should appear

### 6. Verify the Results

**Check the Withdrawal Box:**
- A new box should appear in the grid
- Should show:
  - Withdrawal ID (e.g., CW000001)
  - Amount: LKR 50,000.00
  - Bank: Commercial Bank
  - Date: Today's date
  - Recorded By: Your name
  - Notes: Your note (if added)

**Check Petty Cash Balance:**
- Scroll up to the overall balance
- Balance should have increased by 50,000

### 7. Test Multiple Withdrawals
- Click "+ Record Withdrawal" again
- Add another withdrawal with different details
- Verify both appear in the grid

### 8. Test Collapsible Section
- Click on the "Cash Withdrawals from Bank" header
- Section should collapse
- Click again to expand

## Expected Behavior

✅ **Modal Opens**: Clean popup with form fields
✅ **Validation**: Cannot submit without required fields
✅ **Success Message**: "Cash withdrawal recorded successfully"
✅ **Box Appears**: New withdrawal shows in grid
✅ **Balance Updates**: Petty cash balance increases
✅ **Hover Effect**: Boxes lift slightly on hover
✅ **Responsive**: Works on different screen sizes

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify you're logged in as Admin/Super Admin
- Refresh the page

### Withdrawal doesn't save
- Check backend console for errors
- Verify database connection
- Check API endpoint: `POST /api/cash-withdrawals`

### Balance doesn't update
- Refresh the page
- Check if withdrawal was actually saved
- Verify petty cash balance endpoint is working

### Box doesn't appear
- Check if withdrawal was saved (check database)
- Verify `GET /api/cash-withdrawals` endpoint
- Check browser console for errors

## API Testing (Optional)

### Using Postman or curl

**Get all withdrawals:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/cash-withdrawals
```

**Create withdrawal:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "bankName": "Commercial Bank",
    "withdrawalDate": "2024-01-15",
    "notes": "Test withdrawal"
  }' \
  http://localhost:5000/api/cash-withdrawals
```

## Database Verification

**Check if table was created:**
```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'CashWithdrawals'
```

**View withdrawal records:**
```sql
SELECT * FROM CashWithdrawals
ORDER BY createdAt DESC
```

**Check petty cash balance:**
```sql
SELECT * FROM PettyCashBalance
```

## Success Criteria

- ✅ Modal opens and closes properly
- ✅ Form validation works
- ✅ Withdrawal saves to database
- ✅ Withdrawal appears in UI as a box
- ✅ Petty cash balance increases correctly
- ✅ All withdrawal details display correctly
- ✅ Section can collapse/expand
- ✅ Multiple withdrawals can be added
- ✅ Hover effects work on boxes

## Next Steps

After successful testing:
1. Test with different amounts and banks
2. Test with very long notes
3. Test date selection (past dates)
4. Test with Manager role (should view only)
5. Test with Waff Clerk role (should not see section)
6. Test responsive design on mobile

## Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check backend console for API errors
3. Verify database connection
4. Check authentication token is valid
5. Review the CASH_WITHDRAWAL_FEATURE.md for detailed documentation
