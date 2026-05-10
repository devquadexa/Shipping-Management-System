# Job Management - Total Amount and Paid Amount Columns Implementation

## Overview
Added two new columns to the Job Management page to display billing information:
- **Total Amount**: The total billing amount (netTotal) from the Bills table
- **Paid Amount**: The amount already paid from the Bills table

## Changes Made

### Backend Changes

#### 1. Job Entity (`backend-api/src/domain/entities/Job.js`)
- Added two new properties to the Job entity:
  - `billTotalAmount`: Total billing amount from Bills table (nullable)
  - `billPaidAmount`: Paid amount from Bills table (defaults to 0)
- Updated constructor to accept these new fields
- Updated `toJSON()` method to include these fields in API responses

#### 2. Job Repository (`backend-api/src/infrastructure/repositories/MSSQLJobRepository.js`)
- Modified `findAll()` method to LEFT JOIN with Bills table:
  ```sql
  SELECT 
    j.*,
    b.netTotal as billTotalAmount,
    b.paidAmount as billPaidAmount
  FROM Jobs j
  LEFT JOIN Bills b ON j.jobId = b.jobId
  ```
- Modified `findByAssignedUser()` method to include the same LEFT JOIN
- Updated `mapToEntity()` method to parse and include bill data:
  - `billTotalAmount`: Parsed as float, nullable
  - `billPaidAmount`: Parsed as float, defaults to 0

### Frontend Changes

#### 1. Jobs Component (`frontend/src/components/Jobs.js`)
- Added two new table header columns:
  - "Total Amount" (after "Assigned To" column)
  - "Paid Amount" (after "Total Amount" column)
- Added corresponding table data cells with:
  - Currency formatting: `LKR X,XXX.XX` format
  - Conditional rendering: Shows "-" if no bill exists for the job
  - CSS classes: `amount-value` for amounts, `no-bill-text` for no bill
- Updated expanded details row colspan:
  - Non-Waff Clerk users: colspan changed from 7 to 9
  - Waff Clerk users: colspan changed from 6 to 8

#### 2. Jobs Styles (`frontend/src/styles/Jobs.css`)
- Added new CSS classes:
  ```css
  .amount-value {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #101036;
    font-size: 0.95rem;
  }
  
  .no-bill-text {
    color: #9ca3af;
    font-style: italic;
    font-size: 0.875rem;
  }
  ```
- Added responsive styling for mobile devices

## Data Flow

1. **Database Query**: Jobs are fetched with a LEFT JOIN to Bills table
2. **Repository Layer**: Bill data is extracted and added to Job entity
3. **Use Case Layer**: No changes needed (passes through)
4. **API Response**: Job JSON includes `billTotalAmount` and `billPaidAmount`
5. **Frontend Display**: React component renders the amounts with proper formatting

## Display Logic

### Total Amount Column
- If `billTotalAmount` is not null/undefined: Display formatted amount
- Otherwise: Display "-" (no bill generated yet)

### Paid Amount Column
- If `billTotalAmount` exists: Display formatted `billPaidAmount` (defaults to 0.00)
- Otherwise: Display "-" (no bill generated yet)

## Currency Formatting
Both columns use JavaScript's `toLocaleString()` with:
- Locale: `en-US`
- Minimum fraction digits: 2
- Maximum fraction digits: 2
- Prefix: "LKR " (Sri Lankan Rupees)

Example: `LKR 150,000.00`

## Testing Checklist

### Backend Testing
- [ ] Verify SQL query returns correct bill data
- [ ] Test with jobs that have bills
- [ ] Test with jobs that don't have bills
- [ ] Test with Waff Clerk role (filtered jobs)
- [ ] Test with Admin/Manager roles (all jobs)

### Frontend Testing
- [ ] Verify columns appear in correct order
- [ ] Check currency formatting is correct
- [ ] Test with jobs that have bills
- [ ] Test with jobs without bills (should show "-")
- [ ] Test responsive design on mobile devices
- [ ] Verify expanded details still work correctly
- [ ] Check colspan is correct for both user roles

## Deployment Instructions

### Backend Deployment
```bash
# Rebuild backend container
docker compose build --no-cache backend

# Restart backend
docker compose up -d backend
```

### Frontend Deployment
```bash
# Build frontend (already done)
cd frontend
npm run build

# Copy to backend public folder (already done)
# Files copied to: backend-api/public/

# Commit and push changes
git add .
git commit -m "Add Total Amount and Paid Amount columns to Job Management"
git push

# Rebuild both containers on server
docker compose build --no-cache
docker compose up -d
```

### Post-Deployment
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh the Job Management page
3. Verify new columns appear correctly
4. Test with different job statuses and bill states

## Notes

- Uses LEFT JOIN to ensure jobs without bills are still displayed
- Bill data is read-only in the Jobs table (edit via Billing section)
- Amount columns are always visible (not role-restricted)
- Maintains backward compatibility with existing job data
- No database schema changes required (uses existing Bills table)

## Related Files
- `backend-api/src/domain/entities/Job.js`
- `backend-api/src/infrastructure/repositories/MSSQLJobRepository.js`
- `backend-api/src/application/use-cases/job/GetAllJobs.js` (no changes)
- `frontend/src/components/Jobs.js`
- `frontend/src/styles/Jobs.css`

## Date Implemented
May 5, 2026
