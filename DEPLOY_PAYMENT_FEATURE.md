# Quick Deployment Guide - Payment Details Feature

## Step-by-Step Deployment

### Step 1: Database Migration (CRITICAL - Do This First!)

Connect to your production database and run the migration:

**Option A: Using sqlcmd (Command Line)**
```bash
sqlcmd -S 72.61.169.242,1433 -U sa -P YourStrongPassword123! -d SuperShineCargoDb -i backend-api/src/config/ADD_PAYMENT_DETAILS_TO_BILLS.sql
```

**Option B: Using SQL Server Management Studio (SSMS)**
1. Open SSMS
2. Connect to: `72.61.169.242,1433`
3. Login: `sa` / `YourStrongPassword123!`
4. Select database: `SuperShineCargoDb`
5. Open file: `backend-api/src/config/ADD_PAYMENT_DETAILS_TO_BILLS.sql`
6. Click Execute (F5)
7. Verify success messages in output

**Expected Output:**
```
Added paymentMethod column to Bills table
Added chequeNumber column to Bills table
Added chequeDate column to Bills table
Added chequeAmount column to Bills table
Added bankName column to Bills table
Added paidDate column to Bills table
Payment details columns migration completed successfully!
```

### Step 2: Deploy Backend Changes

```bash
# SSH into your server
ssh root@72.61.169.242

# Navigate to backend directory
cd /path/to/backend-api

# Pull latest code (if using git)
git pull origin main

# Or upload modified files:
# - src/domain/entities/Bill.js
# - src/infrastructure/repositories/MSSQLBillRepository.js
# - src/application/use-cases/billing/MarkBillAsPaid.js
# - src/presentation/controllers/BillingController.js

# Restart backend container
docker restart cargo_backend

# Check logs
docker logs -f cargo_backend
```

### Step 3: Deploy Frontend Changes

```bash
# Navigate to frontend directory
cd /path/to/frontend

# Pull latest code (if using git)
git pull origin main

# Or upload modified files:
# - src/api/services/billingService.js
# - src/components/Billing.js
# - src/styles/Billing.css

# Rebuild and restart frontend container
docker restart cargo_frontend

# Check logs
docker logs -f cargo_frontend
```

### Step 4: Verify Deployment

1. **Open Application**: https://supershinecargo.cloud
2. **Login** as Super Admin / Admin / Manager
3. **Navigate to Billing Section**
4. **Find an Unpaid Invoice**
5. **Click "Mark Paid" Button**
6. **Verify Modal Opens** with payment form
7. **Test Each Payment Method**:
   - Cash (no extra fields)
   - Cheque (enter number, date, amount)
   - Bank Transfer (select bank)
8. **Submit Payment**
9. **Verify Success Message**
10. **Check Invoice Status** changed to "Paid"

### Step 5: Database Verification

Check that payment details are saved:

```sql
-- Connect to database and run:
SELECT TOP 5 
    BillId, 
    InvoiceNumber, 
    PaymentStatus, 
    paymentMethod, 
    chequeNumber, 
    chequeDate, 
    chequeAmount, 
    bankName,
    paidDate
FROM Bills 
WHERE PaymentStatus = 'Paid'
ORDER BY paidDate DESC;
```

## Rollback Plan (If Needed)

### If Issues Occur:

1. **Restore Previous Backend**:
```bash
docker restart cargo_backend
# Or restore from backup
```

2. **Restore Previous Frontend**:
```bash
docker restart cargo_frontend
# Or restore from backup
```

3. **Database Rollback** (Only if necessary):
```sql
-- Remove added columns (CAUTION: This will delete payment data!)
ALTER TABLE Bills DROP COLUMN paymentMethod;
ALTER TABLE Bills DROP COLUMN chequeNumber;
ALTER TABLE Bills DROP COLUMN chequeDate;
ALTER TABLE Bills DROP COLUMN chequeAmount;
ALTER TABLE Bills DROP COLUMN bankName;
ALTER TABLE Bills DROP COLUMN paidDate;
```

## Common Issues & Solutions

### Issue 1: Modal Not Opening
**Solution**: Clear browser cache and hard refresh (Ctrl+F5)

### Issue 2: Payment Details Not Saving
**Solution**: 
- Check backend logs: `docker logs cargo_backend`
- Verify database migration completed
- Check network tab in browser DevTools

### Issue 3: Validation Errors
**Solution**: 
- Ensure all required fields filled
- Check date format (YYYY-MM-DD)
- Verify amount is positive number

### Issue 4: Database Connection Error
**Solution**:
- Verify database server is running
- Check connection string in backend .env
- Test database connectivity

## Post-Deployment Checklist

- [ ] Database migration completed successfully
- [ ] Backend container restarted
- [ ] Frontend container restarted
- [ ] Payment modal opens correctly
- [ ] All payment methods work
- [ ] Validation messages display
- [ ] Payment details save to database
- [ ] Invoice status updates to "Paid"
- [ ] No console errors
- [ ] Mobile responsive design works
- [ ] Tested by Super Admin
- [ ] Tested by Admin
- [ ] Tested by Manager

## Support Contacts

If you encounter issues:
1. Check application logs
2. Review browser console
3. Verify database changes
4. Test with different browsers
5. Contact development team

## Success Criteria

✅ Users can mark invoices as paid
✅ Payment method selection works
✅ Cheque details captured correctly
✅ Bank transfer information saved
✅ Professional UI matches company standards
✅ Mobile responsive
✅ No errors in production

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Verified By**: _____________
**Status**: _____________
