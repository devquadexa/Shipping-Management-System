# Testing Clean Architecture Implementation

## Quick Start

### 1. Start the Backend
```powershell
cd backend-api
node src/index-clean.js
```

Expected output:
```
✅ Database connected successfully
🏗️  Clean Architecture initialized
🚀 Server running on port 5000
📐 Architecture: Clean Architecture + SOLID
🔗 API: http://localhost:5000
```

### 2. Start the Frontend
```powershell
cd frontend
npm start
```

### 3. Test the Application

#### Login
- Username: `superadmin`
- Password: `admin123`

#### Test Each Module
1. **Customers** - Create, view, update, delete customers
2. **Jobs** - Create jobs, assign to users, update status, add pay items
3. **Billing** - Create bills, mark as paid
4. **Petty Cash** - Add income/expense entries, view balance

---

## API Testing with PowerShell

### Test Authentication
```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body (@{username="superadmin"; password="admin123"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

### Test Customers
```powershell
# Create Customer
$headers = @{Authorization = "Bearer $token"}
$customer = @{
    name = "Test Customer"
    email = "test@example.com"
    phone = "0771234567"
    address = "123 Test St, Colombo"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/customers" -Method POST -Headers $headers -Body $customer -ContentType "application/json"

# Get All Customers
Invoke-RestMethod -Uri "http://localhost:5000/api/customers" -Method GET -Headers $headers
```

### Test Jobs
```powershell
# Create Job
$job = @{
    customerId = "CUST0001"
    description = "Ship cargo to Dubai"
    origin = "Colombo"
    destination = "Dubai"
    weight = 500
    shippingCost = 50000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/jobs" -Method POST -Headers $headers -Body $job -ContentType "application/json"

# Get All Jobs
Invoke-RestMethod -Uri "http://localhost:5000/api/jobs" -Method GET -Headers $headers
```

### Test Billing
```powershell
# Create Bill
$bill = @{
    jobId = "JOB0001"
    customerId = "CUST0001"
    amount = 50000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/billing" -Method POST -Headers $headers -Body $bill -ContentType "application/json"

# Get All Bills
Invoke-RestMethod -Uri "http://localhost:5000/api/billing" -Method GET -Headers $headers
```

### Test Petty Cash
```powershell
# Create Entry
$entry = @{
    description = "Office supplies"
    amount = 5000
    entryType = "Expense"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/petty-cash" -Method POST -Headers $headers -Body $entry -ContentType "application/json"

# Get Balance
Invoke-RestMethod -Uri "http://localhost:5000/api/petty-cash/balance" -Method GET -Headers $headers
```

---

## Verification Checklist

### Backend
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] All routes registered
- [ ] No console errors

### Authentication
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Token is returned
- [ ] Protected routes require token

### Customers Module
- [ ] Create customer works
- [ ] Get all customers works
- [ ] Get customer by ID works
- [ ] Update customer works
- [ ] Delete customer works
- [ ] Duplicate email validation works

### Jobs Module
- [ ] Create job works
- [ ] Get all jobs works (filtered by role)
- [ ] Get job by ID works
- [ ] Update job status works
- [ ] Assign job to user works
- [ ] Add pay item works
- [ ] User can only see assigned jobs

### Billing Module
- [ ] Create bill works
- [ ] Tax calculation (10%) works
- [ ] Get all bills works
- [ ] Get bill by ID works
- [ ] Mark bill as paid works

### Petty Cash Module
- [ ] Create income entry works
- [ ] Create expense entry works
- [ ] Balance updates correctly
- [ ] Get all entries works (filtered by role)
- [ ] Get balance works
- [ ] User can only see own entries

### Role-Based Access
- [ ] Super Admin: Full access
- [ ] Admin: Can manage all except users
- [ ] User: Limited to assigned jobs and own petty cash

---

## Common Issues

### Issue: Database Connection Failed
**Solution:**
1. Check SQL Server is running
2. Verify credentials in `.env` file
3. Check port number (default: 53181)

### Issue: Token Invalid
**Solution:**
1. Login again to get new token
2. Check JWT_SECRET in `.env` file

### Issue: 404 Not Found
**Solution:**
1. Verify route path is correct
2. Check server is running on correct port
3. Verify API base URL in frontend

### Issue: 403 Forbidden
**Solution:**
1. Check user role has permission
2. Verify token is valid
3. Check role-based middleware

---

## Performance Testing

### Load Test (Optional)
```powershell
# Install Apache Bench (if not installed)
# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json http://localhost:5000/api/auth/login

# Test get customers endpoint
ab -n 100 -c 10 -H "Authorization: Bearer $token" http://localhost:5000/api/customers
```

---

## Success Criteria

✅ All endpoints respond correctly
✅ Business logic works as expected
✅ Role-based access control works
✅ Database operations succeed
✅ No console errors
✅ Frontend integrates seamlessly
✅ Performance is acceptable

---

## Next Steps After Testing

1. **If all tests pass:**
   - Remove old routes from `src/routes/`
   - Update main `index.js` to use `index-clean.js`
   - Deploy to production

2. **If issues found:**
   - Document the issue
   - Check relevant use case
   - Check repository implementation
   - Fix and retest

3. **Add more tests:**
   - Unit tests for use cases
   - Integration tests for API
   - End-to-end tests

---

**Happy Testing! 🚀**
