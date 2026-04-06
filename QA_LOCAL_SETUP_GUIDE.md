# Super Shine Cargo Service - QA Local Setup Guide

This guide will help you set up the Super Shine Cargo Service system on a local Windows laptop without Docker, using a local MSSQL database.

---

## Prerequisites

Before starting, ensure you have the following installed:

### 1. Node.js (v16 or higher)
- Download from: https://nodejs.org/
- Choose the LTS (Long Term Support) version
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### 2. Microsoft SQL Server Express (or Developer Edition)
- Download SQL Server Express from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Download SQL Server Management Studio (SSMS) from: https://aka.ms/ssmsfullsetup
- During installation:
  - Choose "Basic" installation type
  - Note down the server name (usually `localhost\SQLEXPRESS` or just `localhost`)
  - Enable SQL Server Authentication (Mixed Mode)
  - Set a strong SA password

### 3. Git (Optional but recommended)
- Download from: https://git-scm.com/download/win
- Or download the project as a ZIP file

---

## Step 1: Get the Project Files

### Option A: Using Git
```bash
git clone <repository-url>
cd super-shine-cargo
```

### Option B: Download ZIP
1. Download the project ZIP file
2. Extract to a folder (e.g., `C:\Projects\super-shine-cargo`)
3. Open Command Prompt or PowerShell in that folder

---

## Step 2: Database Setup

### 2.1 Start SQL Server
1. Open **SQL Server Configuration Manager**
2. Ensure **SQL Server (SQLEXPRESS)** service is running
3. If not, right-click and select "Start"

### 2.2 Connect to SQL Server
1. Open **SQL Server Management Studio (SSMS)**
2. Connect with these details:
   - Server name: `localhost\SQLEXPRESS` (or `localhost`)
   - Authentication: SQL Server Authentication
   - Login: `sa`
   - Password: (the password you set during installation)

### 2.3 Create Database User (Recommended)
Run this SQL script in SSMS:

```sql
-- Create a login for the application
CREATE LOGIN SUPER_SHINE_CARGO WITH PASSWORD = '1234SuperShineDB';
GO

-- Create the database
CREATE DATABASE SuperShineCargoDb;
GO

-- Switch to the database
USE SuperShineCargoDb;
GO

-- Create a user and grant permissions
CREATE USER SUPER_SHINE_CARGO FOR LOGIN SUPER_SHINE_CARGO;
GO

ALTER ROLE db_owner ADD MEMBER SUPER_SHINE_CARGO;
GO
```

### 2.4 Initialize Database Schema
1. In SSMS, open the file: `server/config/init-database.sql`
2. Make sure you're connected to the `SuperShineCargoDb` database
3. Click "Execute" or press F5
4. You should see: "Database schema created successfully!"

### 2.5 Verify Database Setup
Run this query to verify:
```sql
USE SuperShineCargoDb;
GO

SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';
```

You should see these tables:
- Users
- Customers
- Jobs
- PayItems
- Bills
- PettyCash
- PettyCashBalance

---

## Step 3: Backend API Setup

### 3.1 Navigate to Backend Folder
```bash
cd backend-api
```

### 3.2 Install Dependencies
```bash
npm install
```

This will install all required packages (Express, MSSQL, JWT, etc.)

### 3.3 Configure Environment Variables
1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` file in a text editor and update these values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_SERVER=localhost\SQLEXPRESS
DB_PORT=1433
DB_DATABASE=SuperShineCargoDb
DB_USER=SUPER_SHINE_CARGO
DB_PASSWORD=1234SuperShineDB
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

**Important Notes:**
- If your SQL Server instance name is different, update `DB_SERVER`
- If you used `sa` account instead, update `DB_USER` and `DB_PASSWORD`
- The default SQL Server port is 1433, but if you're using a named instance like `SQLEXPRESS`, you might not need to specify the port

### 3.4 Test Database Connection
Create a test file `test-db.js` in the `backend-api` folder:

```javascript
require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

