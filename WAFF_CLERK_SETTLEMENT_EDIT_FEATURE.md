# Waff Clerk Settlement Edit/Delete Feature

## Overview
Allow Waff Clerks to edit and delete petty cash settlement items BEFORE invoice generation. Once an invoice is generated for the job, settlement items become read-only.

## Business Requirements

### Access Control
- **Who**: Waff Clerks only
- **When**: After settlement is submitted, BEFORE invoice is generated
- **What**: Edit item name, actual cost, or delete entire items
- **Why**: Users are new to the system and make mistakes during data entry

### Restrictions
- ✅ Can edit/delete if: Settlement status = "Settled" AND No invoice generated for job
- ❌ Cannot edit/delete if: Invoice has been generated for the job
- ❌ Cannot edit/delete if: Settlement status is "Pending Approval", "Approved", etc.

## Implementation Plan

### Phase 1: Check Invoice Generation Status

#### Frontend Function
```javascript
// Add to PettyCash.js
const checkInvoiceGenerated = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE}/api/billing`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const bills = await response.json();
      const jobBill = bills.find(bill => bill.jobId === jobId);
      return !!jobBill; // Returns true if invoice exists
    }
    return false;
  } catch (error) {
    console.error('Error checking invoice:', error);
    return false;
  }
};
```

### Phase 2: Add Edit/Delete UI

#### State Variables
```javascript
const [editingSettlementItem, setEditingSettlementItem] = useState(null);
const [editItemName, setEditItemName] = useState('');
const [editActualCost, setEditActualCost] = useState('');
const [canEditSettlement, setCanEditSettlement] = useState(false);
```

#### Check Edit Permission When Opening Modal
```javascript
// When loading settlement details
const invoiceGenerated = await checkInvoiceGenerated(assignment.jobId);
const isWaffClerk = user?.role === 'Waff Clerk';
const canEdit = isWaffClerk && !invoiceGenerated && assignment.status === 'Settled';
setCanEditSettlement(canEdit);
```

#### Add Edit/Delete Buttons to Settlement Items Table
```javascript
{canEditSettlement && (
  <th>Actions</th>
)}

// In table body
{canEditSettlement && (
  <td>
    <button onClick={() => startEditItem(item)} className="btn-edit-small">
      ✏️ Edit
    </button>
    <button onClick={() => deleteSettlementItem(item)} className="btn-delete-small">
      🗑️ Delete
    </button>
  </td>
)}
```

### Phase 3: Backend API Endpoints

#### Update Settlement Item
```javascript
// Route: PATCH /api/petty-cash-assignments/:assignmentId/settlement-items/:itemId
// Body: { itemName, actualCost }

router.patch('/:assignmentId/settlement-items/:itemId', 
  auth, 
  checkRole('Waff Clerk'), 
  async (req, res) => {
    // 1. Check if invoice exists for job
    // 2. If no invoice, update settlement item
    // 3. Recalculate assignment totals
    // 4. Return updated item
  }
);
```

#### Delete Settlement Item
```javascript
// Route: DELETE /api/petty-cash-assignments/:assignmentId/settlement-items/:itemId

