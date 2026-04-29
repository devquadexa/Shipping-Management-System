# Payment Tracking Table - Testing Guide

## Overview
This guide provides step-by-step instructions to test the Payment Tracking table functionality after the bug fixes.

## Prerequisites
- Backend server running
- Frontend development server running
- Test invoice ready (e.g., BILL0014)
- Test customer with sufficient balance

## Test Scenarios

### Test 1: Single Partial Payment
**Objective**: Verify that a single partial payment is recorded and displayed correctly

**Steps**:
1. Navigate to Billing section
2. Find an unpaid invoice (e.g., BILL0014 with amount LKR 5000)
3. Click "Mark as Paid" button
4. Select "Partial Payment" mode
5. Enter payment amount: LKR 2000
6. Select payment method: "Cheque"
7. Enter cheque details:
   - Cheque Number: CHQ001
   - Cheque Date: Today's date
   - Cheque Amount: LKR 2000
8. Click "Submit Payment"
9. Verify:
   - Invoice status changes to "Partially Paid"
   - Payment Tracking table appears
   - Shows 1 payment record with:
     - Payment Date: Today's date
     - Method: Cheque badge
     - Reference: CHQ: CHQ001
     - Amount Paid: LKR 2,000.00
     - Remaining Balance: LKR 3,000.00

**Expected Result**: ✅ Payment recorded successfully with correct date and amount

---

### Test 2: Multiple Partial Payments (Same Invoice)
**Objective**: Verify that multiple partial payments are recorded as separate rows with correct running balance

**Steps**:
1. Use the same invoice from Test 1 (BILL0014, now showing Partially Paid with LKR 3000 remaining)
2. Click "Mark as Paid" button again
3. Select "Partial Payment" mode
4. Enter payment amount: LKR 1000
5. Select payment method: "Cheque"
6. Enter cheque details:
   - Cheque Number: CHQ002
   - Cheque Date: Today's date
   - Cheque Amount: LKR 1000
7. Click "Submit Payment"
8. Verify:
   - Invoice status remains "Partially Paid"
   - Payment Tracking table shows 2 payment records:
     - Row 1: CHQ001, LKR 2,000.00, Remaining: LKR 3,000.00
     - Row 2: CHQ002, LKR 1,000.00, Remaining: LKR 2,000.00
   - Running balance is calculated correctly

**Expected Result**: ✅ Multiple payments display as separate rows with correct running balance

---

### Test 3: Complete Payment (Remaining Balance)
**Objective**: Verify that final payment marks invoice as Paid and shows complete payment history

**Steps**:
1. Use the same invoice from Test 2 (BILL0014, now showing Partially Paid with LKR 2000 remaining)
2. Click "Mark as Paid" button again
3. Select "Partial Payment" mode
4. Enter payment amount: LKR 2000
5. Select payment method: "Cheque"
6. Enter cheque details:
   - Cheque Number: CHQ003
   - Cheque Date: Today's date
   - Cheque Amount: LKR 2000
7. Click "Submit Payment"
8. Verify:
   - Invoice status changes to "Paid"
   - Payment Tracking table still shows (not hidden)
   - Shows 3 payment records:
     - Row 1: CHQ001, LKR 2,000.00, Remaining: LKR 3,000.00
     - Row 2: CHQ002, LKR 1,000.00, Remaining: LKR 2,000.00
     - Row 3: CHQ003, LKR 2,000.00, Remaining: LKR 0.00
   - Total row shows: Total Paid: LKR 5,000.00, Remaining: LKR 0.00

**Expected Result**: ✅ Invoice marked as Paid with complete payment history visible

---

### Test 4: Payment Date Recording
**Objective**: Verify that payment dates are correctly recorded and displayed

