# Super Shine Cargo Service - Developer Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Default Users](#default-users)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **SQL Server Express** (2019 or higher) - [Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- **SQL Server Management Studio (SSMS)** - [Download](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- **Git** - [Download](https://git-scm.com/)

---

## Database Setup

### Step 1: Install SQL Server Express

1. Download and install SQL Server Express 2019 or later
2. During installation:
   - Choose "Basic" installation type
   - Note down the server name (usually `localhost\SQLEXPRESS` or `YOUR_COMPUTER_NAME\SQLEXPRESS`)
   - Enable SQL Server Authentication (Mixed Mode)
   - Set a strong SA password

### Step 2: Enable TCP/IP Protocol

1. Open **SQL Server Configuration Manager**
2. Navigate to: `SQL Server Network Configuration` → `Protocols for SQLEXPRESS`
3. Right-click on **TCP/IP** and select **Enable**
4. Right-click on **TCP/IP** again and select **Properties**
5. Go to the **IP Addresses** tab
6. Scroll to **IPAll** section at the bottom
7. Set **TCP Port** to `1433` (or any available port, e.g., `53181`)
8. Click **OK**
9. Restart SQL Server service:
   - Go to `SQL Server Services`
   - Right-click on `SQL Server (SQLEXPRESS)`
   - Select **Restart**

### Step 3: Create Database User

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your SQL Server instance:
   - Server name: `localhost,1433` (or your port number)
   - Authentication: SQL Server Authentication
   - Login: `sa`
   - Password: (your SA password)

3. Run the following SQL script to create the database user:

```sql
-- Create Login
CREATE LOGIN SUPER_SHINE_CARGO 
WITH PASSWORD = 'SuperShine@2024',
CHECK_POLICY = OFF;
GO

-- Create Database
CREATE DATABASE SuperShineCargoDb;
GO

-- Use the database
USE SuperShineCargoDb;
GO

-- Create User
CREATE USER SUPER_SHINE_CARGO FOR LOGIN SUPER_SHINE_CARGO;
GO

-- Grant permissions
ALTER ROLE db_owner ADD MEMBER SUPER_SHINE_CARGO;
GO

PRINT 'Database user created successfully!';
```

### Step 4: Initialize Database Schema

1. Navigate to the backend config folder:
   ```bash
   cd backend-api/src/config
   ```

2. Run the initialization scripts in order:

**Option A: Using SSMS (Recommended)**
- Open SSMS and connect to your database
- Open and execute each SQL file in this order:
  1. `init-database.sql` - Creates all tables
  2. `add-contact-person-fields.sql` - Adds contact person fields
  3. `add-credit-period-and-invoice-tracking.sql` - Adds invoice tracking
  4. `add-pay-items-settings.sql` - Adds pay items
  5. `add-petty-cash-workflow.sql` - Adds petty cash workflow
  6. `update-job-status-constraint.sql` - Updates job status
  7. `update-existing-jobs-petty-cash-status.sql` - Updates existing jobs
  8. `add-manager-role.sql` - Adds Manager role

**Option B: Using Command Line**
```bash
# From backend-api/src/config directory
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "init-database.sql"
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "add-contact-person-fields.sql"
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "add-credit-period-and-invoice-tracking.sql"
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "add-pay-items-settings.sql"
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "add-petty-cash-workflow.sql"
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "update-job-status-constraint.sql"
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "update-existing-jobs-petty-cash-status.sql"
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -i "add-manager-role.sql"
```

Note: If you get SSL/TLS errors, add `-C` flag to trust the server certificate:
```bash
sqlcmd -S "localhost,1433" -U "SUPER_SHINE_CARGO" -P "SuperShine@2024" -d "SuperShineCargoDb" -C -i "init-database.sql"
```

### Step 5: Verify Database Setup

Run this query in SSMS to verify all tables are created:

```sql
USE SuperShineCargoDb;
GO

SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO
```

You should see these tables:
- Bills
- Categories
- ContactPersons
- Customers
- Jobs
- PayItemTemplates
- PettyCashAssignments
- PettyCashEntries
- PettyCashSettlementItems
- Users

---

## Backend Setup

### Step 1: Clone the Repository

```bash
git clone <your-github-repo-url>
cd <repository-name>
```

### Step 2: Install Backend Dependencies

```bash
cd backend-api
npm install
```

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit the `.env` file with your database configuration:

```env
# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=SuperShineCargoDb
DB_USER=SUPER_SHINE_CARGO
DB_PASSWORD=SuperShine@2024
DB_ENCRYPT=false

# Server Configuration
PORT=5000

# JWT Secret (change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=development
```