router.delete('/:assignmentId/settlement-items/:itemId', 
  auth, 
  checkRole('Waff Clerk'), 
  async (req, res) => {
    // 1. Check if invoice exists for job
    // 2. If no invoice, delete settlement item
    // 3. Recalculate assignment totals
    // 4. Return success
  }
);
```

### Phase 4: Frontend Edit/Delete Functions

#### Start Editing Item
```javascript
const startEditItem = (item) => {
  setEditingSettlementItem(item.settlementItemId);
  setEditItemName(item.itemName);
  setEditActualCost(item.actualCost);
};
```

#### Save Edited Item
```javascript
const saveEditedItem = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items/${editingSettlementItem}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemName: editItemName,
          actualCost: parseFloat(editActualCost)
        })
      }
    );
    
    if (response.ok) {
      setMessage('✅ Settlement item updated successfully');
      // Reload settlement items
      await reloadSettlementItems();
      setEditingSettlementItem(null);
    }
  } catch (error) {
    setMessage('❌ Error updating settlement item');
  }
};
```

#### Delete Settlement Item
```javascript
const deleteSettlementItem = async (item) => {
  if (!window.confirm(`Are you sure you want to delete "${item.itemName}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(
      `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settlement-items/${item.settlementItemId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (response.ok) {
      setMessage('✅ Settlement item deleted successfully');
      // Reload settlement items
      await reloadSettlementItems();
    }
  } catch (error) {
    setMessage('❌ Error deleting settlement item');
  }
};
```

### Phase 5: Impact on Billing

When settlement items are edited/deleted, the changes must reflect in the billing section:

#### Automatic Updates
1. **Actual Cost Changes**: When Waff Clerk edits actual cost, it updates the settlement item
2. **Billing Recalculation**: When Admin/Manager opens billing for that job, they see updated actual costs
3. **No Manual Sync Needed**: The billing section already loads settlement items dynamically from the database

#### How It Works
```javascript
// In Billing.js - when loading pay items for a job
// This already fetches settlement items from the database
const response = await fetch(`${API_BASE}/api/petty-cash-assignments/job/${jobId}/all`);

// So any changes made by Waff Clerk are automatically reflected
// No additional code needed in billing section!
```

## UI/UX Design

### Settlement Items Table (View Mode)

#### Before Invoice Generation (Waff Clerk)
```
┌─────────────────────────────────────────────────────────────┐
│ Settlement Items                                             │
├─────────────────────────────────────────────────────────────┤
│ Item Name    │ Actual Cost │ Type   │ Bill │ Actions       │
├─────────────────────────────────────────────────────────────┤
│ Transport    │ LKR 5,000   │ Custom │ ✓    │ ✏️ Edit 🗑️ Del│
│ Loading Fee  │ LKR 2,500   │ Temp   │ ✗    │ ✏️ Edit 🗑️ Del│
│ Customs      │ LKR 10,000  │ Custom │ ✓    │ ✏️ Edit 🗑️ Del│
└─────────────────────────────────────────────────────────────┘
```

#### After Invoice Generation (Waff Clerk)
```
┌─────────────────────────────────────────────────────────────┐
│ Settlement Items (Read-Only - Invoice Generated)            │
├─────────────────────────────────────────────────────────────┤
│ Item Name    │ Actual Cost │ Type   │ Bill │ Paid By       │
├─────────────────────────────────────────────────────────────┤
│ Transport    │ LKR 5,000   │ Custom │ ✓    │ John Doe      │
│ Loading Fee  │ LKR 2,500   │ Temp   │ ✗    │ John Doe      │
│ Customs      │ LKR 10,000  │ Custom │ ✓    │ John Doe      │
└─────────────────────────────────────────────────────────────┘
```

### Inline Editing Mode
```
┌─────────────────────────────────────────────────────────────┐
│ Item Name    │ Actual Cost │ Type   │ Bill │ Actions       │
├─────────────────────────────────────────────────────────────┤
│ [Transport__]│ [5000.00___]│ Custom │ ✓    │ ✓ Save ✗ Cancel│
│ Loading Fee  │ LKR 2,500   │ Temp   │ ✗    │ ✏️ Edit 🗑️ Del│
│ Customs      │ LKR 10,000  │ Custom │ ✓    │ ✏️ Edit 🗑️ Del│
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### PettyCashSettlementItems Table
```sql
-- Already exists, no changes needed
settlementItemId INT PRIMARY KEY
assignmentId INT
itemName VARCHAR(255)
actualCost DECIMAL(18,2)
isCustomItem BIT
paidBy VARCHAR(50)
hasBill BIT
```

## Security Considerations

### Backend Validation
```javascript
// Before allowing edit/delete
1. Verify user is Waff Clerk
2. Verify assignment belongs to this Waff Clerk
3. Verify no invoice exists for the job
4. Verify settlement status is "Settled"
```

### Frontend Validation
```javascript
// Before showing edit/delete buttons
1. Check user role === 'Waff Clerk'
2. Check assignment.status === 'Settled'
3. Check !invoiceGenerated
```

## Error Handling

### Scenarios
1. **Invoice Generated**: "Cannot edit - Invoice already generated for this job"
2. **Wrong Status**: "Cannot edit - Settlement must be in 'Settled' status"
3. **Not Owner**: "Cannot edit - This settlement belongs to another clerk"
4. **Network Error**: "Error updating settlement item. Please try again."

## Testing Checklist

### Functional Testing
- [ ] Waff Clerk can edit settlement item before invoice
- [ ] Waff Clerk can delete settlement item before invoice
- [ ] Edit/delete buttons hidden after invoice generation
- [ ] Changes reflect in billing section actual costs
- [ ] Totals recalculate correctly after edit/delete
- [ ] Cannot edit items from other clerks' settlements

### UI Testing
- [ ] Edit button opens inline editing mode
- [ ] Save button updates item successfully
- [ ] Cancel button discards changes
- [ ] Delete button shows confirmation dialog
- [ ] Success/error messages display correctly

### Integration Testing
- [ ] Edited actual costs appear in billing section
- [ ] Deleted items removed from billing section
- [ ] Invoice generation still works correctly
- [ ] Settlement totals update correctly

## Files to Modify

### Frontend
1. `frontend/src/components/PettyCash.js`
   - Add state variables for editing
   - Add checkInvoiceGenerated function
   - Add edit/delete functions
   - Update settlement items table UI
   - Add inline editing mode

2. `frontend/src/styles/PettyCash.css`
   - Add styles for edit/delete buttons
   - Add styles for inline editing mode
   - Add styles for read-only indicator

### Backend
1. `backend-api/src/presentation/routes/pettyCashAssignments.js`
   - Add PATCH route for updating settlement item
   - Add DELETE route for deleting settlement item

2. `backend-api/src/infrastructure/repositories/MSSQLPettyCashAssignmentRepository.js`
   - Add updateSettlementItem method
   - Add deleteSettlementItem method
   - Add recalculateAssignmentTotals method

3. `backend-api/src/presentation/controllers/PettyCashAssignmentController.js`
   - Add updateSettlementItem handler
   - Add deleteSettlementItem handler

## Benefits

### For Waff Clerks
- ✅ Can fix mistakes without admin intervention
- ✅ Faster error correction
- ✅ Better data accuracy
- ✅ Reduced frustration

### For Admins/Managers
- ✅ Less manual correction work
- ✅ More accurate billing data
- ✅ Better audit trail
- ✅ Reduced support requests

### For Business
- ✅ Improved data quality
- ✅ Faster processing
- ✅ Better user adoption
- ✅ Reduced errors in invoicing

## Status

📋 **PLANNED** - Detailed implementation plan ready. Requires backend and frontend development.

## Next Steps

1. Create backend API endpoints
2. Update frontend PettyCash component
3. Add CSS styling
4. Test edit/delete functionality
5. Test integration with billing
6. Deploy and train users
