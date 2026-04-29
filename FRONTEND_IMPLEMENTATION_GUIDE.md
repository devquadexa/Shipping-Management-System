# Frontend Implementation Guide - Partial Payment UI

## Overview
This guide provides step-by-step instructions to implement the partial payment UI enhancements for the Super Shine Cargo Management System.

## Prerequisites
- Backend partial payment functionality is complete ✅
- Job status management is implemented ✅
- Payment tracking system is operational ✅

## Implementation Steps

### Step 1: Update Payment Modal State (5 minutes)

**File**: `frontend/src/components/Billing.js`

**Location**: Around line 162 (where payment modal states are defined)

**Add these new state variables**:
```javascript
const [paymentMode, setPaymentMode] = useState('full'); // 'full' | 'partial'
const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
```

**Update the openPaymentModal function** (around line 997):
```javascript
const openPaymentModal = (billId) => {
  const bill = bills.find(b => b.billId === billId);
  setSelectedBillForPayment(bill);
  setShowPaymentModal(true);
  setPaymentMethod('Cash');
  setChequeNumber('');
  setChequeDate('');
  setChequeAmount('');
  setBankName('Commercial Bank');
  setChequeAutoFilled(false);
  setChequeAutoFillData(null);
  setChequeType('new');
  setExistingCheques([]);
  setPaymentMode('full'); // Add this line
  setPartialPaymentAmount(''); // Add this line
};
```

---

### Step 2: Add Payment Mode Selector to Modal (15 minutes)

**File**: `frontend/src/components/Billing.js`

**Location**: Around line 2460 (inside payment modal body, after invoice summary)

**Add this code after the "Payment Method" section**:

```javascript
{/* Payment Mode Selection */}
<div className="payment-modal-section-title">Payment Mode</div>
<div className="payment-mode-selector">
  <label className={`mode-option ${paymentMode === 'full' ? 'selected' : ''}`}>
    <input 
      type="radio" 
      name="paymentMode" 
      value="full" 
      checked={paymentMode === 'full'} 
      onChange={() => {
        setPaymentMode('full');
        setPartialPaymentAmount('');
      }} 
    />
    <span className="mode-label">Full Payment</span>
    <span className="mode-amount">
      LKR {formatAmount(
        parseFloat(selectedBillForPayment.remainingAmount) || 
        parseFloat(selectedBillForPayment.netTotal) || 
        parseFloat(selectedBillForPayment.total) || 
        0
      )}
    </span>
  </label>
  <label className={`mode-option ${paymentMode === 'partial' ? 'selected' : ''}`}>
    <input 
      type="radio" 
      name="paymentMode" 
      value="partial" 
      checked={paymentMode === 'partial'} 
      onChange={() => setPaymentMode('partial')} 
    />
    <span className="mode-label">Partial Payment</span>
    <span className="mode-description">Pay any amount</span>
  </label>
</div>

{/* Partial Payment Amount Input */}
{paymentMode === 'partial' && (
  <div className="form-group">
    <label>Payment Amount (LKR) <span style={{color:'#dc2626'}}>*</span></label>
    <input
      type="number"
      step="0.01"
      className="form-control"
      value={partialPaymentAmount}
      onChange={(e) => setPartialPaymentAmount(e.target.value)}
      placeholder="0.00"
      autoFocus
    />
    <div className="payment-calculation">
      <div className="calc-row">
        <span className="calc-label">Invoice Total:</span>
        <span className="calc-value">
          LKR {formatAmount(
            parseFloat(selectedBillForPayment.netTotal) || 
            parseFloat(selectedBillForPayment.total) || 
            0
          )}
        </span>
      </div>
      {parseFloat(selectedBillForPayment.paidAmount) > 0 && (
        <div className="calc-row">
          <span className="calc-label">Already Paid:</span>
          <span className="calc-value paid">
            LKR {formatAmount(parseFloat(selectedBillForPayment.paidAmount))}
          </span>
        </div>
      )}
      <div className="calc-row">
        <span className="calc-label">This Payment:</span>
        <span className="calc-value current">
          LKR {formatAmount(parseFloat(partialPaymentAmount) || 0)}
        </span>
      </div>
      <div className="calc-row total">
        <span className="calc-label">Remaining After:</span>
        <span className="calc-value">
          LKR {formatAmount(
            Math.max(0, 
              (parseFloat(selectedBillForPayment.remainingAmount) || 
               parseFloat(selectedBillForPayment.netTotal) || 
               parseFloat(selectedBillForPayment.total) || 
               0) - (parseFloat(partialPaymentAmount) || 0)
            )
          )}
        </span>
      </div>
    </div>
  </div>
)}
```

