# Sync Job Payment Status

## Problem
Some jobs are showing status as "Pending Payment" on the job page, but their corresponding invoices show status as "Paid" in the billing section. This is a data synchronization issue.

## Solution
Run the synchronization script to update all job statuses based on their actual bill payment status.

## How to Run

### Option 1: On Local Machine (Development)

1. Navigate to the backend directory:
```bash
cd backend-api
```

2. Run the sync script:
```bash
node sync-job-payment-status.js
```

3. The script will:
   - Connect to the database
   - Find all jobs with bills
   - Check if job status matches bill payment status
   - Update mismatched job statuses
   - Show a summary of changes

### Option 2: On Production Server

1. SSH into the production server:
```bash
ssh root@srv1507052.hstgr.cloud
```

2. Navigate to the project directory:
```bash
cd ~/Shipping-Management-System/backend-api
```

3. Run the sync script:
```bash
node sync-job-payment-status.js
```

### Option 3: Inside Docker Container

1. SSH into the production server:
```bash
ssh root@srv1507052.hstgr.cloud
```

2. Execute the script inside the backend container:
```bash
docker exec cargo_backend node sync-job-payment-status.js
```

## What the Script Does

The script synchronizes job statuses based on bill payment status:

| Bill Payment Status | Job Status (After Sync) |
|---------------------|-------------------------|
| Paid                | Payment Collected       |
| Partially Paid      | Partially Paid          |
| Unpaid              | Pending Payment         |

## Expected Output

```
🔄 Connecting to database...
✅ Connected to database

📊 Found 25 jobs with bills

🔧 Updating Job JOB0001:
   Current Status: Pending Payment
   Bill Status: Paid
   New Status: Payment Collected
   Invoice: INV-2026-001
   ✅ Updated

🔧 Updating Job JOB0005:
   Current Status: Pending Payment
   Bill Status: Paid
   New Status: Payment Collected
   Invoice: INV-2026-005
   ✅ Updated

📈 Summary:
   Total jobs processed: 25
   ✅ Updated: 8
   ⏭️  Skipped (already correct): 17

✅ Synchronization complete!

🔌 Database connection closed
```

## When to Run This Script

- After discovering mismatches between job status and bill payment status
- After manually updating bill payment status in the database
- As a one-time fix for historical data
- Periodically as a maintenance task (optional)

## Note

This is a **safe operation** - it only updates job statuses to match their corresponding bill payment status. It does not modify any bill data or payment records.

## Future Prevention

The issue has been fixed in the code:
- `MarkBillAsPaid` use case now updates job status to "Payment Collected"
- `ApplyPartialPayment` use case now updates job status to "Partially Paid" or "Payment Collected"

New payments will automatically keep job status in sync with bill payment status.
