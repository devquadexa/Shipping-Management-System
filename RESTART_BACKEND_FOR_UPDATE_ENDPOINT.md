# Restart Backend - Update Job Endpoint Added

## What Was Added

I've added a new endpoint to update job details:

**Endpoint**: `PUT /api/jobs/:id`

**Purpose**: Update job fields like BL Number, CUSDEC Number, LC Number, Container Number, Transporter

## Files Modified

### Backend
1. **`backend-api/src/application/use-cases/job/UpdateJob.js`** (NEW)
   - Use case for updating job details

2. **`backend-api/src/infrastructure/repositories/MSSQLJobRepository.js`**
   - Updated `update()` method to include Transporter field

3. **`backend-api/src/infrastructure/di/container.js`**
   - Registered `UpdateJob` use case

4. **`backend-api/src/presentation/controllers/JobController.js`**
   - Added `update()` controller method
   - Updated constructor to accept `updateJob` use case

5. **`backend-api/src/presentation/routes/jobs.js`**
   - Added `PUT /:id` route
   - Updated controller initialization

## How to Restart Backend

### Step 1: Stop Current Backend
Find the terminal where backend is running and press **Ctrl+C**

### Step 2: Start Backend Again
```bash
cd backend-api
npm run dev
```

### Step 3: Wait for Confirmation
You should see:
```
Server running on port 5000
Connected to SQL Server
```

## Test the Update

After restarting:

1. Go to Jobs section
2. Find a job (e.g., JOB0002)
3. Click Edit
4. Fill in the required fields:
   - BL Number
   - CUSDEC Number
   - LC Number
   - Container Number
   - Transporter (if field exists)
5. Click Update/Save
6. ✅ Should save successfully
7. Go to Invoicing section
8. Select the same job
9. ✅ All fields should now show values
10. Click "Generate Invoice"
11. ✅ Should work without validation error

## API Details

### Request
```
PUT /api/jobs/JOB0002
Authorization: Bearer <token>
Content-Type: application/json

{
  "blNumber": "BL-2024-001",
  "cusdecNumber": "CUS-2024-001",
  "lcNumber": "LC-2024-001",
  "containerNumber": "CONT-2024-001",
  "transporter": "ABC Transport",
  "exporter": "XYZ Exports",
  "status": "Open"
}
```

### Response
```json
{
  "jobId": "JOB0002",
  "blNumber": "BL-2024-001",
  "cusdecNumber": "CUS-2024-001",
  "lcNumber": "LC-2024-001",
  "containerNumber": "CONT-2024-001",
  "transporter": "ABC Transport",
  ...
}
```

## Status
🔴 **BACKEND RESTART REQUIRED** - The new endpoint won't work until backend is restarted

After restart:
✅ **READY** - Job update endpoint will be available
