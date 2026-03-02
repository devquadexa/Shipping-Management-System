# 🚀 How to Run Super Shine Cargo Service System

Complete step-by-step guide to run the system on your Windows machine.

---

## ✅ Prerequisites Check

Before starting, make sure you have:

1. **Node.js** installed (v14 or higher)
   ```powershell
   node --version
   # Should show: v14.x.x or higher
   ```

2. **SQL Server Express** running
   - Port: 53181
   - Database: SuperShineCargoDb
   - User: SUPER_SHINE_CARGO
   - Password: 1234SuperShineDB

3. **Database Setup Complete**
   - All tables created (Users, Customers, Jobs, Bills, PettyCash, etc.)
   - Default user created (superadmin / admin123)

---

## 📂 Step 1: Navigate to Project Folder

```powershell
cd "D:\Work and Learn\Quadexa\Shipping Management System"
```

---

## 🔧 Step 2: Install Backend Dependencies

```powershell
# Go to backend folder
cd backend-api

# Install dependencies
npm install

# Wait for installation to complete...
```

**Expected output:**
```
added 150 packages in 30s
```

---

## 🔧 Step 3: Install Frontend Dependencies

```powershell
# Go back to root
cd ..

# Go to frontend folder
cd frontend

# Install dependencies
npm install

# Wait for installation to complete...
```

**Expected output:**
```
added 1500 packages in 60s
```

---

## ⚙️ Step 4: Verify Environment Files

### Backend .env file

```powershell
# Check if .env exists
cd ../backend-api
Get-Content .env
```

**Should contain:**
```env
PORT=5000
NODE_ENV=development

DB_SERVER=localhost
DB_PORT=53181
DB_DATABASE=SuperShineCargoDb
DB_USER=SUPER_SHINE_CARGO
DB_PASSWORD=1234SuperShineDB
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=super_shine_cargo_secret_key_2024
JWT_EXPIRES_IN=7d
```

### Frontend .env file

```powershell
# Check if .env exists
cd ../frontend
Get-Content .env
```

**Should contain:**
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 🚀 Step 5: Start the Backend Server

Open **PowerShell Terminal 1**:

```powershell
# Navigate to backend folder
cd "D:\Work and Learn\Quadexa\Shipping Management System\backend-api"

# Start the backend server
npm start
```

**Expected output:**
```
📊 Database Configuration:
   Server: localhost:53181
   Database: SuperShineCargoDb
   User: SUPER_SHINE_CARGO
   Password: ****************
   Encrypt: false
✅ Connected to MSSQL database
🏗️  Clean Architecture initialized
🚀 Server running on port 5000
📐 Architecture: Clean Architecture + SOLID
🔗 API: http://localhost:5000
```

**✅ Backend is running!** Keep this terminal open.

---

## 🎨 Step 6: Start the Frontend Application

Open **PowerShell Terminal 2** (new terminal):

