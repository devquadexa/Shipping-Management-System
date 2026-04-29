# Payment Management Feature - Deployment Guide

## What's New?

A new **Payment Management** section has been added to track cheque and bank transfer payments. This feature automatically records payment details when invoices are marked as paid and allows you to manage payment status (Pending/Cleared/Bounced).

## Deployment Steps

### Step 1: Database Setup (IMPORTANT - Do this first!)

**On the server (SSH to 72.61.169.242):**

```bash
# 1. Connect to server
ssh root@72.61.169.242

# 2. Navigate to project directory
cd /root/Shipping-Management-System/backend-api

# 3. Run the SQL script to create Payments table
docker exec -i cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -Q "$(cat create-payments-table.sql)"
```

**Alternative method (if above doesn't work):**

```bash
# Copy the SQL file into the container
docker cp create-payments-table.sql cargo_db:/tmp/

# Execute it
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -i /tmp/create-payments-table.sql
```

**Verify table creation:**

```bash
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -Q "SELECT COUNT(*) as TableExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Payments'"
```

You should see `TableExists: 1`

### Step 2: Deploy Code Changes

**On your local machine (PowerShell):**

```powershell
# 1. Navigate to project directory
cd "D:\Work and Learn\Quadexa\Shipping Management System"

# 2. Build frontend
cd frontend
npm run build

# 3. Copy build to backend public folder
Remove-Item -Recurse -Force ../backend-api/public/*
Copy-Item -Recurse build/* ../backend-api/public/

# 4. Commit and push changes
cd ..
git add -A
git commit -m "Add Payment Management feature"
git push origin main
```

**On the server (SSH to 72.61.169.242):**

```bash
# 1. Navigate to project directory
cd /root/Shipping-Management-System

# 2. Pull latest changes
git pull origin main

# 3. Rebuild backend container (includes new payment routes)
docker compose build --no-cache backend

# 4. Restart backend
docker compose up -d backend

# 5. Verify backend is running
docker logs cargo_backend --tail 30

# 6. Check if payment routes are loaded
docker logs cargo_backend | grep -i payment
```

You should see logs indicating payment routes are registered.

### Step 3: Verify Deployment

**Test the API:**

```bash
# Test payment endpoint (should return 401 Unauthorized - this is correct)
curl -X GET http://localhost:5000/api/payments/all

# If you see "Unauthorized" or similar, the endpoint is working
```

**Test the UI:**

1. Open browser and go to: https://supershinecargo.cloud
2. **Hard refresh** the page: `Ctrl + Shift + R` (to clear cache)
3. Login as Admin or Super Admin
4. Go to **Accounting** tab
5. You should see a new tab: **Payment Management**
6. Click on it to verify it loads correctly

### Step 4: Test the Feature

**Test Payment Recording:**

1. Go to **Billing/Invoicing** page
2. Find an unpaid invoice
3. Click **Mark Paid**
4. Select **Cheque** as payment method
5. Fill in:
   - Cheque Number: `123456`
   - Cheque Date: Today's date
   - Cheque Amount: Invoice amount
6. Click **Confirm Payment**
7. You should see success message

**Test Payment Management:**

1. Go to **Accounting → Payment Management**
2. You should see the cheque payment you just created
3. Verify summary cards show correct totals
4. Click **View** to see payment details
5. Click **Clear** to mark the cheque as cleared
6. Verify status changes to "Cleared"

## Features Overview

### For Admins/Managers:

**When Marking Invoice as Paid:**
- Select payment method: Cash, Cheque, or Bank Transfer
- For Cheque: Enter cheque number, date, and amount
- For Bank Transfer: Select bank name
- System automatically creates payment record

**Payment Management Section:**
- View all cheque and bank transfer payments
- Summary cards showing:
  - Total cheques and cleared amounts
  - Total bank transfers
  - Bounced cheques (if any)
- Filter by:
  - Payment method (Cheques/Bank/All)
  - Status (Pending/Cleared/Bounced)
- Search by cheque number, bank, job ID, or customer
- Mark cheques as Cleared or Bounced
- View detailed payment information
- Professional pagination (20/50/100 records per page)

### Access Control:
- Only **Admin**, **Super Admin**, and **Manager** can access Payment Management
- Waff Clerks cannot access this section

## Troubleshooting

### Issue: Payment Management tab not showing

**Solution:**
```bash
# Hard refresh browser
Ctrl + Shift + R

# Or use incognito mode
Ctrl + Shift + N
```

### Issue: "Cannot read property 'length' of undefined"

**Solution:**
- Verify database table was created successfully
- Check backend logs: `docker logs cargo_backend --tail 50`
- Restart backend: `docker compose restart backend`

### Issue: Payments not being created when marking invoice as paid

**Solution:**
1. Check if payment method is Cheque or Bank Transfer (Cash is not tracked)
2. Verify backend logs for errors:
   ```bash
   docker logs cargo_backend --tail 100 | grep -i error
   ```
3. Check if Payments table exists:
   ```bash
   docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -Q "SELECT * FROM Payments"
   ```

### Issue: 404 error on /api/payments/all

**Solution:**
```bash
# Rebuild and restart backend
cd /root/Shipping-Management-System
docker compose build --no-cache backend
docker compose up -d backend
docker logs cargo_backend --tail 30
```

## Rollback Plan

If you encounter critical issues:

```bash
# On server
cd /root/Shipping-Management-System

# Revert to previous commit
git log --oneline -5  # Find previous commit hash
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose build --no-cache backend
docker compose up -d backend
```

## Post-Deployment Checklist

- [ ] Database table created successfully
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Payment Management tab visible in Accounting
- [ ] Can mark invoice as paid with cheque details
- [ ] Payment record created in database
- [ ] Can view payments in Payment Management
- [ ] Can update payment status (Clear/Bounce)
- [ ] Summary cards showing correct totals
- [ ] Search and filter working correctly
- [ ] Access control working (only Admin/Manager can access)

## Support

If you encounter any issues during deployment:

1. Check backend logs: `docker logs cargo_backend --tail 100`
2. Check database connection: `docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -Q "SELECT @@VERSION"`
3. Verify all containers are running: `docker ps`
4. Contact development team with error logs

## Notes

- Users will need to hard refresh (Ctrl+Shift+R) after deployment due to browser caching
- The feature is backward compatible - existing invoices are not affected
- Payment records are only created for Cheque and Bank Transfer payments (not Cash)
- Initial payment status is always "Pending" - must be manually updated to "Cleared" or "Bounced"
