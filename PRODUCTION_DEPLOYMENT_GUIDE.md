# Production Deployment Guide

## Overview
This guide covers deploying all recent changes to the production environment at `https://supershinecargo.cloud`

---

## Changes to Deploy

### 1. Payment Details Feature (Task 1)
- Database migration for payment tracking
- Backend: Bill entity, repository, use case, controller updates
- Frontend: Payment modal UI with validation

### 2. ESLint Warnings Fixed (Task 2)
- Fixed React Hook warnings in Jobs.js, PettyCash.js, Settings.js

### 3. Payment Details Display (Task 3)
- Payment information in expanded invoice view

### 4. Container Number Conditional Display (Task 4)
- Container field hidden for vehicle shipments

### 5. Amount Column Alignment (Task 5)
- Right-aligned amount columns

### 6. Waff Clerk Settlement Edit/Delete (Task 6)
- Edit and delete settlement items before invoice generation
- Backend routes, controller, repository methods

### 7. Container Number Validation Fix (NEW)
- Skip container number requirement for vehicle shipments during invoice generation

---

## Pre-Deployment Checklist

- [ ] All code changes committed to Git
- [ ] Database migration file ready
- [ ] Backup current production database
- [ ] Backup current Docker containers
- [ ] Note current container IDs

---

## Deployment Steps

### Step 1: Backup Production Database

```bash
# SSH into production server
ssh user@72.61.169.242

# Backup database
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P 'YourPassword' \
  -Q "BACKUP DATABASE SuperShineCargoDb TO DISK = '/var/opt/mssql/backup/SuperShineCargoDb_$(date +%Y%m%d_%H%M%S).bak'"

# Verify backup created
docker exec cargo_db ls -lh /var/opt/mssql/backup/
```

### Step 2: Pull Latest Code

```bash
# Navigate to project directory
cd /path/to/Shipping\ Management\ System/

# Pull latest changes from Git
git pull origin main

# Or if you're pushing from local:
# On your local machine:
git add .
git commit -m "Deploy: Payment features, settlement edit/delete, container validation fix"
git push origin main

# Then on production server:
git pull origin main
```

### Step 3: Run Database Migration

```bash
# Copy migration file to database container
docker cp backend-api/src/config/ADD_PAYMENT_DETAILS_TO_BILLS.sql cargo_db:/tmp/

# Execute migration
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P 'YourPassword' \
  -d SuperShineCargoDb \
  -i /tmp/ADD_PAYMENT_DETAILS_TO_BILLS.sql

# Verify columns added
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P 'YourPassword' \
  -d SuperShineCargoDb \
  -Q "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bills' AND COLUMN_NAME IN ('paymentMethod', 'chequeNumber', 'chequeDate', 'chequeAmount', 'bankName', 'paidDate')"
```

### Step 4: Rebuild and Restart Backend

```bash
# Navigate to backend directory
cd backend-api

# Install any new dependencies (if package.json changed)
npm install

# Restart backend container
docker restart cargo_backend

# Wait 10-15 seconds for server to start
sleep 15

# Check backend logs
docker logs cargo_backend --tail 50

# Verify backend is running
curl http://localhost:5000/
# Should return: {"message":"Super Shine Cargo Service API","architecture":"Clean Architecture","version":"2.0.0"}
```

### Step 5: Rebuild and Restart Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install any new dependencies (if package.json changed)
npm install

# Build production bundle
npm run build

# Restart frontend container
docker restart cargo_frontend

# Wait 10-15 seconds for server to start
sleep 15

# Check frontend logs
docker logs cargo_frontend --tail 50
```

### Step 6: Verify Deployment

```bash
# Check all containers are running
docker ps | grep cargo

# Should see:
# cargo_db       - Up
# cargo_backend  - Up
# cargo_frontend - Up

# Check backend health
curl http://localhost:5000/api/auth/health || curl http://localhost:5000/

