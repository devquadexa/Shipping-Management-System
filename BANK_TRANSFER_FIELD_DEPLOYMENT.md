# Bank Transfer Field - Deployment Guide

## Overview
Added bank selection dropdown for "Bank Transfer" payment method in Old Invoice payments. Users must select a bank from the dropdown when payment method is "Bank Transfer".

## Available Banks
1. Commercial Bank
2. Peoples Bank

## Database Changes Required

### For Local Development Database

1. Open SQL Server Management Studio (SSMS)
2. Connect to your local database
3. Select the `SuperShineCargoDb` database
4. Execute the following SQL:

```sql
-- Add bank name field to OldInvoicePayments table
ALTER TABLE OldInvoicePayments
ADD bankName NVARCHAR(100) NULL;

GO

-- Verify column was added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OldInvoicePayments'
AND COLUMN_NAME = 'bankName';

GO
```

Expected output should show:
- bankName (nvarchar, 100, YES)

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

-- Add bank name field to OldInvoicePayments table
ALTER TABLE OldInvoicePayments
ADD bankName NVARCHAR(100) NULL;

GO

-- Verify column was added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OldInvoicePayments'
AND COLUMN_NAME = 'bankName';

GO
```

Type `exit` to close sqlcmd.

Option B - Using SQL file:

```bash
docker exec -it cargo_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -No -d SuperShineCargoDb -i /path/to/ADD_BANK_FIELD_TO_PAYMENTS.sql
```

**Step 3: Verify Changes**

```bash
docker exec -it cargo_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -No -d SuperShineCargoDb -Q "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'OldInvoicePayments' AND COLUMN_NAME = 'bankName'"
```

You should see: `bankName`

## Code Changes Summary

### Backend Changes

1. **MSSQLOldInvoiceRepository.js** - Updated `addPayment` method
   - Added `bankName` parameter
   - Field is optional (NULL allowed)
   - Saved when payment method is "Bank Transfer"

### Frontend Changes

1. **OldInvoices.js** - Updated payment form
   - Added `bankName` to payment state
   - Added conditional bank dropdown when payment method is "Bank Transfer"
   - Added validation for bank name when method is "Bank Transfer"
   - Updated payment history table to display bank name
   - Changed "Cheque Details" column header to "Details" (shows cheque or bank info)

2. **OldInvoices.css** - Added styling for bank details display
   - Added `.bank-details` class for formatting

## Feature Behavior

### When Payment Method is "Cash"
- Only standard fields shown
- No bank or cheque fields

### When Payment Method is "Cheque"
- Standard fields shown
- Cheque-specific fields shown:
  - Cheque Number (required)
  - Cheque Date (required)
  - Cheque Amount (required)
- Bank field hidden

### When Payment Method is "Bank Transfer"
- Standard fields shown
- Bank selection dropdown shown:
  - Commercial Bank
  - Peoples Bank
- Bank name is required
- Cheque fields hidden

### Payment History Display
- **For Cash**: Shows "-" in Details column
- **For Cheque**: Shows formatted cheque details (Number, Date, Amount)
- **For Bank Transfer**: Shows "Bank: [Bank Name]"

## Deployment Steps

### Step 1: Apply Database Changes

Execute the SQL script on both local and production databases as described above.

### Step 2: Test Locally

1. Start your local backend and frontend
2. Navigate to Old Invoices page
3. Add a payment with method "Bank Transfer"
4. Verify bank dropdown appears with 2 options
5. Verify bank selection is required
6. Submit payment and verify it saves correctly
7. Check payment history shows bank name

### Step 3: Push Code to GitHub

```bash
cd "D:\Work and Learn\Quadexa\Shipping Management System"
git add .
git commit -m "Add bank selection for bank transfer payments in old invoices"
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
4. Test adding a bank transfer payment
5. Verify bank name displays in payment history

## Testing Checklist

