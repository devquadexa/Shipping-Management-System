# Cheque Fields Feature - Deployment Guide

## Overview
This update adds cheque-specific fields to the Old Invoice payment form. When payment method is "Cheque", users must enter:
- Cheque Number
- Cheque Date
- Cheque Amount (total amount on the cheque)

## Database Changes Required

### For Local Development Database

1. Open SQL Server Management Studio (SSMS)
2. Connect to your local database
3. Select the `SuperShineCargoDb` database
4. Execute the following SQL:

```sql
-- Add cheque-specific fields to OldInvoicePayments table
ALTER TABLE OldInvoicePayments
ADD chequeNumber NVARCHAR(100) NULL;

ALTER TABLE OldInvoicePayments
ADD chequeDate DATE NULL;

ALTER TABLE OldInvoicePayments
ADD chequeAmount DECIMAL(18, 2) NULL;

GO

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OldInvoicePayments'
ORDER BY ORDINAL_POSITION;

GO
```

Expected output should show the new columns:
- chequeNumber (nvarchar, 100, YES)
- chequeDate (date, NULL, YES)
- chequeAmount (decimal, NULL, YES)

### For Production Database

**Step 1: Connect to Production Server**

```bash
ssh root@72.61.169.242
```

**Step 2: Execute SQL Script**

Option A - Using sqlcmd interactively:

```bash
docker exec -it cargo_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -No -d SuperShineCargoDb
```

Then paste:

```sql
USE SuperShineCargoDb;
GO

-- Add cheque-specific fields to OldInvoicePayments table
ALTER TABLE OldInvoicePayments
ADD chequeNumber NVARCHAR(100) NULL;

ALTER TABLE OldInvoicePayments
ADD chequeDate DATE NULL;

ALTER TABLE OldInvoicePayments
ADD chequeAmount DECIMAL(18, 2) NULL;

GO

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OldInvoicePayments'
ORDER BY ORDINAL_POSITION;

GO
```

Type `exit` to close sqlcmd.

Option B - Using SQL file:

```bash
docker exec -it cargo_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -No -d SuperShineCargoDb -i /path/to/ADD_CHEQUE_FIELDS_TO_PAYMENTS.sql
```

**Step 3: Verify Changes**

```bash
docker exec -it cargo_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -No -d SuperShineCargoDb -Q "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'OldInvoicePayments' AND COLUMN_NAME LIKE 'cheque%'"
```

You should see:
- chequeNumber
- chequeDate
- chequeAmount

## Code Changes Summary

### Backend Changes

1. **MSSQLOldInvoiceRepository.js** - Updated `addPayment` method to handle new cheque fields
   - Added chequeNumber, chequeDate, chequeAmount parameters
   - Fields are optional (NULL allowed)

### Frontend Changes

1. **OldInvoices.js** - Updated payment form
   - Added chequeNumber, chequeDate, chequeAmount to state
   - Added conditional rendering of cheque fields when payment method is "Cheque"
   - Added validation for cheque fields
   - Updated payment history table to display cheque details

2. **OldInvoices.css** - Added styling for cheque details display
   - Added `.cheque-details` class for formatting

## Deployment Steps

### Step 1: Apply Database Changes

Execute the SQL scripts on both local and production databases as described above.

### Step 2: Test Locally

1. Start your local backend and frontend
2. Navigate to Old Invoices page
3. Add a payment with method "Cheque"
4. Verify cheque fields appear and are required
5. Submit payment and verify it saves correctly
6. Check payment history shows cheque details

### Step 3: Push Code to GitHub

```bash
cd "D:\Work and Learn\Quadexa\Shipping Management System"
git add .
git commit -m "Add cheque fields to old invoice payments"
git push origin main
```

### Step 4: Deploy to Production

SSH into the server:

```bash
ssh root@72.61.169.242
cd Shipping-Management-System
git pull origin main
```

### Step 5: Rebuild and Restart Containers

```bash
docker compose down
docker compose up -d --build
```

### Step 6: Verify Deployment

1. Check backend logs: `docker logs cargo_backend --tail 50`
2. Check frontend logs: `docker logs cargo_frontend --tail 30`
3. Open `https://supershinecargo.cloud/old-invoices`
4. Test adding a cheque payment
5. Verify cheque details display in payment history

## Feature Behavior

### When Payment Method is "Cash" or "Bank Transfer"
- Only standard fields shown: Payment Amount, Payment Method, Received Date, Notes
- Cheque fields are hidden
- No cheque validation

### When Payment Method is "Cheque"
- All standard fields shown
- Additional cheque fields shown:
  - Cheque Number (required, text input)
  - Cheque Date (required, date picker)
  - Cheque Amount (required, decimal input)
- Form validates all cheque fields before submission
- Cheque details saved to database

### Payment History Display
- For Cash/Bank Transfer: Shows "-" in Cheque Details column
- For Cheque: Shows formatted cheque details:
  - No: [cheque number]
  - Date: [formatted cheque date]
  - Amount: [formatted cheque amount in LKR]

## Testing Checklist

- [ ] Database columns added successfully (local)
- [ ] Database columns added successfully (production)
- [ ] Can add payment with Cash method (no cheque fields shown)
- [ ] Can add payment with Bank Transfer method (no cheque fields shown)
- [ ] Cheque fields appear when Cheque method selected
- [ ] Cheque fields are required when Cheque method selected
- [ ] Cannot submit cheque payment without all cheque fields
- [ ] Cheque payment saves correctly with all details
- [ ] Payment history shows cheque details for cheque payments
- [ ] Payment history shows "-" for non-cheque payments
- [ ] Existing payments still display correctly
- [ ] Can delete cheque payments
- [ ] All other Old Invoice features still work

## Files Modified

### Backend
- `backend-api/src/infrastructure/repositories/MSSQLOldInvoiceRepository.js`

### Frontend
- `frontend/src/components/OldInvoices.js`
- `frontend/src/styles/OldInvoices.css`

### New Files
- `backend-api/src/config/ADD_CHEQUE_FIELDS_TO_PAYMENTS.sql`
- `CHEQUE_FIELDS_DEPLOYMENT.md`

## Rollback Plan

If issues occur, you can remove the cheque fields:

```sql
ALTER TABLE OldInvoicePayments DROP COLUMN chequeNumber;
ALTER TABLE OldInvoicePayments DROP COLUMN chequeDate;
ALTER TABLE OldInvoicePayments DROP COLUMN chequeAmount;
GO
```

Then revert the code changes via git:

```bash
git revert HEAD
git push origin main
```

## Notes

- Cheque fields are optional in the database (NULL allowed) for backward compatibility
- Existing payments without cheque data will display "-" in the Cheque Details column
- The feature does not affect existing functionality
- Payment amount and cheque amount can be different (e.g., partial payment from a larger cheque)

