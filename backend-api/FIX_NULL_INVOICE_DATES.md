# Fix NULL Invoice Dates and Invoice Numbers in Bills Table

## Problem
The Pending Payments Report is showing blank invoice dates and invoice numbers for some bills. This is because existing bills in the database have NULL values in the `invoiceDate` and `InvoiceNumber` columns. These columns were added later, so older bills don't have these values set.

## Solution
Update all bills with:
1. NULL `invoiceDate` to use their `BillDate` or `CreatedDate` as a fallback
2. NULL or empty `InvoiceNumber` to generate a number from their `BillId` (e.g., BILL0001 → INV-0001)

## How to Run the Fix

### Option 1: Using Node.js Script (Recommended)

```bash
cd backend-api
node fix-null-invoice-dates.js
```

This script will:
1. Connect to the database
2. Check how many bills have NULL invoiceDate
3. Check how many bills have NULL or empty InvoiceNumber
4. Update invoiceDate with COALESCE(BillDate, CreatedDate, GETDATE())
5. Update InvoiceNumber with 'INV-' + last 4 digits of BillId
6. Verify the update
7. Show a sample of updated bills

### Option 2: Using SQL Script Directly

If you prefer to run SQL directly:

```bash
# Connect to SQL Server and run:
sqlcmd -S localhost,63951 -d SuperShineCargoDb -U SUPER_SHINE_CARGO -P "1234@SuperShineDB" -i fix-null-invoice-dates.sql
```

Or use SQL Server Management Studio (SSMS) to execute `fix-null-invoice-dates.sql`

## What the Fix Does

### Fix Invoice Dates
```sql
UPDATE Bills
SET invoiceDate = COALESCE(BillDate, CreatedDate, GETDATE())
WHERE invoiceDate IS NULL;
```

This sets `invoiceDate` to:
1. `BillDate` if it exists
2. Otherwise `CreatedDate` if it exists
3. Otherwise current date/time

### Fix Invoice Numbers
```sql
UPDATE Bills
SET InvoiceNumber = 'INV-' + RIGHT(BillId, 4)
WHERE InvoiceNumber IS NULL OR InvoiceNumber = '';
```

This generates invoice numbers like:
- BILL0001 → INV-0001
- BILL0025 → INV-0025
- BILL0123 → INV-0123

## Verification

After running the fix, verify in the Pending Payments Report:
1. Navigate to Reports → Pending Payments
2. Select a date range
3. Click "View Report"
4. Check that both "Invoice Number" and "Invoice Date" columns now show data

## Prevention

New bills will automatically have both fields set because the repository code includes fallbacks:

```javascript
.input('invoiceNumber', this.sql.VarChar, bill.invoiceNumber)
.input('invoiceDate', this.sql.DateTime, bill.invoiceDate || new Date())
```

And the CreateBill use case generates invoice numbers and sets invoice dates automatically.

## Files Modified
- `backend-api/fix-null-invoice-dates.js` - Node.js script to fix NULL dates and numbers
- `backend-api/fix-null-invoice-dates.sql` - SQL script to fix NULL dates and numbers
- `backend-api/FIX_NULL_INVOICE_DATES.md` - This documentation

## Related Files
- `backend-api/src/infrastructure/repositories/MSSQLBillRepository.js` - Repository with fallback
- `backend-api/src/application/use-cases/billing/CreateBill.js` - Sets invoiceDate and invoiceNumber on creation
- `backend-api/src/application/use-cases/billing/GetPendingPaymentsReport.js` - Fetches invoiceDate and invoiceNumber
- `frontend/src/components/PendingPaymentsReport.js` - Displays invoiceDate and invoiceNumber

## Date Fixed
May 6, 2026