- [ ] Database column added successfully (local)
- [ ] Database column added successfully (production)
- [ ] Can add payment with Cash method (no bank field shown)
- [ ] Can add payment with Cheque method (no bank field shown)
- [ ] Bank dropdown appears when Bank Transfer method selected
- [ ] Bank dropdown shows "Commercial Bank" and "Peoples Bank"
- [ ] Bank selection is required when Bank Transfer method selected
- [ ] Cannot submit bank transfer payment without selecting bank
- [ ] Bank transfer payment saves correctly with bank name
- [ ] Payment history shows bank name for bank transfer payments
- [ ] Payment history shows "-" for cash payments
- [ ] Payment history shows cheque details for cheque payments
- [ ] Existing payments still display correctly
- [ ] Can delete bank transfer payments
- [ ] All other Old Invoice features still work

## Files Modified

### Backend
- `backend-api/src/infrastructure/repositories/MSSQLOldInvoiceRepository.js`

### Frontend
- `frontend/src/components/OldInvoices.js`
- `frontend/src/styles/OldInvoices.css`

### New Files
- `backend-api/src/config/ADD_BANK_FIELD_TO_PAYMENTS.sql`
- `BANK_TRANSFER_FIELD_DEPLOYMENT.md`

## Database Schema

### OldInvoicePayments Table - New Column

| Column Name | Data Type | Length | Nullable | Description |
|------------|-----------|--------|----------|-------------|
| bankName | NVARCHAR | 100 | YES | Bank name for bank transfer payments |

## Example Data

### Cash Payment
```json
{
  "paymentAmount": 50000.00,
  "paymentMethod": "Cash",
  "receivedDate": "2026-03-21",
  "notes": "Cash payment received",
  "chequeNumber": null,
  "chequeDate": null,
  "chequeAmount": null,
  "bankName": null
}
```

### Cheque Payment
```json
{
  "paymentAmount": 100000.00,
  "paymentMethod": "Cheque",
  "receivedDate": "2026-03-21",
  "notes": "Cheque payment",
  "chequeNumber": "123456",
  "chequeDate": "2026-03-20",
  "chequeAmount": 100000.00,
  "bankName": null
}
```

### Bank Transfer Payment
```json
{
  "paymentAmount": 75000.00,
  "paymentMethod": "Bank Transfer",
  "receivedDate": "2026-03-21",
  "notes": "Bank transfer received",
  "chequeNumber": null,
  "chequeDate": null,
  "chequeAmount": null,
  "bankName": "Commercial Bank"
}
```

## Payment History Display Examples

### Cash Payment
```
Date: 21/03/2026
Amount: LKR 50,000.00
Method: Cash
Details: -
Notes: Cash payment received
```

### Cheque Payment
```
Date: 21/03/2026
Amount: LKR 100,000.00
Method: Cheque
Details: 
  No: 123456
  Date: 20/03/2026
  Amount: LKR 100,000.00
Notes: Cheque payment
```

### Bank Transfer Payment
```
Date: 21/03/2026
Amount: LKR 75,000.00
Method: Bank Transfer
Details: Bank: Commercial Bank
Notes: Bank transfer received
```

## Rollback Plan

If issues occur, you can remove the bank field:

```sql
ALTER TABLE OldInvoicePayments DROP COLUMN bankName;
GO
```

Then revert the code changes via git:

```bash
git revert HEAD
git push origin main
```

## Notes

- Bank name field is optional in the database (NULL allowed) for backward compatibility
- Existing payments without bank data will display "-" in the Details column
- The feature does not affect existing functionality
- Bank list is hardcoded in frontend (Commercial Bank, Peoples Bank)
- To add more banks in the future, simply add more `<option>` elements in the dropdown

## Future Enhancements

If you need to add more banks in the future, edit `frontend/src/components/OldInvoices.js` and add options to the bank dropdown:

```jsx
<select name="bankName" value={paymentData.bankName} onChange={handlePaymentInputChange} required>
  <option value="">Select Bank</option>
  <option value="Commercial Bank">Commercial Bank</option>
  <option value="Peoples Bank">Peoples Bank</option>
  <option value="Bank of Ceylon">Bank of Ceylon</option>  {/* New bank */}
  <option value="Sampath Bank">Sampath Bank</option>      {/* New bank */}
</select>
```

