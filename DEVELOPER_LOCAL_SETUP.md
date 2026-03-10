# Developer Setup Guide - Local Database

## 🚀 Quick Setup for Your Own Local Database

You will set up SQL Server and the database on your own laptop. This takes about 15 minutes.

---

## 📋 What You Need

- Windows PC/Laptop
- Admin rights to install software
- Internet connection (for downloads)

---

## Step 1: Install SQL Server Express (5 minutes)

### Download and Install

1. **Download SQL Server Express:**
   - Go to: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Click **"Download now"** under "Express"
   - Run the downloaded file

2. **Installation:**
   - Choose **"Basic"** installation type
   - Accept license terms
   - Click **"Install"**
   - Wait for installation to complete (3-5 minutes)
   - Note the server name shown (usually `YOUR_COMPUTER_NAME\SQLEXPRESS`)
   - Click **"Close"**

---

## Step 2: Install SQL Server Management Studio (3 minutes)

### Download and Install SSMS

1. **Download SSMS:**
   - Go to: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
   - Click **"Download SQL Server Management Studio (SSMS)"**
   - Run the downloaded file

2. **Installation:**
   - Click **"Install"**
   - Wait for installation (2-3 minutes)
   - Click **"Close"**
   - Restart your computer if prompted

---

## Step 3: Enable TCP/IP Protocol (2 minutes)

### Configure SQL Server

1. **Open SQL Server Configuration Manager:**
   - Press `Win + R`
   - Type: `SQLServerManager15.msc` (or search for "SQL Server Configuration Manager")
   - Press Enter

2. **Enable TCP/IP:**
   - Expand **"SQL Server Network Configuration"**
   - Click **"Protocols for SQLEXPRESS"**
   - Right-click **"TCP/IP"** → Select **"Enable"**
   - Click **"OK"** on the warning message

3. **Set Port Number:**
   - Right-click **"TCP/IP"** again → **"Properties"**
   - Go to **"IP Addresses"** tab
   - Scroll to the bottom to **"IPAll"** section
   - Set **"TCP Port"** to: `1433`
   - Click **"OK"**

4. **Restart SQL Server:**
   - In Configuration Manager, click **"SQL Server Services"** (left panel)
   - Right-click **"SQL Server (SQLEXPRESS)"**
   - Click **"Restart"**
   - Wait for it to restart (shows "Running")

---

## Step 4: Create Database (2 minutes)

### Run the Setup Script

1. **Open SQL Server Management Studio (SSMS)**
   - Search for "SSMS" in Start menu
   - Open it

2. **Connect to SQL Server:**
   - Server name: `localhost\SQLEXPRESS` (or just `localhost`)
   - Authentication: **Windows Authentication**
   - Click **"Connect"**

3. **Open the Setup Script:**
   - Click **"File"** → **"Open"** → **"File"**
   - Navigate to your project folder
   - Go to: `backend-api/src/config/`
   - Select: **`COMPLETE_DATABASE_SETUP.sql`**
   - Click **"Open"**

4. **Run the Script:**
   - Press **F5** or click **"Execute"** button (green play icon)
   - Wait for completion (10-20 seconds)
   - You should see success messages in the results panel

**Expected Output:**
```
✓ Login created: SUPER_SHINE_CARGO
✓ Database created: SuperShineCargoDb
✓ User created and permissions granted
✓ Table created: Categories
✓ Table created: Users
... (more tables)
✓ Super Admin user created
Database Setup Completed Successfully!
```

---

## Step 5: Configure Application (2 minutes)

### Update .env File

1. **Navigate to backend folder:**
   - Open your project in VS Code or file explorer
   - Go to: `backend-api` folder

2. **Create .env file:**
   - Copy `.env.example` and rename to `.env`
   - Or create new file named `.env`

3. **Edit .env file with these settings:**

```env
# Database Configuration - Local Setup
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=SuperShineCargoDb
DB_USER=SUPER_SHINE_CARGO
DB_PASSWORD=SuperShine@2024
DB_ENCRYPT=false

# Server Configuration
PORT=5000

# JWT Secret (you can change this)
JWT_SECRET=my-super-secret-jwt-key-for-development

# Node Environment
NODE_ENV=development
```

**Important:** 
- `DB_SERVER=localhost` (not an IP address)
- `DB_PORT=1433` (default SQL Server port)
- `DB_ENCRYPT=false` (required for local development)

4. **Save the file**

---

## Step 6: Install and Run Application (3 minutes)

### Backend Setup

