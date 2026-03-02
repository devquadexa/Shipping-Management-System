# MSSQL Database Setup Guide

## Prerequisites

1. **Microsoft SQL Server** installed (SQL Server 2016 or later)
   - SQL Server Express (Free): https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Or SQL Server Developer Edition (Free)

2. **SQL Server Management Studio (SSMS)** - Optional but recommended
   - Download: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

## Step 1: Configure Database Connection

1. Open the `.env` file in the project root directory

2. Update the database credentials:
   ```env
   DB_USER=your_sql_username
   DB_PASSWORD=your_sql_password
   DB_SERVER=localhost
   DB_NAME=SuperShineCargoDb
   ```

### Common Configurations:

**For SQL Server with Windows Authentication:**
```env
DB_USER=your_windows_username
DB_PASSWORD=your_windows_password
DB_SERVER=localhost
DB_NAME=SuperShineCargoDb
```

**For SQL Server with SQL Authentication:**
```env
DB_USER=sa
DB_PASSWORD=YourStrongPassword123
DB_SERVER=localhost
DB_NAME=SuperShineCargoDb
```

**For SQL Server on a different machine:**
```env
DB_USER=sa
DB_PASSWORD=YourPassword
DB_SERVER=192.168.1.100
DB_NAME=SuperShineCargoDb
```

**For SQL Server with instance name:**
```env
DB_USER=sa
DB_PASSWORD=YourPassword
DB_SERVER=localhost\\SQLEXPRESS
DB_NAME=SuperShineCargoDb
```

## Step 2: Create Database and Tables

### Option A: Using SQL Server Management Studio (SSMS)

1. Open SSMS and connect to your SQL Server instance

2. Click **File** → **Open** → **File**

3. Navigate to and open: `server/config/init-database.sql`

4. Click **Execute** (or press F5)

5. Verify the database was created:
   - Expand **Databases** in Object Explorer
   - You should see **SuperShineCargoDb**

### Option B: Using Command Line (sqlcmd)

```bash
sqlcmd -S localhost -U sa -P YourPassword -i server/config/init-database.sql
```

### Option C: Using Azure Data Studio

1. Open Azure Data Studio

2. Connect to your SQL Server

3. Open the file `server/config/init-database.sql`

4. Click **Run** or press F5

## Step 3: Verify Database Setup

Run this query to verify all tables were created:

```sql
USE SuperShineCargoDb;
GO

SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

You should see these tables:
- Bills
- Customers
- Jobs
- PayItems
- PettyCash
- PettyCashBalance
- Users

## Step 4: Verify Default User

Check if the default Super Admin user was created:

```sql
USE SuperShineCargoDb;
GO

SELECT UserId, Username, FullName, Role, Email 
FROM Users;
```

You should see:
- UserId: USER0001
- Username: superadmin
- Password: admin123
- Role: Super Admin

## Step 5: Install Node.js Dependencies

```bash
npm install
```

This will install the required packages including:
- `mssql` - SQL Server driver
- `dotenv` - Environment variable management

## Step 6: Start the Application

```bash
npm run dev
```

Or run separately:

**Terminal 1 (Backend):**
```bash
node server/index.js
```

**Terminal 2 (Frontend):**
```bash
cd client
npm start
```

## Step 7: Test the Connection

1. When the backend starts, you should see:
   ```
   Connected to MSSQL database
   Server running on port 5000
   ```

2. Open browser to http://localhost:3000

3. Login with:
   - Username: `superadmin`
   - Password: `admin123`

## Troubleshooting

### Error: "Login failed for user"

**Solution:**
1. Verify your username and password in `.env`
2. Check if SQL Server Authentication is enabled:
   - In SSMS, right-click server → Properties → Security
   - Select "SQL Server and Windows Authentication mode"
   - Restart SQL Server service

### Error: "Cannot connect to server"

**Solution:**
1. Verify SQL Server is running:
   ```bash
   # Windows
   services.msc
   # Look for "SQL Server (MSSQLSERVER)" or "SQL Server (SQLEXPRESS)"
   ```

2. Check if TCP/IP is enabled:
   - Open SQL Server Configuration Manager
   - SQL Server Network Configuration → Protocols
   - Enable TCP/IP
   - Restart SQL Server

### Error: "Database does not exist"

**Solution:**
Run the init-database.sql script again to create the database.

### Error: "Connection timeout"

**Solution:**
1. Check firewall settings
2. Verify SQL Server is listening on port 1433
3. If using named instance, ensure SQL Server Browser service is running

### Error: "Self-signed certificate"

**Solution:**
The connection config already has `trustServerCertificate: true`. If still having issues, check your SQL Server SSL configuration.

## Database Schema Overview

### Users Table
- Stores user accounts (Super Admin, Admin, User)
- Default Super Admin created automatically

### Customers Table
- Customer information and contact details

### Jobs Table
- Shipping jobs with origin, destination, weight, cost
- Links to customers and assigned users
- Tracks job status

### PayItems Table
- Additional expenses for jobs
- Linked to specific jobs

### Bills Table
- Invoices generated for jobs
- Includes tax calculation
- Payment status tracking

### PettyCash Table
- Income and expense entries
- Can be linked to specific jobs
- Tracks who created each entry

### PettyCashBalance Table
- Maintains current petty cash balance
- Single row table (Id always = 1)

## Backup and Restore

### Create Backup

```sql
BACKUP DATABASE SuperShineCargoDb
TO DISK = 'C:\Backup\SuperShineCargoDb.bak'
WITH FORMAT, MEDIANAME = 'SuperShineBackup';
```

### Restore Backup

```sql
RESTORE DATABASE SuperShineCargoDb
FROM DISK = 'C:\Backup\SuperShineCargoDb.bak'
WITH REPLACE;
```

## Security Recommendations

1. **Change Default Password:**
   - After first login, create a new Super Admin with a strong password
   - Delete or disable the default superadmin account

2. **Use Strong Database Password:**
   - Update the DB_PASSWORD in `.env` with a strong password
   - Never commit `.env` file to version control

3. **Restrict Database Access:**
   - Create a dedicated database user with limited permissions
   - Don't use 'sa' account in production

4. **Enable SSL/TLS:**
   - Configure SQL Server to use encrypted connections
   - Update connection config to enforce encryption

## Production Deployment

For production deployment:

1. Use environment variables instead of `.env` file
2. Enable SQL Server encryption
3. Use connection pooling (already configured)
4. Set up regular database backups
5. Monitor database performance
6. Use a dedicated database server
7. Implement proper error logging

## Support

For issues or questions:
- Check SQL Server error logs
- Review application logs in console
- Verify network connectivity
- Check SQL Server configuration
