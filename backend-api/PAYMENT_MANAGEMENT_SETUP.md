# Payment Management System Setup Guide

## Overview
The Payment Management system tracks cheque and bank transfer payments when invoices are marked as paid. This feature provides comprehensive tracking of payment status, cheque clearing, and bounced cheques.

## Database Setup

### Step 1: Create Payments Table
Run the SQL script to create the payments table and indexes:

```bash
# Connect to your SQL Server database and run:
sqlcmd -S cargo_db -U sa -P YourStrongPassword123! -d SuperShineCargoDb -i create-payments-table.sql
```

Or manually execute the SQL file `create-payments-table.sql` in your database.

### Step 2: Verify Table Creation
```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Payments';
```

## Features

### 1. Automatic Payment Recording
When an invoice is marked as paid with payment method "Cheque" or "Bank Transfer", a payment record is automatically created in the Payments table.

### 2. Payment Tracking
- **Cheque Payments**: Track cheque number, date, amount, bank name, and status
- **Bank Transfers**: Track bank name, reference number, and amount
- **Status Management**: Pending → Cleared or Bounced

### 3. Payment Management UI
Access via: **Accounting Tab → Payment Management**

Features:
- Summary cards showing total cheques, bank transfers, cleared amounts, and bounced cheques
- Filter by payment method (Cheques/Bank/All) and status (Pending/Cleared/Bounced)
- Search by cheque number, bank name, job ID, or customer
- Mark cheques as Cleared or Bounced
- View detailed payment information
- Professional pagination (20/50/100 records per page)

## API Endpoints

### Create Payment
```
POST /api/payments
Authorization: Bearer <token>
Roles: Admin, Super Admin, Manager

Body:
{
  "jobId": "JOB0001",
  "customerId": "CUST001",
  "customerName": "ABC Company",
  "invoiceNumber": "INV-2024-001",
  "billId": "BILL0001",
  "paymentMethod": "Cheque",
  "amount": 50000.00,
  "chequeNumber": "123456",
  "chequeDate": "2024-04-22",
  "bankName": "Commercial Bank"
}
```

### Get All Payments
```
GET /api/payments/all
Authorization: Bearer <token>
Roles: Admin, Super Admin, Manager

Query Parameters:
- status: Pending | Cleared | Bounced
- paymentMethod: Cheque | Bank Transfer
- customerId: CUST001
- jobId: JOB0001
```

### Update Payment Status
```
PUT /api/payments/:paymentId/status
Authorization: Bearer <token>
Roles: Admin, Super Admin, Manager

Body:
{
  "status": "Cleared"
}
```

## Integration with Billing

When marking an invoice as paid in the Billing component:

1. User selects payment method (Cash/Cheque/Bank Transfer)
2. For Cheque: Enter cheque number, date, and amount
3. For Bank Transfer: Select bank name
4. System automatically:
   - Updates bill status to "Paid"
   - Creates payment record (for Cheque/Bank Transfer only)
   - Sets initial status to "Pending"

## Workflow

### Cheque Payment Workflow
1. **Invoice Marked as Paid** → Payment record created with status "Pending"
2. **Cheque Deposited** → Status remains "Pending"
3. **Cheque Clears** → Admin/Manager marks as "Cleared" in Payment Management
4. **Cheque Bounces** → Admin/Manager marks as "Bounced" in Payment Management

### Bank Transfer Workflow
1. **Invoice Marked as Paid** → Payment record created with status "Pending"
2. **Transfer Confirmed** → Admin/Manager marks as "Cleared" in Payment Management

## Access Control

Only the following roles can access Payment Management:
- Super Admin
- Admin
- Manager

## Database Schema

```sql
Payments Table:
- PaymentId (PK): VARCHAR(50) - Format: PAY000001
- JobId (FK): VARCHAR(50)
- CustomerId (FK): VARCHAR(50)
- CustomerName: NVARCHAR(255)
- InvoiceNumber: VARCHAR(50)
- BillId (FK): VARCHAR(50)
- PaymentMethod: VARCHAR(50) - 'Cheque', 'Bank Transfer', 'Cash'
- PaymentDate: DATETIME
- Amount: DECIMAL(18, 2)
- Status: VARCHAR(50) - 'Pending', 'Cleared', 'Bounced'
- ChequeNumber: VARCHAR(100)
- ChequeDate: DATE
- BankName: NVARCHAR(255)
- ReferenceNumber: VARCHAR(100)
- ClearedDate: DATETIME
- BouncedDate: DATETIME
- Notes: NVARCHAR(MAX)
- CreatedBy: VARCHAR(50)
- CreatedDate: DATETIME
- UpdatedDate: DATETIME
```

## Files Created/Modified

### Backend Files Created:
- `backend-api/create-payments-table.sql` - Database schema
- `backend-api/src/domain/entities/Payment.js` - Payment entity
- `backend-api/src/domain/repositories/IPaymentRepository.js` - Repository interface
- `backend-api/src/infrastructure/repositories/MSSQLPaymentRepository.js` - Repository implementation
- `backend-api/src/application/use-cases/payment/CreatePayment.js` - Create payment use case
- `backend-api/src/application/use-cases/payment/GetAllPayments.js` - Get payments use case
- `backend-api/src/application/use-cases/payment/UpdatePaymentStatus.js` - Update status use case
- `backend-api/src/presentation/controllers/PaymentController.js` - Payment controller
- `backend-api/src/presentation/routes/paymentRoutes.js` - Payment routes

### Backend Files Modified:
- `backend-api/src/index.js` - Added payment routes
- `backend-api/src/infrastructure/di/container.js` - Added payment repository and updated dependencies
- `backend-api/src/application/use-cases/billing/MarkBillAsPaid.js` - Added payment record creation

### Frontend Files Created:
- `frontend/src/components/PaymentManagement.js` - Payment management component
- `frontend/src/styles/PaymentManagement.css` - Payment management styles

### Frontend Files Modified:
- `frontend/src/components/Accounting.js` - Added Payment Management tab

## Testing

### 1. Test Payment Creation
1. Go to Billing/Invoicing page
2. Mark an invoice as paid
3. Select "Cheque" as payment method
4. Fill in cheque details
5. Confirm payment
6. Verify payment record is created

### 2. Test Payment Management
1. Go to Accounting → Payment Management
2. Verify summary cards show correct totals
3. Test filtering by payment method and status
4. Test search functionality
5. Mark a cheque as "Cleared"
6. Verify status updates correctly

### 3. Test Access Control
1. Login as Waff Clerk
2. Verify Payment Management tab is not accessible
3. Login as Admin/Manager
4. Verify full access to Payment Management

## Troubleshooting

### Payment Records Not Created
- Check if payment method is "Cheque" or "Bank Transfer" (Cash payments are not tracked)
- Verify payment repository is properly initialized in DI container
- Check backend logs for errors

### Cannot Access Payment Management
- Verify user role is Admin, Super Admin, or Manager
- Check authentication token is valid
- Verify payment routes are registered in server

### Database Connection Issues
- Verify Payments table exists
- Check database connection string
- Ensure user has permissions on Payments table

## Future Enhancements

Potential improvements:
- Email notifications for bounced cheques
- Automatic cheque clearing after X days
- Payment reconciliation reports
- Export payment data to Excel
- Payment reminders for pending cheques
- Integration with bank APIs for automatic status updates

## Support

For issues or questions, contact the development team or refer to the main system documentation.