---

### Step 3: Update submitPayment Function (10 minutes)

**File**: `frontend/src/components/Billing.js`

**Location**: Around line 1090 (the submitPayment function)

**Replace the entire submitPayment function with**:

```javascript
const submitPayment = async () => {
  if (!selectedBillForPayment) return;
  
  // Validate partial payment amount
  if (paymentMode === 'partial') {
    const amount = parseFloat(partialPaymentAmount);
    const remaining = parseFloat(selectedBillForPayment.remainingAmount) || 
                     parseFloat(selectedBillForPayment.netTotal) || 
                     parseFloat(selectedBillForPayment.total) || 
                     0;
    
    if (!amount || amount <= 0) {
      setMessage('❌ Please enter a valid payment amount');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    if (amount > remaining + 0.01) { // 0.01 tolerance for floating point
      setMessage(`❌ Payment amount (LKR ${formatAmount(amount)}) exceeds remaining balance (LKR ${formatAmount(remaining)})`);
      setTimeout(() => setMessage(''), 5000);
      return;
    }
  }
  
  // Validate payment method details
  if (paymentMethod === 'Cheque') {
    if (!chequeNumber || !chequeDate || !chequeAmount) {
      setMessage('❌ Please fill in all cheque details (Number, Date, Amount)');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    const amount = parseFloat(chequeAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('❌ Please enter a valid cheque amount');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
  }
  
  if (paymentMethod === 'Bank Transfer') {
    if (!bankName) {
      setMessage('❌ Please select a bank');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
  }
  
  try {
    const paymentDetails = {
      paymentMethod,
      ...(paymentMethod === 'Cheque' && {
        chequeNumber,
        chequeDate,
        chequeAmount: parseFloat(chequeAmount)
      }),
      ...(paymentMethod === 'Bank Transfer' && {
        bankName
      })
    };
    
    if (paymentMode === 'partial') {
      // Call partial payment endpoint
      await apiClient.patch(`/api/bills/${selectedBillForPayment.billId}/partial-pay`, {
        paymentAmount: parseFloat(partialPaymentAmount),
        ...paymentDetails
      });
      
      const newStatus = (parseFloat(selectedBillForPayment.remainingAmount || selectedBillForPayment.netTotal) - parseFloat(partialPaymentAmount)) <= 0.01 
        ? 'Paid' 
        : 'Partially Paid';
      
      setMessage(`✅ Partial payment of LKR ${formatAmount(partialPaymentAmount)} recorded successfully. Invoice status: ${newStatus}`);
    } else {
      // Call full payment endpoint
      await billingService.markAsPaid(selectedBillForPayment.billId, paymentDetails);
      setMessage(`✅ Invoice ${selectedBillForPayment.invoiceNumber || selectedBillForPayment.billId} marked as paid via ${paymentMethod}`);
    }
    
    setShowPaymentModal(false);
    setSelectedBillForPayment(null);
    fetchBills();
    setTimeout(() => setMessage(''), 5000);
  } catch (error) {
    console.error('Error processing payment:', error);
    setMessage(`❌ Error: ${error.response?.data?.message || error.message}`);
    setTimeout(() => setMessage(''), 5000);
  }
};
```

---

### Step 4: Enhance Billing Table Display (20 minutes)

**File**: `frontend/src/components/Billing.js`

**Location**: Around line 2300 (in the billing table where status and actions are displayed)

