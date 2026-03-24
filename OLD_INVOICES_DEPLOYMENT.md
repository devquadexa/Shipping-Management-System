# Old Invoice Management Feature - Deployment Guide

## Overview
This feature adds a complete Old Invoice Management system for historical invoice data entry (since 2026/1/1). The system is standalone and does not integrate with current invoicing/jobs/accounting sections.

## Database Changes Required

### Step 1: Run the SQL Script on Production Database

Connect to your production database via SSH and run:

```bash
ssh root@72.61.169.242
docker exec -it cargo_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -No -d SuperShineCargoDb
```

Then paste and execute the following SQL:

```sql
-- Create OldInvoices table for historical invoice data entry
CREATE TABLE OldInvoices (
    oldInvoiceId INT IDENTITY(1,1) PRIMARY KEY,
    customerId VARCHAR(50) NOT NULL,
    cusdecNumber NVARCHAR(100),
    cusdecDate DATE,
    invoiceDate DATE NOT NULL,
    invoiceNumber NVARCHAR(100) NOT NULL UNIQUE,
    totalAmount DECIMAL(18, 2) NOT NULL,
    amountReceived DECIMAL(18, 2) DEFAULT 0,
    balance DECIMAL(18, 2) NOT NULL,
    status NVARCHAR(50) DEFAULT 'Pending',
    settleDate DATE,
    daysAfterInvoice INT,
    createdAt DATETIME DEFAULT GETDATE(),
    createdBy VARCHAR(50),
    updatedAt DATETIME,
    FOREIGN KEY (customerId) REFERENCES Customers(customerId)
);

-- Create OldInvoicePayments table for tracking multiple payments
CREATE TABLE OldInvoicePayments (
    paymentId INT IDENTITY(1,1) PRIMARY KEY,
    oldInvoiceId INT NOT NULL,
    paymentAmount DECIMAL(18, 2) NOT NULL,
    paymentMethod NVARCHAR(50) NOT NULL,
    receivedDate DATE NOT NULL,
    notes NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE(),
    createdBy VARCHAR(50),
    FOREIGN KEY (oldInvoiceId) REFERENCES OldInvoices(oldInvoiceId) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IX_OldInvoices_CustomerId ON OldInvoices(customerId);
CREATE INDEX IX_OldInvoices_InvoiceDate ON OldInvoices(invoiceDate);
CREATE INDEX IX_OldInvoices_Status ON OldInvoices(status);
CREATE INDEX IX_OldInvoicePayments_OldInvoiceId ON OldInvoicePayments(oldInvoiceId);
GO
```

Type `exit` to close sqlcmd.

## Features Implemented

### 1. Invoice Management
- **Customer Selection**: Dropdown with all active customers, displays Customer ID and Name
- **Cusdec Number**: Manual text entry (optional)
- **Cusdec Date**: Calendar date picker (optional)
- **Invoice Date**: Calendar date picker (required)
- **Invoice Number**: Auto-generated format `YYYY/MM - INV{suffix}`
  - Year/Month extracted from Invoice Date
  - Suffix entered manually (e.g., "11959")
  - Example: `2026/01 - INV11959`
- **Total Amount**: Manual entry in LKR (required)
- **Settle Date**: Manual entry when invoice is fully settled (optional)

### 2. Payment Tracking
- **Multiple Payments**: Support for partial payments
- **Payment Methods**: Cash, Cheque, Bank Transfer
- **Received Date**: Date picker for each payment
- **Notes**: Optional notes for each payment
- **Automatic Calculations**:
  - Amount Received = Sum of all payments
  - Balance = Total Amount - Amount Received
  - Status automatically updates:
    - "Pending" when no payments
    - "Partially Paid" when some payments made
    - "Fully Settled" when balance = 0

### 3. Status Management
- **Automatic Status Updates**: Based on payment amounts
- **Days After Invoice**: Auto-calculated when fully settled (Invoice Date to Settle Date)
- **Visual Status Badges**: Color-coded status indicators

### 4. User Interface
- Professional design matching existing pages
- Responsive layout for mobile/tablet/desktop
- Expandable rows showing payment history
- Search by invoice number, customer, or cusdec number
- Filter by status (All, Pending, Partially Paid, Fully Settled)
- Add/Edit/Delete invoices
- Add/Delete payments

