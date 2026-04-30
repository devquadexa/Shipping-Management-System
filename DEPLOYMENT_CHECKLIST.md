# Payment Management Feature - Deployment Checklist

## Pre-Deployment Verification

### Local Development
- [x] All backend files created
- [x] All frontend files created
- [x] Database migration script created
- [x] Dependencies properly injected in DI container
- [x] Routes registered in server
- [x] Imports verified in all components
- [x] Documentation created

### Code Quality
- [x] Clean Architecture principles followed
- [x] Proper error handling implemented
- [x] Input validation on frontend and backend
- [x] SQL injection protection (parameterized queries)
- [x] Authentication and authorization implemented
- [x] Responsive design for mobile/tablet

## Deployment Steps

### Step 1: Database Setup ⚠️ CRITICAL
**Must be done FIRST before deploying code!**

```bash
# SSH to server
ssh root@72.61.169.242

# Navigate to project
cd /root/Shipping-Management-System/backend-api

# Create Payments table
docker exec -i cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -Q "$(cat create-payments-table.sql)"

# Verify table creation
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -Q "SELECT COUNT(*) as TableExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Payments'"
```

**Expected Output**: `TableExists: 1`

- [ ] Payments table created
- [ ] Indexes created
- [ ] Table verified in database

### Step 2: Build Frontend (Local Machine)

```powershell
# Navigate to project
cd "D:\Work and Learn\Quadexa\Shipping Management System"

# Build frontend
cd frontend
npm run build

# Copy to backend public folder
Remove-Item -Recurse -Force ../backend-api/public/*
Copy-Item -Recurse build/* ../backend-api/public/
```

- [ ] Frontend built successfully
- [ ] No build errors
- [ ] Files copied to backend/public

### Step 3: Commit and Push (Local Machine)

```powershell
# From project root
cd ..
git add -A
git commit -m "Add Payment Management feature - Track cheque and bank transfer payments"
git push origin main
```

- [ ] All files committed
- [ ] Pushed to main branch
- [ ] No git errors

### Step 4: Deploy to Server

```bash
# SSH to server (if not already connected)
ssh root@72.61.169.242

# Navigate to project
cd /root/Shipping-Management-System

# Pull latest changes
git pull origin main

# Rebuild backend (includes new routes and dependencies)
docker compose build --no-cache backend

# Restart backend
docker compose up -d backend

# Wait 10 seconds for startup
sleep 10

# Check logs
docker logs cargo_backend --tail 50
```

- [ ] Code pulled successfully
- [ ] Backend rebuilt without errors
- [ ] Backend container running
- [ ] No errors in logs
- [ ] Payment routes registered (check logs)

### Step 5: Verification Tests

#### Test 1: API Endpoint
```bash
# Should return 401 Unauthorized (correct - needs auth)
curl -X GET http://localhost:5000/api/payments/all
```
- [ ] Endpoint responds (even if unauthorized)

#### Test 2: Frontend Access
1. Open browser: https://supershinecargo.cloud
2. **Hard refresh**: `Ctrl + Shift + R` (IMPORTANT!)
3. Login as Admin or Super Admin
4. Go to **Accounting** tab
5. Verify **Payment Management** tab is visible

- [ ] Website loads
- [ ] Can login
- [ ] Accounting tab accessible
- [ ] Payment Management tab visible

#### Test 3: Create Payment Record
1. Go to **Billing/Invoicing** page
2. Find an unpaid invoice
3. Click **Mark Paid**
4. Select **Cheque** as payment method
5. Fill in cheque details:
   - Cheque Number: `TEST123`
   - Cheque Date: Today
   - Cheque Amount: Invoice amount
6. Click **Confirm Payment**

- [ ] Payment modal opens
- [ ] Can enter cheque details
- [ ] Invoice marked as paid
- [ ] Success message shown

#### Test 4: View Payment in Payment Management
1. Go to **Accounting → Payment Management**
2. Verify the test payment appears
3. Check summary cards show correct totals
4. Click **View** to see details
5. Click **Clear** to mark as cleared
6. Verify status changes to "Cleared"

- [ ] Payment appears in list
- [ ] Summary cards correct
- [ ] Can view details
- [ ] Can update status
- [ ] Status updates successfully

#### Test 5: Search and Filter
1. In Payment Management:
2. Test search by cheque number
3. Test filter by status (Pending/Cleared)
4. Test filter by payment method (Cheques/Bank)
5. Test pagination (change records per page)

- [ ] Search works
- [ ] Status filter works
- [ ] Payment method filter works
- [ ] Pagination works

#### Test 6: Access Control
1. Logout
2. Login as **Waff Clerk**
3. Go to Accounting tab
4. Verify Payment Management tab is NOT visible or shows access denied

- [ ] Waff Clerk cannot access Payment Management

### Step 6: Database Verification

```bash
# Check if payment records exist
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -Q "SELECT TOP 5 * FROM Payments ORDER BY CreatedDate DESC"
```

- [ ] Can query Payments table
- [ ] Test payment record exists
- [ ] Data is correct

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Check backend logs for errors: `docker logs cargo_backend --tail 100`
- [ ] Monitor database for payment records
- [ ] Verify no performance issues
- [ ] Check user feedback

### User Communication
- [ ] Notify Admin/Manager users about new feature
- [ ] Provide quick user guide
- [ ] Explain hard refresh requirement (Ctrl+Shift+R)

### Documentation
- [ ] Update system documentation
- [ ] Add to user manual
- [ ] Create training materials if needed

## Rollback Plan (If Issues Occur)

```bash
# On server
cd /root/Shipping-Management-System

# Find previous commit
git log --oneline -5

# Rollback to previous version
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose build --no-cache backend
docker compose up -d backend
```

**Note**: Payments table will remain in database (safe to keep)

## Troubleshooting

### Issue: Payment Management tab not showing
**Solution**: Hard refresh browser (Ctrl+Shift+R) or use incognito mode

### Issue: Payments not being created
**Check**:
1. Payment method is Cheque or Bank Transfer (not Cash)
2. Backend logs: `docker logs cargo_backend --tail 100`
3. Database table exists
4. No errors in browser console (F12)

### Issue: 404 on /api/payments/all
**Solution**:
```bash
docker compose restart backend
docker logs cargo_backend --tail 50
```

### Issue: Database connection errors
**Check**:
1. cargo_db container is running: `docker ps`
2. Database credentials are correct
3. Payments table exists

## Success Criteria

✅ All checklist items completed  
✅ No errors in backend logs  
✅ Payment Management accessible to Admin/Manager  
✅ Can create payment records  
✅ Can view and update payment status  
✅ Search and filter working  
✅ Access control working  
✅ No performance degradation  

## Sign-Off

- [ ] Developer: Implementation complete
- [ ] Tester: All tests passed
- [ ] Admin: Feature verified in production
- [ ] Manager: Approved for use

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Verified By**: _________________  
**Status**: ⬜ Pending | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back

## Notes

_Add any deployment notes, issues encountered, or special considerations here:_

---

**Important Reminders**:
1. ⚠️ Create database table BEFORE deploying code
2. 🔄 Users must hard refresh (Ctrl+Shift+R) after deployment
3. 💾 Payment records are only created for Cheque/Bank Transfer (not Cash)
4. 🔒 Only Admin/Super Admin/Manager can access Payment Management
5. 📊 Initial payment status is always "Pending"
