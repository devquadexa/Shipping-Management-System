# Parent-Child Petty Cash Assignments Implementation

## Overview
This implementation adds parent-child relationship support for petty cash assignments, allowing multiple assignments for the same job and user to be grouped together. The main assignment shows the total amount, and sub-assignments are visible when expanded.

## Database Changes

### Migration File
- **File**: `backend-api/src/config/ADD_PARENT_ASSIGNMENT_STRUCTURE.sql`
- **Changes**:
  - Added `parentAssignmentId` column (INT NULL)
  - Added `isMainAssignment` column (BIT NOT NULL DEFAULT 1)
  - Added foreign key constraint `FK_PettyCashAssignments_Parent`
  - Created view `vw_PettyCashAssignmentsWithChildren` for easy querying
  - Backfilled existing records with `isMainAssignment = 1`

### How to Run Migration
```sql
-- Run this in SQL Server Management Studio
USE SuperShineCargoDb;
GO

-- Execute the migration script
-- File: backend-api/src/config/ADD_PARENT_ASSIGNMENT_STRUCTURE.sql
```

## Backend Implementation

### 1. Repository Methods (MSSQLPettyCashAssignmentRepository.js)
New methods added:
- `createSubAssignment(assignmentData)` - Create a sub-assignment under a parent
- `getMainAssignments(userId)` - Get only main assignments (optionally filtered by user)
- `getSubAssignments(parentAssignmentId)` - Get all sub-assignments for a parent
- `getTotalAssignedAmount(mainAssignmentId)` - Calculate total amount (main + subs)

### 2. Use Cases
Three new use cases created:

#### CreateSubAssignment.js
- Creates a sub-assignment under an existing parent assignment
- Automatically inherits jobId, assignedTo, and groupId from parent
- Sets `isMainAssignment = 0` and links via `parentAssignmentId`

#### GetAssignmentsWithChildren.js
- Returns main assignments with their sub-assignments nested
- Calculates total assigned amount (main + all subs)
- Includes sub-assignment count

#### GetAggregatedAssignments.js
- Groups assignments by jobId + assignedTo
- Shows ONE row per job+user combination
- Calculates totals: totalAssignedAmount, totalActualSpent, totalBalance, totalOver
- Determines group status (all settled vs pending)

### 3. DI Container Registration
All new use cases registered in `backend-api/src/infrastructure/di/container.js`:
```javascript
this.dependencies.createSubAssignment = new CreateSubAssignment(pettyCashAssignmentRepository);
this.dependencies.getAssignmentsWithChildren = new GetAssignmentsWithChildren(pettyCashAssignmentRepository);
this.dependencies.getAggregatedAssignments = new GetAggregatedAssignments(pettyCashAssignmentRepository);
```

### 4. API Routes
New routes added in `backend-api/src/presentation/routes/pettyCashAssignmentRoutes.js`:

```javascript
// Get aggregated view (Admin/Manager)
GET /api/petty-cash-assignments/aggregated

// Get user's aggregated view (Waff Clerk)
GET /api/petty-cash-assignments/my-aggregated

// Get assignments with children (Admin/Manager)
GET /api/petty-cash-assignments/with-children

// Get user's assignments with children (Waff Clerk)
GET /api/petty-cash-assignments/my-with-children

// Create sub-assignment
POST /api/petty-cash-assignments/:id/sub-assignment

// Get sub-assignments for a parent
GET /api/petty-cash-assignments/:id/sub-assignments
```

### 5. Controller Methods
New methods added in `backend-api/src/presentation/controllers/PettyCashAssignmentController.js`:
- `getAggregated()` - Returns aggregated assignments for admin/manager
- `getMyAggregated()` - Returns user's aggregated assignments
- `getWithChildren()` - Returns assignments with nested children
- `getMyWithChildren()` - Returns user's assignments with children
- `createSubAssignment()` - Creates a sub-assignment
- `getSubAssignments()` - Gets sub-assignments for a parent

## Frontend Implementation

### 1. New Component: PettyCashAggregated.js
**Location**: `frontend/src/components/PettyCashAggregated.js`

**Features**:
- Shows ONE row per job+user combination in main table
- Displays total assigned amount across all assignments
- Shows count of assignments (e.g., "3 assignments")
- Expand/collapse functionality to view individual assignments
- Add sub-assignment button for admin/manager roles
- Professional, responsive design

**Key Functionality**:
- Fetches aggregated data from `/api/petty-cash-assignments/aggregated` or `/my-aggregated`
- Expandable rows show detailed breakdown of individual assignments
- Totals row at bottom of expanded view
- Modal for creating new sub-assignments

### 2. Styling: PettyCashAggregated.css
**Location**: `frontend/src/styles/PettyCashAggregated.css`

**Design Features**:
- Modern gradient header (purple theme)
- Smooth expand/collapse animations
- Color-coded status badges
- Responsive table design
- Professional modal dialogs
- Hover effects and transitions
- Mobile-responsive layout

## Data Structure

