# Payment Management - User Guide

## Overview

The Payment Management feature helps you track and manage cheque and bank transfer payments received from customers. This guide will show you how to use this new feature.

## Who Can Access?

Only the following roles can access Payment Management:
- **Super Admin** ✅
- **Admin** ✅
- **Manager** ✅
- Waff Clerk ❌ (No access)

## How to Access

1. Login to the system
2. Click on the **Accounting** tab in the main navigation
3. Click on the **Payment Management** tab

![Payment Management Location](https://via.placeholder.com/800x200?text=Accounting+%3E+Payment+Management)

## Recording Payments

### When Marking an Invoice as Paid

1. Go to **Billing/Invoicing** page
2. Find the invoice you want to mark as paid
3. Click the **Mark Paid** button
4. A payment details modal will appear

### For Cheque Payments:

1. Select **Cheque** as payment method
2. Fill in the required details:
   - **Cheque Number**: Enter the cheque number (e.g., 123456)
   - **Cheque Date**: Select the date on the cheque
   - **Cheque Amount**: Enter the cheque amount in LKR
3. Click **Confirm Payment**

**Example**:
```
Payment Method: Cheque
Cheque Number: 456789
Cheque Date: 22/04/2026
Cheque Amount: 50,000.00
```

### For Bank Transfer Payments:

1. Select **Bank Transfer** as payment method
2. Select the **Bank Name** from dropdown:
   - Commercial Bank
   - Peoples Bank
3. Click **Confirm Payment**

### For Cash Payments:

1. Select **Cash** as payment method
2. Click **Confirm Payment**

**Note**: Cash payments are NOT tracked in Payment Management (only Cheque and Bank Transfer)

## Viewing Payments

### Dashboard Overview

When you open Payment Management, you'll see:

#### Summary Cards (Top Section):
- **Total Cheques**: Total amount of all cheque payments
  - Shows cleared and pending amounts
- **Bank Transfers**: Total amount of bank transfer payments
- **Total Cleared**: Total amount of cleared payments (available funds)
- **Bounced Cheques**: Total amount of bounced cheques (if any)

#### Payment Tabs:
- **Cheques**: View only cheque payments
- **Bank Transfers**: View only bank transfer payments
- **All Payments**: View all payment types

### Payment List

Each payment shows:
- **Date**: Payment date
- **Payment Method**: Cheque or Bank Transfer
- **Cheque Number / Bank Name**: Identifier
- **Customer**: Customer name
- **Job ID**: Related job
- **Amount**: Payment amount in LKR
- **Status**: Pending / Cleared / Bounced
- **Actions**: View, Clear, Bounce buttons

## Managing Payment Status

### Marking a Cheque as Cleared

When a cheque has been successfully cleared by the bank:

1. Find the payment in the list
2. Click the **Clear** button
3. The status will change to **Cleared**
4. The cleared date will be recorded

### Marking a Cheque as Bounced

If a cheque bounces:

1. Find the payment in the list
2. Click the **Bounce** button
3. The status will change to **Bounced**
4. The bounced date will be recorded
5. The payment will appear in the "Bounced Cheques" summary card

## Searching and Filtering

### Search:
Use the search box to find payments by:
- Cheque number
- Bank name
- Job ID
- Customer name

**Example**: Type "123456" to find cheque number 123456

### Filter by Status:
Use the status dropdown to filter:
- **All Status**: Show all payments
- **Pending**: Show only pending payments
- **Cleared**: Show only cleared payments
- **Bounced**: Show only bounced payments

### Filter by Payment Method:
Click the tabs to filter:
- **Cheques**: Show only cheque payments
- **Bank Transfers**: Show only bank transfer payments
- **All Payments**: Show all payment types

## Viewing Payment Details

To see full payment information:

1. Click the **View** button next to a payment
2. The row will expand to show:
   - Payment ID
   - Invoice Number
   - Payment Date
   - Cleared Date (if cleared)
   - Cheque Details (for cheques):
     - Cheque Number
     - Cheque Date
     - Bank Name
   - Bank Transfer Details (for transfers):
     - Bank Name
     - Reference Number
   - Job & Customer Information:
     - Job ID
     - Customer Name
     - Customer ID
   - Notes (if any)

3. Click **Hide** to collapse the details

## Pagination

At the bottom of the payment list:

- **Records per page**: Select 20, 50, or 100 records
- **Page navigation**: Use Previous/Next buttons or click page numbers
- **Record count**: Shows "X to Y of Z records"

## Common Workflows

### Workflow 1: Processing a Cheque Payment

1. **Day 1**: Customer pays by cheque
   - Mark invoice as paid
   - Enter cheque details
   - Status: **Pending**

2. **Day 2-7**: Cheque deposited at bank
   - Status remains: **Pending**

3. **Day 7-10**: Cheque clears
   - Go to Payment Management
   - Find the cheque
   - Click **Clear**
   - Status: **Cleared**

4. **If cheque bounces**:
   - Go to Payment Management
   - Find the cheque
   - Click **Bounce**
   - Status: **Bounced**
   - Contact customer for alternative payment

### Workflow 2: Processing a Bank Transfer

1. **Day 1**: Customer makes bank transfer
   - Mark invoice as paid
   - Select bank name
   - Status: **Pending**

2. **Day 1-3**: Verify transfer received
   - Check bank statement
   - Go to Payment Management
   - Find the transfer
   - Click **Clear**
   - Status: **Cleared**

## Tips and Best Practices

### ✅ Do's:
- ✅ Always enter correct cheque numbers
- ✅ Verify cheque dates match the actual cheque
- ✅ Mark cheques as cleared only after bank confirmation
- ✅ Use search to quickly find specific payments
- ✅ Check summary cards for quick overview
- ✅ Review pending payments regularly

### ❌ Don'ts:
- ❌ Don't mark a cheque as cleared before bank confirmation
- ❌ Don't forget to enter cheque amount
- ❌ Don't use Payment Management for cash payments
- ❌ Don't mark a payment as bounced without verification

## Understanding Payment Status

### 🟡 Pending
- Payment recorded but not yet confirmed
- Cheque deposited but not cleared
- Bank transfer initiated but not confirmed
- **Action Required**: Monitor and update when confirmed

### 🟢 Cleared
- Payment successfully received
- Funds available in account
- Cheque cleared by bank
- Bank transfer confirmed
- **No Action Required**: Payment complete

### 🔴 Bounced
- Cheque returned by bank
- Payment failed
- Funds not received
- **Action Required**: Contact customer for alternative payment

## Reporting

### Quick Reports from Summary Cards:

**Total Outstanding Cheques**:
- Look at "Total Cheques" card
- Subtract "Cleared" amount from total
- Result = Pending cheques

**Cash Flow Status**:
- Check "Total Cleared" card
- This shows available funds from payments

**Risk Assessment**:
- Check "Bounced Cheques" card
- Identify customers with bounced cheques
- Take appropriate action

## Troubleshooting

### Issue: Payment not showing in Payment Management

**Possible Reasons**:
1. Payment method was "Cash" (not tracked)
2. Invoice not marked as paid yet
3. Need to refresh page (Ctrl + R)

**Solution**: Verify payment method was Cheque or Bank Transfer

### Issue: Cannot mark payment as cleared

**Possible Reasons**:
1. Payment already cleared
2. Insufficient permissions
3. Network issue

**Solution**: Check payment status and your user role

### Issue: Wrong cheque number entered

**Solution**: Contact system administrator to correct the record

## Keyboard Shortcuts

- **Ctrl + R**: Refresh page
- **Ctrl + F**: Search in browser (can search payment list)
- **Tab**: Navigate between fields in payment modal
- **Enter**: Submit payment modal

## Mobile Access

Payment Management is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop computers

On mobile:
- Swipe to scroll payment list
- Tap to expand payment details
- Use dropdown for filters

## Security

- 🔒 All payment data is encrypted
- 🔒 Only authorized users can access
- 🔒 All actions are logged with user ID and timestamp
- 🔒 Cannot delete payment records (audit trail)

## Support

If you need help:

1. **Check this guide** for common questions
2. **Contact your system administrator**
3. **Report bugs** to the IT department

## Frequently Asked Questions (FAQ)

**Q: Why don't I see cash payments in Payment Management?**  
A: Cash payments are not tracked in this system. Only Cheque and Bank Transfer payments are recorded.

**Q: Can I edit a payment record?**  
A: You can only update the status (Clear/Bounce). Other details cannot be edited. Contact administrator if correction needed.

**Q: How long should I keep payments in "Pending" status?**  
A: Update to "Cleared" as soon as bank confirms. Typically 3-7 days for cheques, 1-3 days for bank transfers.

**Q: What if a customer pays with multiple cheques?**  
A: Each cheque will be recorded as a separate payment. You can see all payments for a customer using the search function.

**Q: Can I export payment data?**  
A: Currently not available. Contact administrator if you need payment reports.

**Q: What happens if I accidentally mark a cheque as bounced?**  
A: Contact system administrator to correct the status.

---

**Need More Help?**

Contact your system administrator or IT support team.

**System Version**: 2.0.0  
**Last Updated**: April 22, 2026
