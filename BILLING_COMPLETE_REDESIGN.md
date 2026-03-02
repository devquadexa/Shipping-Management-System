# Billing Page Complete Redesign - Implementation Guide

## Overview
The billing page has been completely redesigned according to your specifications to match the professional workflow of Super Shine Cargo Service, based on the sample invoice template provided.

## Key Changes

### 1. Job Page Updates
**New Fields Added:**
- Exporter
- LC Number (Letter of Credit)
- Container Number

These fields are now part of the job creation/edit form and will automatically appear on generated invoices.

### 2. Pay Items Structure
**New Approach:**
- Each pay item now has THREE fields:
  - **Pay Item Name**: Description (e.g., "SLPA Bill", "Transport Charges")
  - **Actual Cost**: What the company actually paid
  - **Billing Amount**: What the customer will be charged
- **Same Amount Checkbox**: Auto-fills Billing Amount with Actual Cost value
- **Multiple Items**: Add as many pay items as needed in one go

### 3. Billing Workflow

#### Step 1: Select Job
- Dropdown shows: Job ID - Customer Name - Category
- Clean, professional job information display matching Customers/Jobs pages

#### Step 2: Add Pay Items
- Click "+ Add Items" button
- **Expandable row appears** (not a popup modal)
- Table format with columns:
  - Pay Item Name
  - Actual Cost (LKR)
  - Billing Amount (LKR)
  - Same Amount (checkbox)
  - Action (Remove button)
- "+ Add Another Item" button to add more rows
- "Save Pay Items" button to save all items at once
- "Cancel" button to discard changes

#### Step 3: View Pay Items Summary
- After saving, displays table showing:
  - Description
  - Actual Cost
  - Billing Amount
- Shows totals and **Profit** (Billing Amount - Actual Cost)
- Profit displayed in green (positive) or red (negative)

#### Step 4: Generate Bill
- Click "Generate Bill" button
- System creates bill with auto-generated invoice number (INV0001, INV0002, etc.)
- Calculates 10% tax on billing amount
- Total = Billing Amount + Tax

#### Step 5: Print Invoice
- Click "Print" button on any generated bill
- Opens professional invoice matching your template exactly
- Includes:
  - Super Shine logo (SS in navy box)
  - Company header
  - Invoice date and number
  - Customer name and address
  - CUSDEC Number, Exporter, LC Number, Container Number
  - Itemized pay items with **Billing Amounts only** (customer doesn't see actual costs)
  - Total Due Amount
  - Company footer with contact information

### 4. Bills Table
Shows all generated bills with columns:
- Invoice No
- Job ID
- Customer
- Actual Cost
- Billing Amount
- Profit (color-coded)
- Total (with Tax)
- Status (Paid/Unpaid)
- Actions (Print, Mark Paid)

## Database Changes

### Run These SQL Scripts (in order):

1. **update-jobs-add-invoice-fields.sql**
   - Adds: Exporter, LCNumber, ContainerNumber to Jobs table

2. **update-payitems-table.sql**
   - Renames Amount to ActualCost
   - Adds BillingAmount column

3. **update-bills-table.sql**
   - Adds: ActualCost, BillingAmount, Profit, BillDate, InvoiceNumber

## Files Modified

### Backend
1. `backend-api/src/config/update-jobs-add-invoice-fields.sql` - NEW
2. `backend-api/src/config/update-payitems-table.sql` - NEW
3. `backend-api/src/config/update-bills-table.sql` - UPDATED
4. `backend-api/src/domain/entities/Job.js` - Added new fields
5. `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js` - Updated for new fields
6. `backend-api/src/domain/entities/Bill.js` - Updated
7. `backend-api/src/infrastructure/repositories/MSSQLBillRepository.js` - Updated
8. `backend-api/src/application/use-cases/billing/CreateBill.js` - Updated

### Frontend
1. `frontend/src/components/Jobs.js` - Added Exporter, LC Number, Container Number fields
2. `frontend/src/components/Billing.js` - Completely rewritten
3. `frontend/src/styles/Billing.css` - Completely rewritten (matches Customers/Jobs styling)

## UI/UX Improvements

### Professional Design
- Clean layout matching Customers and Jobs pages
- Consistent styling across all pages
- Navy blue theme (#101036)
- Professional card-based design
- Clear visual hierarchy

### User-Friendly Features
- Expandable row for adding pay items (not popup)
- Add multiple items at once
- Same Amount checkbox for convenience
- Real-time profit calculation
- Color-coded profit indicators
- Mobile responsive with card view

### Invoice Template
- Matches your sample bill exactly
- Professional header with logo
- All required fields included
- Customer sees only billing amounts (not actual costs)
- Print-ready format
- Company branding and contact info

## Business Benefits

1. **Cost Tracking**: See actual costs vs billing amounts for each job
2. **Profitability Analysis**: Instant profit/loss calculation per job
3. **Professional Invoices**: Print-ready bills matching company template
4. **Efficiency**: Streamlined workflow, add multiple items at once
5. **Transparency**: Clear separation of costs and billing
6. **Accuracy**: Automatic calculations reduce errors
7. **Flexibility**: Same Amount checkbox for quick entry when costs match billing

## Testing Steps

1. Run all three SQL scripts in order
2. Restart backend server
3. Create a new job with all fields (including Exporter, LC Number, Container Number)
4. Go to Billing page
5. Select the job
6. Click "+ Add Items"
7. Add multiple pay items:
   - Enter Pay Item Name
   - Enter Actual Cost
   - Enter Billing Amount (or check Same Amount)
   - Click "+ Add Another Item" for more
8. Click "Save Pay Items"
9. Review the summary showing totals and profit
10. Click "Generate Bill"
11. View bill in the table below
12. Click "Print" to see the invoice
13. Verify all fields appear correctly on invoice

## Notes

- Invoice numbers auto-generate as INV0001, INV0002, etc.
- Customer invoices show only billing amounts (not actual costs)
- Profit calculation: Billing Amount - Actual Cost
- Tax is 10% of Billing Amount
- Total = Billing Amount + Tax
- All styling matches Customers and Jobs pages for consistency
- Mobile responsive design included
- Expandable row (not modal) for better UX

## Support

If you encounter any issues:
1. Check that all SQL scripts ran successfully
2. Verify backend server restarted
3. Clear browser cache
4. Check browser console for errors
5. Verify database columns exist with correct names