**Update the Status Column**:
```javascript
<td>
  <div className="status-cell">
    <span className={`status-badge status-${(bill.paymentStatus || 'unpaid').toLowerCase().replace(' ', '-')}`}>
      {bill.paymentStatus || 'Unpaid'}
    </span>
    {bill.paymentStatus === 'Partially Paid' && (
      <div className="payment-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{
              width: `${Math.min(100, (parseFloat(bill.paidAmount) / parseFloat(bill.netTotal || bill.total)) * 100)}%`
            }}
          ></div>
        </div>
        <div className="progress-text">
          Paid: LKR {formatAmount(bill.paidAmount)} of {formatAmount(bill.netTotal || bill.total)}
        </div>
      </div>
    )}
  </div>
</td>
```

**Update the Actions Column**:
```javascript
<td>
  <div className="action-buttons">
    {(bill.paymentStatus === 'Unpaid' || bill.paymentStatus === 'Partially Paid') && (
      <>
        <button 
          onClick={() => openPaymentModal(bill.billId)} 
          className={`btn ${bill.paymentStatus === 'Partially Paid' ? 'btn-primary' : 'btn-success'} btn-small`}
        >
          {bill.paymentStatus === 'Partially Paid' ? 'Pay Remaining' : 'Pay Invoice'}
        </button>
        {bill.paymentStatus === 'Partially Paid' && (
          <div className="remaining-badge">
            LKR {formatAmount(bill.remainingAmount)} remaining
          </div>
        )}
      </>
    )}
    {bill.paymentStatus === 'Paid' && (
      <span className="paid-indicator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Paid
      </span>
    )}
    <button onClick={() => printBill(bill)} className="btn btn-secondary btn-small">
      Print
    </button>
  </div>
</td>
```

---

### Step 5: Add CSS Styles (15 minutes)

**File**: `frontend/src/styles/Billing.css`

**Location**: Add at the end of the file (before the closing brace if any)

```css
/* ========================================
   PARTIAL PAYMENT STYLES
   ======================================== */

/* Payment Mode Selector */
.payment-mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
}

.mode-option {
  padding: 1.25rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  background: white;
}

.mode-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mode-option.selected {
  border-color: #101036;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  box-shadow: 0 4px 12px rgba(16, 16, 54, 0.15);
}

.mode-option:hover {
  border-color: #101036;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mode-label {
  font-weight: 600;
  color: #101036;
  font-size: 1rem;
}

.mode-amount {
  font-weight: 700;
  color: #059669;
  font-size: 1.3rem;
  margin-top: 0.25rem;
}

.mode-description {
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
}

/* Payment Calculation Box */
.payment-calculation {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.calc-row:last-child {
  border-bottom: none;
}

.calc-row.total {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid #101036;
  font-weight: 700;
}

.calc-label {
  color: #6b7280;
  font-size: 0.95rem;
}

.calc-value {
  color: #101036;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.calc-value.paid {
  color: #059669;
}

.calc-value.current {
  color: #f59e0b;
}

/* Payment Progress Bar */
.payment-progress {
  margin-top: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.progress-text {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.5rem;
  font-weight: 500;
}

/* Status Badge - Partially Paid */
.status-partially-paid {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #fbbf24;
  font-weight: 600;
}

/* Remaining Badge */
.remaining-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid #fbbf24;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.2);
}

/* Paid Indicator */
.paid-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid #6ee7b7;
}

.paid-indicator svg {
  color: #059669;
}

/* Status Cell */
.status-cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Payment Modal Enhancements */
.payment-modal {
  max-width: 950px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.payment-modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  padding: 2rem;
}

.payment-modal-left,
.payment-modal-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payment-modal-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #101036;
  margin-bottom: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.invoice-summary {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total-row {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid #101036;
  font-weight: 700;
  background: white;
  margin-left: -1.5rem;
  margin-right: -1.5rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  border-radius: 0 0 8px 8px;
}

.summary-label {
  color: #6b7280;
  font-size: 0.95rem;
}

.summary-value {
  color: #101036;
  font-weight: 600;
}

.amount-highlight {
  color: #059669;
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

/* Responsive Design */
@media (max-width: 768px) {
  .payment-modal-body {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .payment-mode-selector {
    grid-template-columns: 1fr;
  }
  
  .mode-option {
    padding: 1rem;
  }
  
  .mode-amount {
    font-size: 1.1rem;
  }
  
  .payment-modal {
    max-width: 100%;
    width: 100%;
    margin: 0;
    border-radius: 0;
  }
}

/* Animation for progress bar */
@keyframes fillProgress {
  from {
    width: 0;
  }
}

.progress-fill {
  animation: fillProgress 0.5s ease-out;
}
```

