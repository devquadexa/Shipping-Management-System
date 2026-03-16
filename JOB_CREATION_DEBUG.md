# Job Creation 400 Error - Debugging Guide

## Issue
Job creation is failing with a 400 Bad Request error.

## What Was Done
Added comprehensive logging to the JobController.create() method to help debug the issue.

## How to Debug

### Step 1: Try Creating a Job
1. Go to Jobs page
2. Click "+ New Job" button
3. Fill in the form:
   - **Customer**: Select a customer (required)
   - **Shipment Category**: Select a category (required)
   - **Open Date**: Select a date (required)
   - Other fields are optional
4. Click "Create Job"
5. Check the browser console for the error

### Step 2: Check Backend Logs
Look for these log messages in the backend console:

```
=== CREATE JOB START ===
create - req.body: { customerId: '...', shipmentCategory: '...', ... }
create - req.user: { userId: '...', role: '...', ... }
create - jobData: { customerId: '...', shipmentCategory: '...', ... }
```

### Step 3: Identify the Error
The logs will show one of these:

**If customerId is missing:**
```
create - Missing customerId
```

**If shipmentCategory is missing:**
```
create - Missing shipmentCategory
```

**If validation fails:**
```
Create job error: Validation failed: [error message]
```

**If database error:**
```
Create job error: [database error message]
```

## Common Issues and Solutions

### Issue 1: Missing customerId
**Symptom**: Logs show "create - Missing customerId"
**Cause**: Customer dropdown not selected
**Solution**: Select a customer from the dropdown before submitting

### Issue 2: Missing shipmentCategory
**Symptom**: Logs show "create - Missing shipmentCategory"
**Cause**: Shipment Category dropdown not selected
**Solution**: Select a shipment category from the dropdown before submitting

### Issue 3: Missing openDate
**Symptom**: Logs show validation error about openDate
**Cause**: Open Date field not filled
**Solution**: Select a date in the Open Date field before submitting

### Issue 4: Customer not found
**Symptom**: Logs show "Customer not found"
**Cause**: Selected customer doesn't exist in database
**Solution**: Verify customer exists in Customers page

### Issue 5: Database error
**Symptom**: Logs show database error
**Cause**: Database connection issue or schema problem
**Solution**: Check database connection and verify Jobs table exists

## Backend Logging Details

The create() method now logs:

1. **Request Start**: `=== CREATE JOB START ===`
2. **Request Body**: All data sent from frontend
3. **User Info**: Who is making the request
4. **Processed Data**: Data after processing
5. **Validation**: Any validation errors
6. **Job Creation**: Success or failure
7. **User Assignment**: If users are being assigned
8. **Request End**: `=== CREATE JOB END ===`

## How to Read the Logs

### Successful Creation
```
=== CREATE JOB START ===
create - req.body: { customerId: 'CUST001', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
create - req.user: { userId: 'ADMIN001', role: 'Admin', ... }
create - jobData: { customerId: 'CUST001', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
create - job created: { jobId: 'JOB0007', customerId: 'CUST001', ... }
=== CREATE JOB END ===
```

### Failed Creation - Missing Field
```
=== CREATE JOB START ===
create - req.body: { customerId: '', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
create - req.user: { userId: 'ADMIN001', role: 'Admin', ... }
create - jobData: { customerId: '', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
create - Missing customerId
=== CREATE JOB END (with error) ===
```

### Failed Creation - Validation Error
```
=== CREATE JOB START ===
create - req.body: { customerId: 'CUST001', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
create - req.user: { userId: 'ADMIN001', role: 'Admin', ... }
create - jobData: { customerId: 'CUST001', shipmentCategory: 'TIEP', openDate: '2026-03-12', ... }
Create job error: Validation failed: Customer not found
Error stack: [stack trace]
=== CREATE JOB END (with error) ===
```

## Next Steps

1. Try creating a job
2. Check the backend logs
3. Identify which error message appears
4. Apply the corresponding solution
5. Try again

## Files Modified

- `backend-api/src/presentation/controllers/JobController.js` - Added logging to create() method

## Backend Status

✅ Running on port 5000
✅ Database connected
✅ Logging enabled

Ready for testing!
