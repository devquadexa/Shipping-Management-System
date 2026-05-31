# Transporter Payment NULL TransporterId Fix

## Problem
When attempting to record a transporter payment, the system threw an error:
```
Cannot insert the value NULL into column 'TransporterId', table 'SuperShineCargoDb.dbo.TransporterPayments'; 
column does not allow nulls. INSERT fails.
```

## Root Cause
The job object in the database only stores the transporter **name** (in the `Transporter` field), not the transporter **ID**. The payment creation code was trying to use `job.transporterId` which was undefined/null.

## Solution Implemented

### 1. Added `findByName()` Method to Transporter Repository
**File**: `backend-api/src/infrastructure/repositories/MSSQLTransporterRepository.js`

```javascript
async findByName(name) {
  await this.ensureTableExists();
  const pool = await this.db();

  const result = await pool.request()
    .input('name', this.sql.NVarChar, name)
    .query('SELECT * FROM Transporters WHERE name = @name AND isActive = 1');

  if (result.recordset.length === 0) {
    return null;
  }

  return this.mapToEntity(result.recordset[0]);
}
```

This method looks up a transporter by name and returns the full transporter object including the ID.

### 2. Updated CreateTransporterPayment Use Case
**File**: `backend-api/src/application/use-cases/transporter/CreateTransporterPayment.js`

- Added `transporterRepository` as a dependency
- Added logic to look up the transporter ID from the transporter name:
  ```javascript
  // Get transporter ID from transporter name
  let transporterId = null;
  if (job.transporter) {
    const transporter = await this.transporterRepository.findByName(job.transporter);
    if (transporter) {
      transporterId = transporter.transporterId;
    }
  }

  if (!transporterId) {
    throw new Error('Transporter not found for this job');
  }
  ```

### 3. Updated Routes to Pass TransporterRepository
**File**: `backend-api/src/presentation/routes/transporters.js`

- Imported `MSSQLTransporterRepository`
- Instantiated the repository
- Passed it to the `CreateTransporterPayment` use case

## How It Works Now

### Before (Broken)
```
Job has: { transporter: "ABC Transport", transporterId: undefined }
  ↓
CreateTransporterPayment tries to use job.transporterId
  ↓
NULL value inserted into TransporterPayments.TransporterId
  ↓
Database error: Cannot insert NULL
```

### After (Fixed)
```
Job has: { transporter: "ABC Transport", transporterId: undefined }
  ↓
CreateTransporterPayment calls transporterRepository.findByName("ABC Transport")
  ↓
Repository queries: SELECT * FROM Transporters WHERE name = "ABC Transport"
  ↓
Returns: { transporterId: "TRN0001", name: "ABC Transport", ... }
  ↓
Uses transporterId: "TRN0001" for payment record
  ↓
Payment inserted successfully with valid TransporterId
```

## Testing

To verify the fix works:

1. Navigate to Transporters section
2. Select a job with transporter cost
3. Click "Pay Transporter Cost"
4. Enter payment details
5. Submit payment
6. Verify:
   - No NULL error
   - Payment record created in TransporterPayments table
   - Payment appears in payment history

## Files Modified

1. ✅ `backend-api/src/infrastructure/repositories/MSSQLTransporterRepository.js`
   - Added `findByName()` method

2. ✅ `backend-api/src/application/use-cases/transporter/CreateTransporterPayment.js`
   - Added `transporterRepository` dependency
   - Added transporter lookup logic
   - Added validation for transporter not found

3. ✅ `backend-api/src/presentation/routes/transporters.js`
   - Imported `MSSQLTransporterRepository`
   - Instantiated repository
   - Passed to use case

## Error Handling

The system now provides clear error messages:
- "Transporter not found for this job" - if the transporter name doesn't match any active transporter
- "Job not found" - if the job ID is invalid
- "No transporter cost found for this job" - if the job has no transporter cost pay item

## Database Integrity

The TransporterPayments table now always has a valid TransporterId because:
1. The transporter name is looked up in the Transporters table
2. Only active transporters are matched
3. An error is thrown if no match is found
4. The payment is only created if a valid transporterId is obtained
