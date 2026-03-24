# Payment Flow Visual Guide

## User Journey: Marking an Invoice as Paid

### Step 1: View Unpaid Invoices
```
┌─────────────────────────────────────────────────────────────┐
│ Billing - Invoice Management                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Invoice List:                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ INV-001 │ JOB0015 │ ABC Corp │ Unpaid │ [Mark Paid] │   │
│ │ INV-002 │ JOB0016 │ XYZ Ltd  │ Unpaid │ [Mark Paid] │   │
│ │ INV-003 │ JOB0017 │ DEF Inc  │ Paid   │             │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   User clicks [Mark Paid]
```

### Step 2: Payment Modal Opens
```
┌─────────────────────────────────────────────────────────────┐
│ 💳 Payment Details                                      [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Invoice Summary                                        │ │
│ │ ─────────────────────────────────────────────────────  │ │
│ │ Invoice Number:  INV-001                               │ │
│ │ Customer:        ABC Corporation                       │ │
│ │ Job ID:          JOB0015                               │ │
│ │ Amount to Pay:   LKR 150,000.00                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Payment Method: *                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Cash                                                ▼  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                    [Cancel] [✓ Confirm]     │
└─────────────────────────────────────────────────────────────┘
```

### Step 3A: Cash Payment (Simple)
```
┌─────────────────────────────────────────────────────────────┐
│ 💳 Payment Details                                      [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Invoice Summary - same as above]                           │
│                                                              │
│ Payment Method: *                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Cash                                                ▼  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ✓ No additional information required for cash payments     │
│                                                              │
│                                    [Cancel] [✓ Confirm]     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Click [✓ Confirm]
                            ↓
                   ✅ Invoice marked as paid!
```

### Step 3B: Cheque Payment (Detailed)
```
┌─────────────────────────────────────────────────────────────┐
│ 💳 Payment Details                                      [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Invoice Summary - same as above]                           │
│                                                              │
│ Payment Method: *                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Cheque                                              ▼  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 📝 Please provide cheque details                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Cheque Number: *                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ CHQ123456                                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Cheque Date: *                                               │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 2026-03-25                                          📅 │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Cheque Amount (LKR): *                                       │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 150000.00                                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                    [Cancel] [✓ Confirm]     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Click [✓ Confirm]
                            ↓
              Validates: Number, Date, Amount filled?
                            ↓
                          YES
                            ↓
         ✅ Invoice marked as paid via Cheque!
         Cheque details saved to database
```

### Step 3C: Bank Transfer
```
┌─────────────────────────────────────────────────────────────┐
│ 💳 Payment Details                                      [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Invoice Summary - same as above]                           │
│                                                              │
│ Payment Method: *                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Bank Transfer                                       ▼  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🏦 Please select the bank                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Bank Name: *                                                 │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Commercial Bank                                     ▼  │ │
│ │ ─────────────────────────────────────────────────────  │ │
│ │ • Commercial Bank                                      │ │
│ │ • Peoples Bank                                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                    [Cancel] [✓ Confirm]     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Click [✓ Confirm]
                            ↓
                Validates: Bank selected?
                            ↓
                          YES
                            ↓
      ✅ Invoice marked as paid via Bank Transfer!
      Bank name saved to database
```

### Step 4: Success & Updated List
```
┌─────────────────────────────────────────────────────────────┐
│ Billing - Invoice Management                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ✅ Invoice INV-001 marked as paid via Cheque               │
│                                                              │
│ Invoice List:                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ INV-001 │ JOB0015 │ ABC Corp │ Paid   │             │   │
│ │ INV-002 │ JOB0016 │ XYZ Ltd  │ Unpaid │ [Mark Paid] │   │
│ │ INV-003 │ JOB0017 │ DEF Inc  │ Paid   │             │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Validation Flow

### Frontend Validation
```
User clicks [✓ Confirm]
        ↓
Is payment method selected?
        ↓ NO → Show error: "Please select payment method"
        ↓ YES
        ↓
Is payment method = Cheque?
        ↓ YES
        ↓
Are cheque number, date, amount filled?
        ↓ NO → Show error: "Please fill all cheque details"
        ↓ YES
        ↓
Is cheque amount > 0?
        ↓ NO → Show error: "Please enter valid amount"
        ↓ YES
        ↓
Is payment method = Bank Transfer?
        ↓ YES
        ↓
Is bank name selected?
        ↓ NO → Show error: "Please select a bank"
        ↓ YES
        ↓
Send to backend API
```

### Backend Validation
```
Receive payment request
        ↓
Find bill in database
        ↓ NOT FOUND → Return error: "Bill not found"
        ↓ FOUND
        ↓
Is bill already paid?
        ↓ YES → Return error: "Bill already paid"
        ↓ NO
        ↓
Validate payment details
        ↓
Update bill status to "Paid"
        ↓
Save payment details
        ↓
Return success response
```

## Database Storage

### Bills Table After Payment
```sql
BillId: BILL0001
InvoiceNumber: INV-001
PaymentStatus: Paid
paidDate: 2026-03-25 10:30:00

-- Payment Details (based on method)
paymentMethod: Cheque
chequeNumber: CHQ123456
chequeDate: 2026-03-25
chequeAmount: 150000.00
bankName: NULL

-- OR for Bank Transfer:
paymentMethod: Bank Transfer
chequeNumber: NULL
chequeDate: NULL
chequeAmount: NULL
bankName: Commercial Bank
```

## Access Control

### Who Can Mark Invoices as Paid?
```
┌─────────────────────────────────────────┐
│ Role              │ Can Mark as Paid?   │
├─────────────────────────────────────────┤
│ Super Admin       │ ✅ YES              │
│ Admin             │ ✅ YES              │
│ Manager           │ ✅ YES              │
│ User              │ ❌ NO               │
│ Driver            │ ❌ NO               │
└─────────────────────────────────────────┘
```

## Mobile Responsive Design

### Desktop View
```
┌────────────────────────────────────────────┐
│ Wide modal with side-by-side layout       │
│ ┌────────────────────────────────────────┐│
│ │ Summary │ Form fields in columns      ││
│ └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────┐
│ Full-width modal │
│ ┌──────────────┐ │
│ │ Summary      │ │
│ │ (stacked)    │ │
│ ├──────────────┤ │
│ │ Form fields  │ │
│ │ (full width) │ │
│ ├──────────────┤ │
│ │ Buttons      │ │
│ │ (stacked)    │ │
│ └──────────────┘ │
└──────────────────┘
```

## Error Scenarios

### Scenario 1: Missing Cheque Details
```
User selects Cheque → Leaves fields empty → Clicks Confirm
        ↓
❌ Please fill in all cheque details (Number, Date, Amount)
```

### Scenario 2: Invalid Amount
```
User enters negative or zero amount → Clicks Confirm
        ↓
❌ Please enter a valid cheque amount
```

### Scenario 3: No Bank Selected
```
User selects Bank Transfer → Doesn't select bank → Clicks Confirm
        ↓
❌ Please select a bank
```

### Scenario 4: Network Error
```
User submits payment → Network fails
        ↓
❌ Error: Unable to connect to server
```

## Success Indicators

✅ Modal opens smoothly with animation
✅ Invoice summary displays correctly
✅ Payment method dropdown works
✅ Conditional fields show/hide properly
✅ Validation messages are clear
✅ Success message appears
✅ Invoice status updates immediately
✅ Modal closes automatically
✅ Payment details saved to database

---

**This visual guide helps users and developers understand the complete payment flow from start to finish.**