async function testConnection() {
  try {
    await sql.connect(config);
    console.log('✅ Database connection successful!');
    const result = await sql.query('SELECT @@VERSION as version');
    console.log('SQL Server Version:', result.recordset[0].version);
    await sql.close();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

testConnection();
```

Run the test:
```bash
node test-db.js
```

You should see: "✅ Database connection successful!"

### 3.5 Start the Backend Server
```bash
npm run dev
```

You should see:
```
Server running on port 5000
Database connected successfully
```

**Keep this terminal window open!** The backend server needs to keep running.

---

## Step 4: Frontend Setup

### 4.1 Open a New Terminal
Open a new Command Prompt or PowerShell window (keep the backend running in the first one)

### 4.2 Navigate to Frontend Folder
```bash
cd frontend
```

### 4.3 Install Dependencies
```bash
npm install
```

This will install React and all required packages.

### 4.4 Configure API URL (if needed)
The frontend is configured to connect to `http://localhost:5000` by default.

If you need to change this, look for API configuration in:
- `frontend/src/config.js` (if it exists)
- Or search for `localhost:5000` in the frontend code

### 4.5 Start the Frontend Development Server
```bash
npm start
```

The application should automatically open in your browser at:
```
http://localhost:3000
```

---

## Step 5: Login and Test

### 5.1 Default Login Credentials
```
Username: superadmin
Password: admin123
Role: Super Admin
```

### 5.2 Test Basic Functionality
1. **Login**: Use the credentials above
2. **Dashboard**: You should see the main dashboard
3. **Customers**: Try adding a test customer
4. **Jobs**: Try creating a test job
5. **Billing**: Test the billing functionality
6. **Petty Cash**: Test petty cash management

---

## Troubleshooting

### Issue: Backend won't start - "Login failed for user"
**Solution:**
1. Verify SQL Server is running
2. Check username and password in `.env` file
3. Try connecting with SSMS using the same credentials
4. Make sure the user has permissions on the database

### Issue: Backend won't start - "Cannot find module"
**Solution:**
```bash
cd backend-api
npm install
```

### Issue: Frontend won't start - Port 3000 already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or just use a different port
set PORT=3001 && npm start
```

### Issue: Frontend can't connect to backend
**Solution:**
1. Make sure backend is running on port 5000
2. Check browser console for errors
3. Verify CORS is enabled in backend
4. Try accessing `http://localhost:5000/api/auth/me` directly in browser

### Issue: SQL Server connection timeout
**Solution:**
1. Check if SQL Server Browser service is running
2. Enable TCP/IP protocol in SQL Server Configuration Manager
3. Restart SQL Server service
4. Check Windows Firewall settings

### Issue: "Cannot connect to SQL Server"
**Solution:**
1. Verify SQL Server instance name:
   ```bash
   # In PowerShell
   Get-Service | Where-Object {$_.Name -like "*SQL*"}
   ```
2. Update `DB_SERVER` in `.env` accordingly
3. For named instances, use format: `localhost\INSTANCENAME`

---

## Port Configuration Summary

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend | 3000 | http://localhost:3000 |
| SQL Server | 1433 | localhost\SQLEXPRESS |

---

## Stopping the Application

### Stop Frontend
- Press `Ctrl + C` in the frontend terminal
- Type `Y` when asked to terminate

### Stop Backend
- Press `Ctrl + C` in the backend terminal
- Type `Y` when asked to terminate

---

## Starting the Application (After Initial Setup)

### Every time you want to run the application:

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend-api
   npm run dev
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

3. **Open Browser**:
   - Navigate to http://localhost:3000
   - Login with: superadmin / admin123

---

## Additional Notes for QA Testing

### Creating Test Users
Login as superadmin and create test users with different roles:
- **Admin**: Full access except user management
- **Manager**: Can manage jobs and billing
- **Waff Clerk**: Limited access to assigned jobs and petty cash

### Test Data
The database starts empty except for the superadmin user. You'll need to create:
1. Test customers
2. Test jobs
3. Test pay items
4. Test bills

### Database Backup (Recommended)
After creating test data, backup the database:
1. In SSMS, right-click `SuperShineCargoDb`
2. Tasks → Back Up
3. Save the backup file for future use

### Resetting Database
To start fresh:
1. In SSMS, delete the database
2. Re-run the `init-database.sql` script
3. Restart the backend server

---

## Getting Help

If you encounter issues:
1. Check the terminal/console for error messages
2. Check browser Developer Tools (F12) → Console tab
3. Verify all services are running
4. Check the `.env` configuration
5. Contact the development team with:
   - Error messages
   - Screenshots
   - Steps to reproduce the issue

---

## System Requirements

- **OS**: Windows 10/11
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 2GB free space
- **CPU**: Any modern processor
- **Browser**: Chrome, Firefox, or Edge (latest version)

---

## Quick Reference Commands

```bash
# Backend
cd backend-api
npm install          # Install dependencies
npm run dev          # Start development server
node test-db.js      # Test database connection

# Frontend
cd frontend
npm install          # Install dependencies
npm start            # Start development server
npm run build        # Build for production

# Database
# Use SSMS to run SQL scripts
# Connection: localhost\SQLEXPRESS
# Database: SuperShineCargoDb
```

---

**Setup Complete!** 🎉

You should now have a fully functional local development environment for QA testing.