**Steps**:
1. Create a new invoice
2. Mark as Paid with payment date (should be today's date automatically)
3. Refresh the page
4. Open the invoice details
5. Check Payment Tracking table
6. Verify:
   - Payment Date column shows the correct date
   - Date format is consistent (e.g., "Jan 15, 2025")
   - Date persists after page refresh

**Expected Result**: ✅ Payment dates are correctly recorded and displayed

---

### Test 5: Different Payment Methods
**Objective**: Verify that different payment methods are displayed correctly

**Steps**:
1. Create multiple test invoices
2. For each invoice, mark as paid with different methods:
   - Invoice 1: Cash
   - Invoice 2: Cheque
   - Invoice 3: Bank Transfer
3. Verify:
   - Payment Tracking table shows correct method badges:
     - Cash: 💵 Cash (green background)
     - Cheque: 📝 Cheque (yellow background)
     - Bank Transfer: 🏦 Bank Transfer (blue background)
   - Reference column shows:
     - Cash: "-"
     - Cheque: "CHQ: [cheque number]"
     - Bank Transfer: "[bank name]"

**Expected Result**: ✅ All payment methods display correctly with appropriate badges and references

---

### Test 6: No Runtime Errors
**Objective**: Verify that no runtime errors occur when rendering Payment Tracking table

**Steps**:
1. Open browser console (F12)
2. Navigate to Billing section
3. Load multiple invoices
4. Expand several invoices with payment history
5. Verify:
   - No errors in console
   - No "bill.paymentRecords.map is not a function" errors
   - Payment Tracking table renders smoothly

**Expected Result**: ✅ No runtime errors in console

---

### Test 7: Paid Invoice Payment History
**Objective**: Verify that fully paid invoices show complete payment history

**Steps**:
1. Find a fully paid invoice (status = "Paid")
2. Expand the invoice details
3. Verify:
   - Payment Tracking table is visible (not hidden)
   - Shows all payment records for this invoice
   - If only one payment: shows single payment record
   - If multiple payments: shows all payments with running balance

**Expected Result**: ✅ Paid invoices display complete payment history

---

### Test 8: Responsive Design
**Objective**: Verify that Payment Tracking table is responsive on mobile devices

**Steps**:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)
4. Navigate to Billing section
5. Expand an invoice with payment history
6. Verify:
   - Payment Tracking table is readable on mobile
   - Columns are properly stacked
   - No horizontal scrolling needed
   - All information is visible

**Expected Result**: ✅ Payment Tracking table is responsive and mobile-friendly

---

## Database Verification

### Check Payment Records in Database
```sql
-- View all payment records for a specific bill
SELECT * FROM Payments WHERE BillId = 'BILL0014' ORDER BY PaymentDate ASC;

-- Expected columns:
-- PaymentId, JobId, CustomerId, CustomerName, InvoiceNumber, BillId,
-- PaymentMethod, PaymentDate, Amount, Status,
-- ChequeNumber, ChequeDate, ChequeAmount, BankName, ReferenceNumber,
-- Notes, CreatedBy, CreatedDate, UpdatedDate
```

### Verify Payment Date is Recorded
```sql
-- Check if payment dates are being recorded correctly
SELECT 
  PaymentId,
  BillId,
  PaymentDate,
  Amount,
  PaymentMethod,
  ChequeNumber
FROM Payments 
WHERE BillId = 'BILL0014'
ORDER BY PaymentDate ASC;
```

---

## Troubleshooting

### Issue: Payment Tracking table not showing
**Solution**:
1. Verify invoice status is "Partially Paid" or "Paid"
2. Check browser console for errors
3. Refresh the page
4. Check if payment records exist in database

### Issue: Payment date showing as wrong date
**Solution**:
1. Check the payment date being sent from frontend
2. Verify timezone settings
3. Check database for correct date value
4. Ensure `paidDate` is being passed in payment details

### Issue: Running balance calculation incorrect
**Solution**:
1. Verify all payment amounts are correct in database
2. Check that payments are ordered by PaymentDate ASC
3. Verify invoice netTotal is correct
4. Check the running balance calculation logic

### Issue: Multiple payments showing as overlapped
**Solution**:
1. Verify each payment has unique PaymentId
2. Check that payments are being created as separate records
3. Verify payment amounts are correct
4. Check database for duplicate records

---

## Success Criteria

All tests should pass with the following criteria:

✅ Payment records are created in the Payments table
✅ Payment date is correctly recorded for each payment
✅ Payment Tracking table displays all payment records
✅ Running balance calculation is correct
✅ No runtime errors when rendering Payment Tracking table
✅ Payment Tracking table shows for both Partially Paid and Paid invoices
✅ Multiple payments for the same invoice display as separate rows
✅ Payment date is visible and correct in the Payment Tracking table
✅ Different payment methods display with correct badges
✅ Responsive design works on mobile devices

---

## Notes

- Payment records are created only for Cheque and Bank Transfer payments
- Cash payments are recorded directly on the bill without creating a separate payment record
- Payment Tracking table shows all payment records for an invoice, regardless of payment method
- Running balance is calculated from the invoice's netTotal minus cumulative payments
- Payment dates are stored in ISO format in the database but displayed in user-friendly format (e.g., "Jan 15, 2025")