### 5. Access Control
- Accessible to: Admin, Super Admin, Manager, Office Executive
- Full CRUD operations for authorized roles

## Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd "D:\Work and Learn\Quadexa\Shipping Management System"
git add .
git commit -m "Add Old Invoice Management feature"
git push origin main
```

### Step 2: Deploy to Production Server

SSH into the server:

```bash
ssh root@72.61.169.242
cd Shipping-Management-System
git pull origin main
```

### Step 3: Rebuild and Restart Containers

```bash
docker compose down
docker compose up -d --build
```

### Step 4: Verify Deployment

1. Open `https://supershinecargo.cloud`
2. Login with admin credentials
3. Navigate to "Old Invoices" in the menu
4. Test creating a new invoice
5. Test adding payments
6. Verify calculations are correct

## Testing Checklist

- [ ] Database tables created successfully
- [ ] Old Invoices menu appears in navigation
- [ ] Can create new invoice with all fields
- [ ] Invoice number generates correctly (YYYY/MM - INV{suffix})
- [ ] Customer dropdown shows all active customers
- [ ] Can add multiple payments to an invoice
- [ ] Balance calculates correctly
- [ ] Status updates automatically
- [ ] Days after invoice calculates when fully settled
- [ ] Can edit existing invoices
- [ ] Can delete invoices and payments
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Expandable rows show payment history
- [ ] Responsive design works on mobile

## API Endpoints

- `GET /api/old-invoices` - Get all old invoices
- `GET /api/old-invoices/:id` - Get invoice by ID
- `POST /api/old-invoices` - Create new invoice
- `PUT /api/old-invoices/:id` - Update invoice
- `DELETE /api/old-invoices/:id` - Delete invoice
- `POST /api/old-invoices/:id/payments` - Add payment
- `DELETE /api/old-invoices/payments/:paymentId` - Delete payment

## Files Created/Modified

### Backend Files Created:
- `backend-api/src/config/CREATE_OLD_INVOICES_TABLE.sql`
- `backend-api/src/domain/entities/OldInvoice.js`
- `backend-api/src/domain/repositories/IOldInvoiceRepository.js`
- `backend-api/src/infrastructure/repositories/MSSQLOldInvoiceRepository.js`
- `backend-api/src/application/use-cases/oldinvoice/CreateOldInvoice.js`
- `backend-api/src/application/use-cases/oldinvoice/GetAllOldInvoices.js`
- `backend-api/src/application/use-cases/oldinvoice/UpdateOldInvoice.js`
- `backend-api/src/application/use-cases/oldinvoice/DeleteOldInvoice.js`
- `backend-api/src/application/use-cases/oldinvoice/AddPaymentToOldInvoice.js`
- `backend-api/src/application/use-cases/oldinvoice/DeletePaymentFromOldInvoice.js`
- `backend-api/src/presentation/routes/oldInvoices.js`

### Backend Files Modified:
- `backend-api/src/infrastructure/di/container.js` - Added old invoice dependencies
- `backend-api/src/index.js` - Added old invoice route

### Frontend Files Created:
- `frontend/src/components/OldInvoices.js`
- `frontend/src/styles/OldInvoices.css`

### Frontend Files Modified:
- `frontend/src/App.js` - Added old invoices route
- `frontend/src/components/Navbar.js` - Added old invoices menu item

## Notes

- This feature is completely standalone and does not affect existing invoicing, jobs, or accounting features
- All calculations are automatic (balance, status, days after invoice)
- Payment history is preserved and displayed in expandable rows
- The system supports multiple partial payments before full settlement
- Invoice numbers follow the format: YYYY/MM - INV{suffix} where YYYY/MM is auto-generated from invoice date

## Support

If you encounter any issues during deployment, check:
1. Database connection is working
2. All tables were created successfully
3. Backend logs for any errors: `docker logs cargo_backend --tail 50`
4. Frontend console for any JavaScript errors

For database verification:
```bash
docker exec -it cargo_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -No -d SuperShineCargoDb -Q "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('OldInvoices', 'OldInvoicePayments')"
```