**Important Notes:**
- Change `DB_PORT` to match your SQL Server port (e.g., 53181)
- Change `JWT_SECRET` to a random secure string
- If using a different computer name, update `DB_SERVER` accordingly

### Step 4: Test Database Connection

```bash
node src/config/database.js
```

You should see: `✅ Connected to MSSQL database`

---

## Frontend Setup

### Step 1: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 2: Configure API Endpoint (Optional)

If your backend runs on a different port, update the API base URL in:
- `frontend/src/api/client.js`

Default is `http://localhost:5000`

---

## Running the Application

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend-api
node src/index.js
```

You should see:
```
🚀 Server running on port 5000
📐 Architecture: Clean Architecture + SOLID
🔗 API: http://localhost:5000
✅ Database connected successfully
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will open at `http://localhost:3000`

### Option 2: Using PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend-api
pm2 start src/index.js --name "cargo-backend"

# Start frontend
cd ../frontend
pm2 start npm --name "cargo-frontend" -- start

# View logs
pm2 logs

# Stop all
pm2 stop all
```

---

## Default Users

After database initialization, you need to create the first Super Admin user:

### Create Super Admin User

1. Open SSMS and connect to your database
2. Run this SQL script:

```sql
USE SuperShineCargoDb;
GO

-- Insert Super Admin user
INSERT INTO Users (userId, username, password, fullName, email, role, createdDate, isActive)
VALUES 
('SA_001', 'admin', 'admin123', 'System Administrator', 'admin@supershine.lk', 'Super Admin', GETDATE(), 1);
GO

PRINT 'Super Admin user created successfully!';
PRINT 'Username: admin';
PRINT 'Password: admin123';
```

### Login Credentials

**Super Admin:**
- Username: `admin`
- Password: `admin123`

**Important:** Change the password immediately after first login!

### User Roles

The system has 4 user roles:

1. **Super Admin** - Full system access including:
   - User management
   - Accounting dashboard
   - All operational features

2. **Admin** - Operational management:
   - Customer management
   - Job management
   - Invoicing
   - Petty cash
   - Settings

3. **Manager** - Operational access:
   - Customer management (add, view, edit)
   - Job management
   - Invoicing
   - Petty cash assignments
   - No access to Accounting or Users

4. **User** - Limited access:
   - View assigned jobs
   - Manage own petty cash settlements
   - View customers

---

## Troubleshooting

### Database Connection Issues

**Error: "Login failed for user"**
- Verify SQL Server Authentication is enabled (Mixed Mode)
- Check username and password in `.env` file
- Ensure the user has proper permissions

**Error: "Cannot connect to server"**
- Verify SQL Server service is running
- Check TCP/IP protocol is enabled
- Verify port number is correct
- Check Windows Firewall settings

**Error: "SSL Provider: The certificate chain was issued by an authority that is not trusted"**
- Set `DB_ENCRYPT=false` in `.env` file
- Or use `-C` flag with sqlcmd to trust certificate

### Backend Issues

**Error: "Missing required environment variables"**
- Ensure `.env` file exists in `backend-api` folder
- Verify all required variables are set

**Port already in use:**
```bash
# Windows - Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### Frontend Issues

**Error: "Cannot connect to backend"**
- Verify backend is running on port 5000
- Check API base URL in `frontend/src/api/client.js`

**Port 3000 already in use:**
- The frontend will automatically prompt to use a different port
- Or manually kill the process using port 3000

---

## Project Structure

```
super-shine-cargo/
├── backend-api/
│   ├── src/
│   │   ├── application/        # Use cases (business logic)
│   │   ├── domain/             # Entities and interfaces
│   │   ├── infrastructure/     # Repositories and external services
│   │   ├── presentation/       # Controllers and routes
│   │   ├── middleware/         # Authentication middleware
│   │   └── config/             # Database configuration and migrations
│   ├── .env                    # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/               # API services
│   │   ├── components/        # React components
│   │   ├── context/           # React context (Auth)
│   │   └── styles/            # CSS files
│   └── package.json
│
└── README.md
```

---

## Additional Resources

- **SQL Server Documentation:** https://docs.microsoft.com/en-us/sql/
- **Node.js Documentation:** https://nodejs.org/docs/
- **React Documentation:** https://react.dev/

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review error logs in the console
3. Contact the development team

---

## Security Notes

⚠️ **Important Security Reminders:**

1. Change default passwords immediately
2. Use strong JWT_SECRET in production
3. Enable HTTPS in production
4. Never commit `.env` files to Git
5. Regularly update dependencies
6. Use environment-specific configurations

---

**Last Updated:** March 2026
**Version:** 2.0.0