### Main Assignment
```javascript
{
  assignmentId: 1,
  jobId: "JOB0001",
  assignedTo: "user123",
  assignedAmount: 10000,
  isMainAssignment: 1,
  parentAssignmentId: null,
  // ... other fields
}
```

### Sub-Assignment
```javascript
{
  assignmentId: 2,
  jobId: "JOB0001",
  assignedTo: "user123",
  assignedAmount: 5000,
  isMainAssignment: 0,
  parentAssignmentId: 1,  // Links to main assignment
  // ... other fields
}
```

### Aggregated View
```javascript
{
  groupKey: "JOB0001_user123",
  jobId: "JOB0001",
  assignedTo: "user123",
  assignedToName: "John Doe",
  assignments: [
    { assignmentId: 1, assignedAmount: 10000, ... },
    { assignmentId: 2, assignedAmount: 5000, ... }
  ],
  totalAssignedAmount: 15000,
  totalActualSpent: 14500,
  totalBalance: 500,
  totalOver: 0,
  allSettled: true,
  mainAssignmentId: 1
}
```

## Usage Flow

### For Admin/Manager:
1. View aggregated assignments at `/petty-cash-aggregated` (you need to add route)
2. Click expand button (▶) to see individual assignments
3. Click "+ Add" to create a sub-assignment for the same job+user
4. Enter amount and notes, submit
5. New sub-assignment appears in expanded view
6. Total amount updates automatically

### For Waff Clerk:
1. View their own aggregated assignments
2. See total amount assigned across all assignments
3. Expand to view individual assignment details
4. Settle each assignment individually (existing flow)
5. All assignments must be settled for group to show "All Settled"

## Integration Steps

### 1. Run Database Migration
```bash
# In SQL Server Management Studio
# Execute: backend-api/src/config/ADD_PARENT_ASSIGNMENT_STRUCTURE.sql
```

### 2. Restart Backend
```bash
cd backend-api
npm start
```

### 3. Add Frontend Route
In your main App.js or routing file, add:
```javascript
import PettyCashAggregated from './components/PettyCashAggregated';

// In your routes:
<Route path="/petty-cash-aggregated" element={<PettyCashAggregated />} />
```

### 4. Add Navigation Link
In your navigation menu:
```javascript
<Link to="/petty-cash-aggregated">Petty Cash (Grouped)</Link>
```

## Testing

### Test Scenarios:

1. **Create Main Assignment**
   - Assign petty cash to a job and user
   - Verify it appears in aggregated view

2. **Create Sub-Assignment**
   - Click "+ Add" on an aggregated row
   - Enter amount and notes
   - Verify total updates correctly

3. **Expand/Collapse**
   - Click expand button
   - Verify individual assignments show
   - Verify totals row is correct

4. **Multiple Assignments**
   - Create 3-4 assignments for same job+user
   - Verify they group into ONE row
   - Verify total is sum of all amounts

5. **Settlement**
   - Settle individual assignments
   - Verify status updates
   - Verify "All Settled" shows when all are settled

## API Endpoints Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/petty-cash-assignments/aggregated` | Admin/Manager | Get all aggregated assignments |
| GET | `/api/petty-cash-assignments/my-aggregated` | All | Get user's aggregated assignments |
| GET | `/api/petty-cash-assignments/with-children` | Admin/Manager | Get assignments with nested children |
| GET | `/api/petty-cash-assignments/my-with-children` | All | Get user's assignments with children |
| POST | `/api/petty-cash-assignments/:id/sub-assignment` | Admin/Manager | Create sub-assignment |
| GET | `/api/petty-cash-assignments/:id/sub-assignments` | All | Get sub-assignments for parent |

## Notes

- Main assignment ID is used as the "group identifier"
- First assignment created is automatically the main assignment
- Sub-assignments inherit jobId, assignedTo, and groupId from parent
- Waff clerk settles each assignment individually (existing flow)
- Total amounts are calculated dynamically from all assignments in group
- View shows ONE row per job+user, regardless of number of assignments

## Files Modified/Created

### Backend:
- ✅ `backend-api/src/config/ADD_PARENT_ASSIGNMENT_STRUCTURE.sql` (fixed)
- ✅ `backend-api/src/infrastructure/repositories/MSSQLPettyCashAssignmentRepository.js` (extended)
- ✅ `backend-api/src/application/use-cases/pettycashassignment/CreateSubAssignment.js` (new)
- ✅ `backend-api/src/application/use-cases/pettycashassignment/GetAssignmentsWithChildren.js` (new)
- ✅ `backend-api/src/application/use-cases/pettycashassignment/GetAggregatedAssignments.js` (new)
- ✅ `backend-api/src/infrastructure/di/container.js` (updated)
- ✅ `backend-api/src/presentation/routes/pettyCashAssignmentRoutes.js` (updated)
- ✅ `backend-api/src/presentation/controllers/PettyCashAssignmentController.js` (updated)

### Frontend:
- ✅ `frontend/src/components/PettyCashAggregated.js` (new)
- ✅ `frontend/src/styles/PettyCashAggregated.css` (new)

### Documentation:
- ✅ `backend-api/PARENT_CHILD_IMPLEMENTATION.md` (this file)