---

### Step 6: Test the Implementation (30 minutes)

#### Test Scenario 1: Partial Payment with Cash
1. Open an unpaid invoice
2. Click "Pay Invoice"
3. Select "Partial Payment" mode
4. Enter amount (e.g., 50,000)
5. Select "Cash" as payment method
6. Click "Confirm Payment"
7. Verify:
   - Invoice status changes to "Partially Paid"
   - Progress bar shows correct percentage
   - Remaining amount displays correctly
   - Job status updates to "Partially Paid"

#### Test Scenario 2: Complete Partial Payment
1. Open the partially paid invoice from Test 1
2. Click "Pay Remaining"
3. Select "Full Payment" mode (should show remaining amount)
4. Select payment method
5. Click "Confirm Payment"
6. Verify:
   - Invoice status changes to "Paid"
   - Job status updates to "Payment Collected"
   - Paid indicator shows checkmark

#### Test Scenario 3: Partial Payment with Cheque
1. Open an unpaid invoice
2. Click "Pay Invoice"
3. Select "Partial Payment" mode
4. Enter partial amount
5. Select "Cheque" as payment method
6. Enter cheque details
7. Click "Confirm Payment"
8. Verify:
   - Payment record created in Payment Management
   - Cheque status is "Pending"
   - Invoice shows partial payment

#### Test Scenario 4: Multiple Partial Payments
1. Create invoice for LKR 150,000
2. Apply partial payment: LKR 50,000 (Cash)
3. Apply partial payment: LKR 30,000 (Cheque)
4. Apply final payment: LKR 70,000 (Bank Transfer)
5. Verify:
   - All payments recorded
   - Invoice fully paid
   - Job status is "Payment Collected"

#### Test Scenario 5: Validation
1. Try to pay more than remaining amount
2. Try to submit without entering amount
3. Try to submit cheque without details
4. Verify all validation messages display correctly

---

### Step 7: Verify Job Status Updates (10 minutes)

1. Check Jobs page after partial payment
2. Verify job status shows "Partially Paid"
3. Complete the payment
4. Verify job status changes to "Payment Collected"
5. Check job history/audit trail

---

## Troubleshooting

### Issue: Payment modal doesn't show partial payment option
**Solution**: Check that `paymentMode` state is properly initialized and the radio buttons are rendering

### Issue: Partial payment amount validation not working
**Solution**: Verify `remainingAmount` field exists in bill object and is properly calculated

### Issue: Progress bar not displaying
**Solution**: Check CSS is properly loaded and `paidAmount` / `netTotal` values are numbers

### Issue: Job status not updating
**Solution**: Verify backend changes are deployed and jobRepository is injected into use cases

### Issue: Payment calculation shows NaN
**Solution**: Ensure all amount fields are parsed as floats with fallback to 0

---

## Completion Checklist

- [ ] Step 1: State variables added
- [ ] Step 2: Payment mode selector added to modal
- [ ] Step 3: submitPayment function updated
- [ ] Step 4: Billing table display enhanced
- [ ] Step 5: CSS styles added
- [ ] Step 6: All test scenarios passed
- [ ] Step 7: Job status updates verified
- [ ] Code reviewed and tested
- [ ] Documentation updated
- [ ] Ready for production deployment

---

## Estimated Time: 2-3 hours

**Breakdown**:
- Implementation: 1.5 hours
- Testing: 1 hour
- Bug fixes & refinement: 0.5 hours

---

## Support

If you encounter any issues during implementation:
1. Check browser console for errors
2. Verify API endpoints are responding correctly
3. Review backend logs for errors
4. Test with small amounts first
5. Contact development team if needed

---

**Good luck with the implementation! 🚀**