# Check frontend is serving
curl http://localhost:3000/ | head -20
```

---

## Post-Deployment Testing

### Test 1: Payment Details Feature
1. Navigate to Billing section
2. Select a job with generated invoice
3. Click "Mark as Paid"
4. Enter payment details (Cash/Cheque/Bank Transfer)
5. Verify payment details appear in expanded invoice view

### Test 2: Container Number Validation
1. Create or edit a job with "Vehicle - Personal" or "Vehicle - Company"
2. Fill all required fields EXCEPT Container Number
3. Try to generate invoice
4. Should succeed without requiring Container Number

### Test 3: Waff Clerk Settlement Edit/Delete
1. Login as Waff Clerk
2. Navigate to Petty Cash section
3. Find a settlement with status "Settled" (no invoice generated)
4. Click "View Details"
5. Verify edit (✏️) and delete (🗑️) buttons appear
6. Test editing an item
7. Test deleting an item
8. Verify totals recalculate correctly

### Test 4: Amount Alignment
1. Navigate to Billing section
2. Expand any invoice
3. Verify all amount columns are right-aligned

### Test 5: Payment Display
1. Mark an invoice as paid with payment details
2. Expand the invoice
3. Verify payment information section appears with:
   - Payment method badge (color-coded)
   - Payment date
   - Cheque details (if applicable)
   - Bank name (if applicable)

---

## Rollback Plan (If Issues Occur)

### Rollback Database
```bash
# Restore from backup
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P 'YourPassword' \
  -Q "RESTORE DATABASE SuperShineCargoDb FROM DISK = '/var/opt/mssql/backup/SuperShineCargoDb_YYYYMMDD_HHMMSS.bak' WITH REPLACE"
```

### Rollback Code
```bash
# Revert to previous commit
git log --oneline -10  # Find previous commit hash
git reset --hard <previous-commit-hash>

# Restart containers
docker restart cargo_backend cargo_frontend
```

### Rollback Containers
```bash
# If you have previous container images
docker stop cargo_backend cargo_frontend
docker rm cargo_backend cargo_frontend

# Recreate from previous images
docker run -d --name cargo_backend <previous-image>
docker run -d --name cargo_frontend <previous-image>
```

---

## Troubleshooting

### Issue: Backend not starting
```bash
# Check logs
docker logs cargo_backend

# Common issues:
# - Database connection failed: Check DB credentials in .env
# - Port already in use: Check if another process is using port 5000
# - Syntax errors: Check recent code changes
```

### Issue: Frontend not loading
```bash
# Check logs
docker logs cargo_frontend

# Common issues:
# - Build failed: Check for syntax errors in React components
# - API connection failed: Verify backend is running
# - Port conflict: Check if port 3000 is available
```

### Issue: Database migration failed
```bash
# Check if columns already exist
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P 'YourPassword' \
  -d SuperShineCargoDb \
  -Q "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bills'"

# If columns exist, migration already ran - safe to continue
```

### Issue: 404 on new routes
```bash
# Verify backend restarted
docker ps | grep cargo_backend

# Check if routes are registered
docker logs cargo_backend | grep "Clean Architecture initialized"

# Force restart
docker stop cargo_backend
docker start cargo_backend
```

---

## Environment Variables to Verify

### Backend (.env)
```env
DB_SERVER=72.61.169.242,1433
DB_USER=SA
DB_PASSWORD=YourPassword
DB_NAME=SuperShineCargoDb
PORT=5000
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
# or for production:
REACT_APP_API_URL=https://supershinecargo.cloud/api
```

---

## Docker Commands Reference

```bash
# View all containers
docker ps -a

# View container logs
docker logs <container-name>
docker logs <container-name> --tail 100
docker logs <container-name> -f  # Follow logs

# Restart container
docker restart <container-name>

# Stop container
docker stop <container-name>

# Start container
docker start <container-name>

# Remove container
docker rm <container-name>

# Execute command in container
docker exec <container-name> <command>

# Copy file to container
docker cp <local-file> <container-name>:<container-path>

# Copy file from container
docker cp <container-name>:<container-path> <local-file>
```

---

## Success Criteria

Deployment is successful when:
- ✅ All 3 Docker containers are running
- ✅ Backend responds to health check
- ✅ Frontend loads without errors
- ✅ Database migration completed
- ✅ Payment details feature works
- ✅ Container validation works for vehicle shipments
- ✅ Settlement edit/delete works for Waff Clerks
- ✅ No console errors in browser
- ✅ No errors in backend logs

---

## Support Contacts

- **Database Issues**: Check Docker logs and SQL Server error messages
- **Backend Issues**: Check Node.js logs in cargo_backend container
- **Frontend Issues**: Check browser console and cargo_frontend logs

---

## Deployment Timeline

Estimated time: 15-30 minutes

1. Backup: 5 minutes
2. Code pull: 2 minutes
3. Database migration: 2 minutes
4. Backend restart: 3 minutes
5. Frontend rebuild: 5-10 minutes
6. Testing: 10 minutes

---

## Notes

- Always backup before deployment
- Test in staging environment first (if available)
- Deploy during low-traffic hours
- Have rollback plan ready
- Monitor logs after deployment
- Keep backup for at least 7 days

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Backup Location**: _____________
**Status**: _____________
