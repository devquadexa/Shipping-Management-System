# Payment Tracking Table - Bug Fixes

## Issues Fixed

### 1. Runtime Error: `bill.paymentRecords.map is not a function`
**Root Cause**: The `paymentRecords` array was not being properly initialized when fetching bills. If the API call failed or returned undefined, the component would crash when trying to call `.map()` on a non-array value.

**Fix Applied**:
- **File**: `frontend/src/components/Billing.js` (fetchBills function)
- **Change**: Added explicit array type checking to ensure `paymentRecords` is always an array
- **Code**:
  ```javascript
  const records = Array.isArray(paymentRecords.data) ? paymentRecords.data : [];
  return {
    ...bill,
    paymentRecords: records  // Always an array, never undefined
  };
  ```

### 2. Payment Date Not Recording
**Root Cause**: The `paidDate` from the frontend was not being passed through to the payment record creation in the backend use cases.

**Fixes Applied**:

#### Backend - ApplyPartialPayment Use Case
- **File**: `backend-api/src/application/use-cases/billing/ApplyPartialPayment.js`
- **Change**: Updated payment record creation to use `paymentDetails.paidDate` if provided
- **Code**:
  ```javascript
  paymentDate: paymentDetails.paidDate ? new Date(paymentDetails.paidDate) : new Date(),
  ```

#### Backend - MarkBillAsPaid Use Case
- **File**: `backend-api/src/application/use-cases/billing/MarkBillAsPaid.js`
- **Change**: Updated payment record creation to use `paymentDetails.paidDate` if provided
- **Code**:
  ```javascript
  paymentDate: paymentDetails.paidDate ? new Date(paymentDetails.paidDate) : new Date(),
  ```

## How Payment Tracking Works Now

### Flow for Partial Payments:
1. **Frontend** (`Billing.js`):
   - User selects "Partial Payment" mode
   - Enters payment amount and method
   - Submits payment with `paidDate: new Date().toISOString()`

2. **Backend** (`ApplyPartialPayment.js`):
   - Validates payment amount against remaining balance
   - Updates bill's `paidAmount` and `remainingAmount`
   - Creates a Payment record in the Payments table with the provided `paidDate`
   - Updates job status to "Partially Paid" or "Payment Collected"

3. **Frontend** (`fetchBills`):
   - Fetches all bills
   - For each bill, fetches payment records via `/payments/bill/{billId}`
   - Ensures `paymentRecords` is always an array
   - Renders Payment Tracking table with all payment records

### Flow for Full Payments:
1. **Frontend** (`Billing.js`):
   - User selects "Full Payment" mode
   - Enters payment method details
   - Submits payment with `paidDate: new Date().toISOString()`

2. **Backend** (`MarkBillAsPaid.js`):
   - Marks bill as "Paid"
   - Creates a Payment record in the Payments table with the provided `paidDate`
   - Updates job status to "Payment Collected"

3. **Frontend** (`fetchBills`):
   - Fetches all bills
   - For each bill, fetches payment records via `/payments/bill/{billId}`
   - Renders Payment Tracking table showing all payment history

## Payment Tracking Table Display

The Payment Tracking table now displays:
- **For Partially Paid invoices**: All partial payment records with running balance
- **For Paid invoices**: Complete payment history showing all payments made

### Table Columns:
1. **#** - Sequential payment number
2. **Payment Date** - Date payment was recorded
3. **Method** - Payment method (Cash, Cheque, Bank Transfer)
4. **Reference** - Cheque number or bank name
5. **Amount Paid** - Amount of this payment
6. **Remaining Balance** - Running balance after this payment

### Running Balance Calculation:
```javascript
const paidUpToThisPoint = bill.paymentRecords
  .slice(0, idx + 1)
  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
const remainingAtThisPoint = (parseFloat(bill.netTotal || bill.total || 0)) - paidUpToThisPoint;
```

## Database Schema

The Payments table stores:
- `PaymentId` - Unique payment identifier
- `BillId` - Reference to the bill
- `PaymentDate` - When the payment was made
- `Amount` - Payment amount
- `PaymentMethod` - Cash, Cheque, or Bank Transfer
- `ChequeNumber`, `ChequeDate`, `ChequeAmount` - For cheque payments
- `BankName` - For bank transfer payments
- `Status` - Pending, Cleared, or Bounced

## Testing Checklist

- [ ] Partial payment records are created in the Payments table
- [ ] Payment date is correctly recorded for each payment
- [ ] Payment Tracking table displays all payment records
- [ ] Running balance calculation is correct
- [ ] No runtime errors when rendering Payment Tracking table
- [ ] Payment Tracking table shows for both Partially Paid and Paid invoices
- [ ] Multiple payments for the same invoice display as separate rows
- [ ] Payment date is visible in the Payment Tracking table

## Files Modified

1. `frontend/src/components/Billing.js` - Fixed fetchBills to ensure paymentRecords is always an array
2. `backend-api/src/application/use-cases/billing/ApplyPartialPayment.js` - Fixed payment date recording for partial payments
3. `backend-api/src/application/use-cases/billing/MarkBillAsPaid.js` - Fixed payment date recording for full payments
