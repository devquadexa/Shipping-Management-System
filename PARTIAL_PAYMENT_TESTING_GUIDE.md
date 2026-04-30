# Partial Payment Testing Guide

## ✅ Implementation Complete!

The partial payment functionality is now **fully implemented** in the frontend. Here's how to test it:

## 🧪 Testing Steps

### Test 1: Partial Payment with Cash

1. **Navigate to Billing/Invoicing page**
2. **Find an unpaid invoice** in the table
3. **Click "Pay Invoice"** button
4. **In the payment modal, you should see**:
   - Invoice details on the left
   - Payment Method dropdown
   - **NEW: Payment Mode selector** with two options:
     - ✅ Full Payment (shows total amount)
     - ⭕ Partial Payment
5. **Select "Partial Payment"** radio button
6. **Enter a partial amount** (e.g., if invoice is LKR 100,000, enter 40,000)
7. **You should see a calculation box** showing:
   - Invoice Total
   - This Payment
   - Remaining After
8. **Select "Cash"** as payment method
9. **Click "Confirm Payment"**
10. **Verify**:
    - Success message appears
    - Invoice status changes to "Partially Paid"
    - Progress bar appears showing payment progress
    - "Paid: LKR 40,000 of 100,000" displays
    - Button changes to "Pay Remaining"
    - Remaining badge shows "LKR 60,000 remaining"

### Test 2: Complete the Partial Payment

1. **Click "Pay Remaining"** on the partially paid invoice
2. **Payment modal opens** with:
   - Full Payment mode selected by default
   - Amount shows remaining balance (LKR 60,000)
3. **Select payment method** (Cash/Cheque/Bank Transfer)
4. **Click "Confirm Payment"**
5. **Verify**:
   - Invoice status changes to "Paid"
   - Green checkmark appears
   - "Paid" indicator shows
   - Progress bar shows 100%

### Test 3: Multiple Partial Payments

1. **Create a new invoice** for LKR 150,000
2. **Apply 1st partial payment**: LKR 50,000 (Cash)
   - Status: Partially Paid
   - Progress: 33%
3. **Apply 2nd partial payment**: LKR 30,000 (Cheque)
   - Status: Still Partially Paid
   - Progress: 53%
4. **Apply 3rd partial payment**: LKR 70,000 (Bank Transfer)
   - Status: Paid
   - Progress: 100%

### Test 4: Partial Payment with Cheque

1. **Open unpaid invoice**
2. **Click "Pay Invoice"**
3. **Select "Partial Payment"**
4. **Enter partial amount**
5. **Select "Cheque"** as payment method
6. **Fill in cheque details**:
   - Cheque Number
   - Cheque Date
   - Total Cheque Amount
7. **Click "Confirm Payment"**
8. **Verify**:
   - Payment recorded
   - Invoice partially paid
   - Payment record created in Payment Management

### Test 5: Validation Tests

**Test overpayment prevention:**
1. Open partially paid invoice (e.g., LKR 60,000 remaining)
2. Select Partial Payment
3. Try to enter LKR 70,000
4. Click Confirm
5. **Should show error**: "Payment amount exceeds remaining balance"

**Test empty amount:**
1. Select Partial Payment
2. Leave amount empty
3. Click Confirm
4. **Should show error**: "Please enter a valid payment amount"

**Test cheque validation:**
1. Select Partial Payment
2. Enter amount
3. Select Cheque
4. Leave cheque details empty
5. Click Confirm
6. **Should show error**: "Please fill in all cheque details"

### Test 6: Job Status Updates

1. **Create invoice** → Job status: "Pending Payment"
2. **Apply partial payment** → Job status: "Partially Paid"
3. **Complete payment** → Job status: "Payment Collected"
4. **Verify in Jobs page** that status updates correctly

## 🎨 Visual Features to Verify

### Payment Modal
- ✅ Two-column layout (Invoice Details | Payment Details)
- ✅ Payment Mode selector with radio buttons
- ✅ Full Payment shows total amount in green
- ✅ Partial Payment shows "Pay any amount"
- ✅ Calculation box with breakdown
- ✅ Professional gradient header
- ✅ Smooth animations

### Billing Table
- ✅ Status badges color-coded:
  - Red: Unpaid
  - Orange/Amber: Partially Paid
  - Green: Paid
- ✅ Progress bar for partially paid invoices
- ✅ "Paid: X of Y" text below progress bar
- ✅ "Pay Remaining" button for partial payments
- ✅ "LKR X remaining" badge
- ✅ Green checkmark for paid invoices

### Responsive Design
- ✅ Test on desktop (full width)
- ✅ Test on tablet (stacked columns)
- ✅ Test on mobile (single column)

## 📊 Expected Behavior

### Invoice Status Flow
```
Unpaid → Partially Paid → Paid
```

### Job Status Flow
```
Pending Payment → Partially Paid → Payment Collected
```

### Payment Progress
```
0% → 40% → 80% → 100%
```

## 🐛 Troubleshooting

### Issue: Can't see Payment Mode selector
**Solution**: Clear browser cache and refresh page

### Issue: Calculation not updating
**Solution**: Check that you're entering valid numbers

### Issue: Error on submit
**Solution**: Check browser console for detailed error message

### Issue: Status not updating
**Solution**: Refresh the page to see updated status

## ✅ Success Criteria

- [ ] Payment Mode selector displays correctly
- [ ] Partial payment amount input works
- [ ] Calculation box shows correct values
- [ ] Validation prevents overpayment
- [ ] Invoice status updates to "Partially Paid"
- [ ] Progress bar displays correctly
- [ ] Multiple partial payments work
- [ ] Final payment marks invoice as "Paid"
- [ ] Job status updates automatically
- [ ] All payment methods work (Cash/Cheque/Bank)
- [ ] Responsive design works on mobile
- [ ] No console errors

## 📸 Screenshots to Take

1. Payment modal with Full Payment selected
2. Payment modal with Partial Payment selected
3. Calculation box showing breakdown
4. Billing table with partially paid invoice
5. Progress bar showing payment progress
6. Paid invoice with checkmark

## 🎉 What's New

### For Users:
- **Flexible Payments**: Can now pay invoices in installments
- **Clear Progress**: Visual progress bar shows payment status
- **Easy Tracking**: See exactly how much is paid and remaining
- **Professional UI**: Modern, clean interface

### For Business:
- **Better Cash Flow**: Accept partial payments
- **Automatic Tracking**: No manual status updates
- **Complete Audit**: All payments recorded
- **Customer Flexibility**: Offer payment plans

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify backend is running
3. Test with small amounts first
4. Contact development team

---

**Status**: ✅ Fully Implemented and Ready to Test

**Last Updated**: April 28, 2026

**Implementation Time**: Complete

---

## Quick Test Checklist

- [ ] Open payment modal
- [ ] See Payment Mode selector
- [ ] Select Partial Payment
- [ ] Enter amount
- [ ] See calculation box
- [ ] Submit payment
- [ ] Verify status changes
- [ ] See progress bar
- [ ] Complete remaining payment
- [ ] Verify fully paid status

**Happy Testing! 🚀**
