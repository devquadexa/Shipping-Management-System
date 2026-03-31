# Quick Start: Parent-Child Petty Cash Assignments

## Problem Solved
Previously, when multiple petty cash assignments were made for the same job and user, they appeared as separate rows in the table. Now they are grouped into ONE row showing the total amount, with individual assignments visible when expanded.

## Example
**Before:**
```
| Job ID   | User      | Amount    |
|----------|-----------|-----------|
| JOB0002  | Clerk 01  | LKR 10,000|
| JOB0002  | Clerk 01  | LKR 10,000|
```

**After:**
```
| Job ID   | User      | Total Amount | Assignments |
|----------|-----------|--------------|-------------|
| JOB0002  | Clerk 01  | LKR 20,000   | 2 assignments ▶ |
```

When expanded:
```
Individual Assignments:
- Assignment #89: LKR 10,000
- Assignment #87: LKR 10,000
Total: LKR 20,000
```

## Installation Steps

### Step 1: Run Database Migration

1. Open SQL Server Management Studio
2. Connect to your database: `localhost:50156` (SQLEXPRESS instance)
3. Select database: `SuperShineCargoDb`
4. Open and execute: `backend-api/src/config/ADD_PARENT_ASSIGNMENT_STRUCTURE.sql`

Expected output:
```
✓ Added parentAssignmentId column
✓ Added foreign key constraint
✓ Added isMainAssignment column
✓ Backfill complete - existing assignments marked as main
✓ Created view vw_PettyCashAssignmentsWithChildren
✓ Migration completed successfully
```

### Step 2: Restart Backend Server

```bash
cd backend-api
npm start
```

The backend will automatically load the new use cases and routes.

### Step 3: Add Frontend Route

In your main routing file (e.g., `App.js` or `Routes.js`), add:

```javascript
import PettyCashAggregated from './components/PettyCashAggregated';

// In your routes section:
<Route path="/petty-cash-aggregated" element={<PettyCashAggregated />} />
```

### Step 4: Add Navigation Link

In your navigation menu component, add a link:

```javascript
<Link to="/petty-cash-aggregated">
  Petty Cash (Grouped View)
</Link>
```

Or update existing Petty Cash link to point to the new component.

## Usage

### For Admin/Manager:

1. **View Grouped Assignments**
   - Navigate to "Petty Cash (Grouped View)"
   - See ONE row per job+user combination
   - Total amount shows sum of all assignments

2. **Add Sub-Assignment**
   - Click "+ Add" button on any row
   - Enter amount and notes
   - Submit to create additional assignment for same job+user
   - Total updates automatically

3. **View Details**
   - Click expand button (▶) to see individual assignments
   - View breakdown of each assignment
   - See totals at bottom

### For Waff Clerk:

1. **View Your Assignments**
   - See grouped view of your assignments
   - One row per job with total amount

2. **Settle Assignments**
   - Use existing settlement flow
   - Settle each assignment individually
   - Status updates to "All Settled" when complete

## API Endpoints

### Get Aggregated Assignments (Admin/Manager)
```
GET /api/petty-cash-assignments/aggregated
Authorization: Bearer <token>
```

### Get My Aggregated Assignments (Waff Clerk)
```
GET /api/petty-cash-assignments/my-aggregated
Authorization: Bearer <token>
```

### Create Sub-Assignment
```
POST /api/petty-cash-assignments/:id/sub-assignment
Authorization: Bearer <token>
Content-Type: application/json

{
  "assignedAmount": 5000,
  "notes": "Additional petty cash for transport"
}
```

### Get Sub-Assignments
```
GET /api/petty-cash-assignments/:id/sub-assignments
Authorization: Bearer <token>
```

## Testing

### Test Case 1: View Grouped Assignments
1. Navigate to grouped view
2. Verify existing assignments are grouped by job+user
3. Verify totals are correct

### Test Case 2: Create Sub-Assignment
1. Click "+ Add" on a row
2. Enter amount: 5000
3. Enter notes: "Additional funds"
4. Submit
5. Verify new assignment appears in expanded view
6. Verify total updates

### Test Case 3: Expand/Collapse
1. Click expand button (▶)
2. Verify individual assignments show
3. Verify totals row is correct
4. Click collapse button (▼)
5. Verify row collapses

### Test Case 4: Settlement
1. Settle one assignment (existing flow)
2. Verify status updates
3. Settle all assignments
4. Verify group status shows "All Settled"

## Troubleshooting

### Migration Error: "CREATE VIEW must be first statement"
**Solution**: The SQL file has been fixed. Make sure you're using the latest version with proper GO statements.

### Backend Error: "Dependency not found"
**Solution**: Restart the backend server. The DI container needs to reload.

### Frontend: Component not found
**Solution**: Verify the import path is correct and the component file exists at `frontend/src/components/PettyCashAggregated.js`

### Data not showing
**Solution**: 
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check authentication token is valid
4. Verify database migration ran successfully

## Database Schema

### New Columns in PettyCashAssignments:
- `parentAssignmentId` (INT NULL) - Links to parent assignment
- `isMainAssignment` (BIT NOT NULL DEFAULT 1) - Flags main vs sub-assignment

### New View:
- `vw_PettyCashAssignmentsWithChildren` - Aggregated view with totals

## Files Created/Modified

### Backend:
- ✅ `backend-api/src/config/ADD_PARENT_ASSIGNMENT_STRUCTURE.sql`
- ✅ `backend-api/src/infrastructure/repositories/MSSQLPettyCashAssignmentRepository.js`
- ✅ `backend-api/src/application/use-cases/pettycashassignment/CreateSubAssignment.js`
- ✅ `backend-api/src/application/use-cases/pettycashassignment/GetAssignmentsWithChildren.js`
- ✅ `backend-api/src/application/use-cases/pettycashassignment/GetAggregatedAssignments.js`
- ✅ `backend-api/src/infrastructure/di/container.js`
- ✅ `backend-api/src/presentation/routes/pettyCashAssignmentRoutes.js`
- ✅ `backend-api/src/presentation/controllers/PettyCashAssignmentController.js`

### Frontend:
- ✅ `frontend/src/components/PettyCashAggregated.js`
- ✅ `frontend/src/styles/PettyCashAggregated.css`

## Next Steps

1. Run the database migration
2. Restart backend server
3. Add frontend route
4. Test the functionality
5. Update navigation menu
6. Train users on new interface

## Support

For detailed implementation information, see:
- `backend-api/PARENT_CHILD_IMPLEMENTATION.md` - Complete technical documentation
- Backend API logs for debugging
- Browser console for frontend errors