1. **Open terminal in backend-api folder:**
   ```bash
   cd backend-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   (This takes 1-2 minutes)

3. **Test database connection:**
   ```bash
   node src/config/database.js
   ```

   **Expected Output:**
   ```
   ✅ Connected to MSSQL database
   ```

4. **Start backend server:**
   ```bash
   node src/index.js
   ```

   **Expected Output:**
   ```
   🚀 Server running on port 5000
   📐 Architecture: Clean Architecture + SOLID
   🔗 API: http://localhost:5000
   ✅ Connected to MSSQL database
   ✅ Database connected successfully
   ```

   **Keep this terminal open!**

### Frontend Setup

1. **Open NEW terminal in frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   (This takes 1-2 minutes)

3. **Start frontend:**
   ```bash
   npm start
   ```

   **Browser automatically opens to:** `http://localhost:3000`

---

## Step 7: Login and Test (1 minute)

### Access the Application

1. **Browser opens automatically** to `http://localhost:3000`

2. **Login with default credentials:**
   - **Username:** `admin`
   - **Password:** `admin123`

3. **Verify everything works:**
   - ✅ Dashboard loads
   - ✅ Can navigate to Customers
   - ✅ Can navigate to Jobs
   - ✅ Can navigate to Invoicing
   - ✅ Can navigate to Petty Cash
   - ✅ Can navigate to Accounting (Super Admin only)
   - ✅ Can navigate to Users (Super Admin only)

---

## ✅ Success Checklist

After setup, verify:

- [ ] SQL Server Express installed
- [ ] SSMS installed
- [ ] TCP/IP enabled on port 1433
- [ ] Database `SuperShineCargoDb` created
- [ ] Can connect to database in SSMS
- [ ] `.env` file configured correctly
- [ ] Backend connects to database successfully
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can login with admin/admin123
- [ ] All pages load without errors

---

## 🆘 Troubleshooting

### "Cannot connect to database"

**Check 1: Is SQL Server running?**
- Open Services (Win + R → `services.msc`)
- Find "SQL Server (SQLEXPRESS)"
- Status should be "Running"
- If not, right-click → Start

**Check 2: Is TCP/IP enabled?**
- Open SQL Server Configuration Manager
- Check TCP/IP is enabled
- Check port is set to 1433
- Restart SQL Server service

**Check 3: Is .env file correct?**
```env
DB_SERVER=localhost
DB_PORT=1433
DB_ENCRYPT=false
```

### "Login failed for user"

**Solution:** Run the database setup script again in SSMS.

### "Port 5000 already in use"

**Solution:** Kill the process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### "Port 3000 already in use"

**Solution:** React will automatically ask to use a different port. Press `Y` to accept.

---

## 📊 Verify Database in SSMS

To see your database structure:

1. **Open SSMS**
2. **Connect to:** `localhost\SQLEXPRESS`
3. **Expand:** Databases → SuperShineCargoDb → Tables
4. **You should see 10 tables:**
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

## 🔐 Default Users

The setup script creates one Super Admin user:

**Super Admin:**
- Username: `admin`
- Password: `admin123`

**You can create more users** through the Users page after logging in.

**User Roles:**
- **Super Admin** - Full access (including Users and Accounting)
- **Admin** - Operational management (no Users or Accounting)
- **Manager** - Customer, Jobs, Invoicing, Petty Cash
- **User** - Limited access (assigned jobs only)

---

## 💡 Development Tips

### Working with the Database

**View data in SSMS:**
```sql
USE SuperShineCargoDb;
GO

-- View all users
SELECT * FROM Users;

-- View all customers
SELECT * FROM Customers;

-- View all jobs
SELECT * FROM Jobs;
```

### Resetting the Database

If you need to start fresh:

1. In SSMS, right-click `SuperShineCargoDb` → Delete
2. Run `COMPLETE_DATABASE_SETUP.sql` again
3. Everything will be recreated

### Backup Your Database

Before making major changes:

1. In SSMS, right-click `SuperShineCargoDb`
2. Tasks → Back Up
3. Choose location and click OK

---

## 🎯 Next Steps

1. ✅ **Setup complete!** You now have a fully functional local environment
2. 📚 **Read the code** - Familiarize yourself with the project structure
3. 🔨 **Start developing** - Create your feature branch and start coding
4. 🧪 **Test your changes** - Use your local database to test
5. 📤 **Commit to Git** - Push your code changes (not the database)

---

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all steps were completed
3. Check error messages in terminal
4. Contact the team lead
5. Review the detailed documentation:
   - `SETUP_GUIDE.md`
   - `DATABASE_SETUP.md`
   - `DEVELOPER_ONBOARDING.md`

---

## 🎉 You're All Set!

Your local development environment is ready. Happy coding! 🚀

**Remember:**
- Your database is on YOUR laptop only
- Changes you make don't affect others
- Commit code changes to Git
- Test freely without worrying about breaking things