```powershell
# Navigate to frontend folder
cd "D:\Work and Learn\Quadexa\Shipping Management System\frontend"

# Start the frontend server
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

**✅ Frontend is running!** Your browser should automatically open to http://localhost:3000

---

## 🔐 Step 7: Login to the System

1. **Browser opens automatically** to http://localhost:3000
2. **Login page appears** with navy blue theme
3. **Enter credentials:**
   - Username: `superadmin`
   - Password: `admin123`
4. **Click "Login"**

**✅ You should see the Dashboard!**

---

## 🎯 Step 8: Test the System

### Test Customers Module
1. Click **"Customers"** in the navigation bar
2. Click **"Add Customer"** button
3. Fill in customer details:
   - Name: Test Customer
   - Email: test@example.com
   - Phone: 0771234567
   - Address: 123 Test St, Colombo
4. Click **"Add Customer"**
5. **✅ Customer should appear in the list**

### Test Jobs Module
1. Click **"Jobs"** in the navigation bar
2. Click **"Create Job"** button
3. Fill in job details:
   - Customer: Select from dropdown
   - Description: Ship cargo to Dubai
   - Origin: Colombo
   - Destination: Dubai
   - Weight: 500
   - Shipping Cost: 50000
4. Click **"Create Job"**
5. **✅ Job should appear in the list**

### Test Billing Module
1. Click **"Billing"** in the navigation bar
2. Click **"Create Bill"** button
3. Fill in bill details:
   - Job: Select from dropdown
   - Customer: Select from dropdown
   - Amount: 50000
4. Click **"Create Bill"**
5. **✅ Bill should appear with tax calculated (10%)**

### Test Petty Cash Module
1. Click **"Petty Cash"** in the navigation bar
2. Click **"Add Entry"** button
3. Fill in entry details:
   - Description: Office supplies
   - Amount: 5000
   - Type: Expense
4. Click **"Add Entry"**
5. **✅ Entry should appear and balance should update**

---

## 🛑 How to Stop the System

### Stop Frontend
In **Terminal 2** (frontend):
```powershell
# Press Ctrl + C
# Confirm: Y
```

### Stop Backend
In **Terminal 1** (backend):
```powershell
# Press Ctrl + C
# Confirm: Y
```

---

## 🔄 How to Restart the System

Just repeat Steps 5 and 6:

**Terminal 1 - Backend:**
```powershell
cd "D:\Work and Learn\Quadexa\Shipping Management System\backend-api"
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd "D:\Work and Learn\Quadexa\Shipping Management System\frontend"
npm start
```

---

## 📱 Access from Mobile Device

If you want to test on your mobile phone:

1. **Find your computer's IP address:**
   ```powershell
   ipconfig
   # Look for IPv4 Address: 192.168.1.x
   ```

2. **Update frontend .env:**
   ```env
   REACT_APP_API_URL=http://192.168.1.x:5000
   ```

3. **Restart frontend**

4. **On your phone's browser, go to:**
   ```
   http://192.168.1.x:3000
   ```

---

## ❌ Troubleshooting

### Problem: Backend won't start

**Error:** `Missing required environment variables`

**Solution:**
```powershell
# Check if .env file exists
cd backend-api
Test-Path .env
# Should return: True

# If False, create .env file with the content from Step 4
```

---

### Problem: Database connection failed

**Error:** `Database connection failed: ConnectionError`

**Solution:**
1. Check SQL Server is running:
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*SQL*"}
   ```

2. Verify database credentials in `.env` file

3. Test database connection:
   ```powershell
   # In SQL Server Management Studio
   # Server: localhost,53181
   # Login: SUPER_SHINE_CARGO
   # Password: 1234SuperShineDB
   ```

---

### Problem: Frontend shows "Network Error"

**Error:** `Network Error` or `Cannot connect to backend`

**Solution:**
1. Make sure backend is running (Terminal 1)
2. Check backend URL in `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```
3. Restart frontend after changing .env

---

### Problem: Port already in use

**Error:** `Port 5000 is already in use`

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in backend-api/.env
PORT=5001
```

---

### Problem: Login fails

**Error:** `Invalid credentials` or `User not found`

**Solution:**
1. Check database has default user:
   ```sql
   SELECT * FROM Users WHERE Username = 'superadmin'
   ```

2. If user doesn't exist, run the database setup script again

3. Try these credentials:
   - Username: `superadmin`
   - Password: `admin123`

---

## 📊 System URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | User interface |
| Backend API | http://localhost:5000 | REST API |
| API Health | http://localhost:5000/ | Check if API is running |

---

## 🎓 Quick Commands Reference

```powershell
# Start Backend
cd backend-api
npm start

# Start Frontend
cd frontend
npm start

# Install Dependencies
npm install

# Check Node version
node --version

# Check npm version
npm --version

# View backend logs
# Just look at Terminal 1

# View frontend logs
# Just look at Terminal 2
```

---

## ✅ Success Checklist

- [ ] Node.js installed and working
- [ ] SQL Server running on port 53181
- [ ] Database SuperShineCargoDb exists
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend .env file configured
- [ ] Frontend .env file configured
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login with superadmin/admin123
- [ ] Can create customers
- [ ] Can create jobs
- [ ] Can create bills
- [ ] Can add petty cash entries

---

## 🎉 You're All Set!

Your Super Shine Cargo Service system is now running!

**Next Steps:**
- Explore all features
- Create test data
- Test on mobile devices
- Review [CLEAN_ARCHITECTURE_COMPLETE.md](CLEAN_ARCHITECTURE_COMPLETE.md) to understand the code
- Check [DEPLOYMENT.md](DEPLOYMENT.md) when ready for production

---

**Need Help?**
- Check [TESTING_CLEAN_ARCHITECTURE.md](TESTING_CLEAN_ARCHITECTURE.md) for API testing
- Review [DATABASE_SETUP.md](DATABASE_SETUP.md) for database issues
- Read [README.md](README.md) for complete documentation

---

**Happy Shipping! 🚢**
