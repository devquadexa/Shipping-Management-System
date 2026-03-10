# Drop and Recreate Database - Instructions

## Problem
When trying to drop the database, you get error: "database currently in use"

## Solution

### Option 1: Use the Safe Drop Script (Recommended)

I've created a script that automatically closes all connections before dropping:

**File:** `backend-api/src/config/DROP_DATABASE_SAFELY.sql`

**Steps:**
1. **Stop your backend server** (Ctrl+C in terminal)
2. Open **SQL Server Management Studio (SSMS)**
3. Connect to your SQL Server
4. Open file: `backend-api/src/config/DROP_DATABASE_SAFELY.sql`
5. Click **Execute** (F5)

This script will:
- Close all active connections to the database
- Drop the database safely
- Show success message

---

### Option 2: Manual Steps

If you prefer to do it manually:

#### Step 1: Stop Backend Server
```bash
# In your terminal where backend is running:
# Press Ctrl+C to stop the server
```

#### Step 2: Close All SSMS Windows
- Close any query windows that are connected to `SuperShineCargoDb`
- Close any Object Explorer connections to that database

#### Step 3: Run Drop Script
```sql
USE master;
GO

-- Close all connections
ALTER DATABASE SuperShineCargoDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- Drop database
DROP DATABASE SuperShineCargoDb;
GO
```

---

## After Dropping Database

### Step 1: Create Fresh Database

Run the complete setup script:

**File:** `backend-api/src/config/COMPLETE_DATABASE_SETUP.sql`

1. In SSMS, open: `backend-api/src/config/COMPLETE_DATABASE_SETUP.sql`
2. Click **Execute** (F5)
3. Wait for completion (should show "Database Setup Completed Successfully!")

### Step 2: Update .env File

Make sure your `backend-api/.env` file has:

```env
DB_SERVER=localhost
DB_DATABASE=SuperShineCargoDb
DB_USER=SUPER_SHINE_CARGO
DB_PASSWORD=SuperShine@2024
DB_PORT=1433
```

**Note:** Change `DB_PORT` to your SQL Server port if different (check SQL Server Configuration Manager)

### Step 3: Test Database Connection

```bash
cd backend-api
node src/config/database.js
```

Should show: "Database connected successfully"

### Step 4: Start Backend Server

```bash
cd backend-api
node src/index.js
```

Should show: "Server running on port 5000"

### Step 5: Test the System

1. Open frontend: `http://localhost:3000`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Test creating:
   - A customer
   - A user with Manager role
   - A job
   - View Settings > Pay Item Templates (should show 10 items)

---

## Alternative: Fix Without Dropping

If you don't want to drop the database, use this script instead:

**File:** `backend-api/src/config/FIX_WITHOUT_DROP.sql`

This will:
- Keep all your existing data
- Fix all structure issues
- Create missing tables
- No need to drop database

**Steps:**
1. Stop backend server
2. In SSMS, open: `backend-api/src/config/FIX_WITHOUT_DROP.sql`
3. Execute (F5)
4. Restart backend server

---

## Troubleshooting

### Error: "Cannot drop database because it is currently in use"

**Solution:**
1. Stop backend server (Ctrl+C)
2. Close all SSMS query windows
3. Use `DROP_DATABASE_SAFELY.sql` script
4. Or run manually:
   ```sql
   USE master;
   ALTER DATABASE SuperShineCargoDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
   DROP DATABASE SuperShineCargoDb;
   ```

### Error: "Login failed for user 'SUPER_SHINE_CARGO'"

**Solution:**
The login doesn't exist yet. Run `COMPLETE_DATABASE_SETUP.sql` which creates it.

### Error: "Cannot open database requested by the login"

**Solution:**
Database doesn't exist. Run `COMPLETE_DATABASE_SETUP.sql` to create it.

---

## Summary

**To drop and recreate (fresh start):**
1. Stop backend server
2. Run: `DROP_DATABASE_SAFELY.sql`
3. Run: `COMPLETE_DATABASE_SETUP.sql`
4. Update `.env` file
5. Start backend server

**To fix without dropping (keep data):**
1. Stop backend server
2. Run: `FIX_WITHOUT_DROP.sql`
3. Start backend server

Choose the approach that works best for you!
