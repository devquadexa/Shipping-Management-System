# Test Payment Management Locally

## Step 1: Start Backend Locally

```bash
# Navigate to backend directory
cd backend-api

# Install dependencies (if not already done)
npm install

# Make sure .env file exists with database connection
# Check that DB_SERVER, DB_USER, DB_PASSWORD, DB_NAME are set

# Start backend
npm start
```

**Expected Output:**
```
✅ Database connected successfully
🏗️  Clean Architecture initialized
🚀 Server running on port 5000
📐 Architecture: Clean Architecture + SOLID
🔗 API: http://localhost:5000
```

## Step 2: Test Payment Endpoint

Open a new terminal and test:

```bash
# Test without auth (should return 401)
curl http://localhost:5000/api/payments/all

# Expected: {"message":"Please authenticate"} or similar
```

If you get HTML instead of JSON, the route isn't registered.

## Step 3: Get Auth Token

```bash
# Login to get token (replace with your credentials)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Copy the token from response
```

## Step 4: Test with Auth Token

```bash
# Replace YOUR_TOKEN with actual token
curl http://localhost:5000/api/payments/all \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: [] (empty array if no payments yet)
# or actual payment data if payments exist
```

## Step 5: Start Frontend

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Start frontend
npm start
```

Frontend will open at http://localhost:3000

## Step 6: Test in Browser

1. Go to http://localhost:3000
2. Login as Admin or Super Admin
3. Go to **Accounting → Payment Management**
4. Should load without errors
5. Should show empty state or existing payments

## Troubleshooting

### Backend won't start

**Check database connection:**
```bash
# Make sure SQL Server is running
# Check .env file has correct credentials
```

### "Cannot find module" errors

```bash
cd backend-api
npm install
```

### Payment route returns HTML

**Check backend console for errors:**
- Look for any errors when starting
- Check if paymentRoutes.js has syntax errors

**Verify route is registered:**
```bash
# Check if this line exists in backend-api/src/index.js
grep "paymentRoutes" backend-api/src/index.js
```

### Frontend shows "Error loading payment data"

**Check browser console (F12):**
- Look for the actual error
- Check Network tab for failed requests
- Verify the request URL is correct

**Check backend is running:**
```bash
curl http://localhost:5000/api
# Should return API info
```

### Database table doesn't exist

```bash
# Run the SQL script
# Connect to your local SQL Server and run:
# backend-api/fix-payments-table.sql
```

## Quick Fixes

### Fix 1: Restart Backend
```bash
# Stop backend (Ctrl+C)
# Start again
npm start
```

### Fix 2: Clear Node Cache
```bash
cd backend-api
rm -rf node_modules
npm install
npm start
```

### Fix 3: Check All Files Exist
```bash
# From project root
ls backend-api/src/presentation/routes/paymentRoutes.js
ls backend-api/src/presentation/controllers/PaymentController.js
ls backend-api/src/infrastructure/repositories/MSSQLPaymentRepository.js
ls backend-api/src/application/use-cases/payment/CreatePayment.js
ls backend-api/src/application/use-cases/payment/GetAllPayments.js
ls backend-api/src/application/use-cases/payment/UpdatePaymentStatus.js
ls backend-api/src/domain/entities/Payment.js
ls backend-api/src/domain/repositories/IPaymentRepository.js
```

All should exist.

## Success Indicators

✅ Backend starts without errors  
✅ `curl http://localhost:5000/api/payments/all` returns JSON (not HTML)  
✅ Frontend loads without console errors  
✅ Payment Management page loads  
✅ Shows empty state or payment data  

## Once Local Testing Passes

Then proceed with deployment to production server.
