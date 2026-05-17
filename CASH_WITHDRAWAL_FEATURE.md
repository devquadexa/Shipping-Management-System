# Cash Withdrawal Feature

## Overview
A new feature has been added to the Petty Cash Management system that allows administrators to manually record cash withdrawals from banks. This helps track when money is withdrawn from bank accounts and added to the petty cash balance.

## Features

### 1. Record Cash Withdrawals
- **Access**: Admin and Super Admin only
- **Location**: Petty Cash Management page
- **Functionality**: 
  - Opens a modal popup to enter withdrawal details
  - Records amount withdrawn, bank name, withdrawal date, and optional notes
  - Automatically updates the petty cash balance when a withdrawal is recorded

### 2. View Withdrawal Records
- **Display**: Withdrawal records are shown as cards/boxes in a grid layout
- **Information Displayed**:
  - Withdrawal ID (auto-generated, format: CW000001)
  - Amount withdrawn (in LKR)
  - Bank name
  - Withdrawal date
  - Recorded by (user who created the record)
  - Optional notes

### 3. Collapsible Section
- The cash withdrawals section can be collapsed/expanded
- Shows the total count of withdrawal records
- Maintains state during the session

## Technical Implementation

### Backend Components

#### 1. Entity
- **File**: `backend-api/src/domain/entities/CashWithdrawal.js`
- **Properties**: withdrawalId, amount, bankName, withdrawalDate, notes, createdBy, createdAt
- **Validation**: Ensures amount > 0 and bank name is provided

#### 2. Repository
- **Interface**: `backend-api/src/domain/repositories/ICashWithdrawalRepository.js`
- **Implementation**: `backend-api/src/infrastructure/repositories/MSSQLCashWithdrawalRepository.js`
- **Database**: Creates `CashWithdrawals` table automatically if it doesn't exist
- **Methods**: create, findAll, findById, generateNextId

#### 3. Use Cases
- **CreateCashWithdrawal**: Records a new withdrawal and updates petty cash balance
- **GetAllCashWithdrawals**: Retrieves all withdrawal records with user details

#### 4. API Routes
- **POST** `/api/cash-withdrawals` - Create new withdrawal (Admin/Super Admin only)
- **GET** `/api/cash-withdrawals` - Get all withdrawals (Admin/Super Admin/Manager)

### Frontend Components

#### 1. CashWithdrawalModal
- **File**: `frontend/src/components/CashWithdrawalModal.js`
- **Purpose**: Modal popup for entering withdrawal details
- **Fields**:
  - Amount (required, numeric, min 0.01)
  - Bank Name (required, text)
  - Withdrawal Date (required, date picker, defaults to today)
  - Notes (optional, textarea)

#### 2. PettyCash Component Updates
- **File**: `frontend/src/components/PettyCash.js`
- **Changes**:
  - Added cash withdrawal section with collapsible header
  - Integrated withdrawal modal
  - Added withdrawal records display as grid of boxes
  - Fetches withdrawals on component mount

#### 3. Service
- **File**: `frontend/src/api/services/cashWithdrawalService.js`
- **Methods**: getAll(), create()

#### 4. Styles
- **Files**: 
  - `frontend/src/styles/CashWithdrawalModal.css` - Modal styling
  - `frontend/src/styles/CashWithdrawals.css` - Withdrawal boxes styling
  - `frontend/src/styles/PettyCash.css` - Updated with withdrawal section styles

## Database Schema

```sql
CREATE TABLE CashWithdrawals (
  withdrawalId NVARCHAR(50) PRIMARY KEY,
  amount DECIMAL(18, 2) NOT NULL,
  bankName NVARCHAR(200) NOT NULL,
  withdrawalDate DATETIME NOT NULL,
  notes NVARCHAR(500),
  createdBy NVARCHAR(50) NOT NULL,
  createdAt DATETIME DEFAULT GETDATE()
)
```

## User Flow

1. **Admin/Super Admin** navigates to Petty Cash Management page
2. Sees "Cash Withdrawals from Bank" section below user balances
3. Clicks "+ Record Withdrawal" button
4. Modal opens with form fields
5. Enters withdrawal details:
   - Amount withdrawn
   - Bank name
   - Withdrawal date
   - Optional notes
6. Clicks "Record Withdrawal" button
7. System:
   - Validates input
   - Creates withdrawal record
   - Updates petty cash balance (adds the withdrawn amount)
   - Closes modal
   - Shows success message
   - Refreshes withdrawal list
8. Withdrawal appears as a new box in the grid

## Security & Permissions

- **Create Withdrawal**: Admin, Super Admin only
- **View Withdrawals**: Admin, Super Admin, Manager
- **Authentication**: Required via JWT token
- **Validation**: Server-side validation of all inputs

## Benefits

1. **Transparency**: Clear audit trail of all bank withdrawals
2. **Balance Tracking**: Automatic petty cash balance updates
3. **Record Keeping**: Maintains historical records with dates and notes
4. **User Attribution**: Tracks who recorded each withdrawal
5. **Easy Access**: Quick view of all withdrawals in organized grid layout

## Future Enhancements (Potential)

- Edit/Delete withdrawal records
- Filter withdrawals by date range or bank
- Export withdrawal history to PDF/Excel
- Bank account selection from predefined list
- Withdrawal approval workflow
- Integration with bank statements
