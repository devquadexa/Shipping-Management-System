# Railway.app Deployment Guide - Complete Setup

Complete step-by-step guide to deploy Super Shine Cargo Service on Railway.app for FREE QA environment.

---

## Railway.app Overview

**Free Tier:**
- $5 credit per month (resets monthly)
- ~500 hours of usage (enough for 24/7 if optimized)
- All databases supported (PostgreSQL, MySQL, MongoDB, Redis)
- Automatic SSL certificates
- Custom domains
- Auto-deploy from GitHub

**Perfect for QA because:**
- ✅ Easy setup (15-20 minutes)
- ✅ Auto-deploy on Git push
- ✅ Free database included
- ✅ Professional URLs
- ✅ No credit card required initially

---

## Prerequisites

1. GitHub account (to sign up)
2. Your project pushed to GitHub repository
3. 20 minutes of time

---

## Part 1: Sign Up and Initial Setup

### Step 1: Create Railway Account

1. Go to: **https://railway.app/**
2. Click "Login" or "Start a New Project"
3. Click "Login with GitHub"
4. Authorize Railway to access your GitHub
5. You'll get $5 free credit (no credit card needed)

### Step 2: Verify Your Account
1. Check your email for verification link
2. Click to verify
3. Return to Railway dashboard

---

## Part 2: Database Setup

### Step 1: Create New Project
1. Click "New Project"
2. Choose "Provision PostgreSQL" (or MySQL if you prefer)
   - **Note**: Railway doesn't offer free MSSQL, so we'll use PostgreSQL
3. Railway creates the database automatically

### Step 2: Note Database Credentials
1. Click on the PostgreSQL service
2. Go to "Variables" tab
3. You'll see these automatically created:
   ```
   DATABASE_URL
   PGHOST
   PGPORT
   PGUSER
   PGPASSWORD
   PGDATABASE
   ```
4. Keep this tab open - you'll need these values

---

## Part 3: Prepare Your Code for Railway

Railway works best with PostgreSQL/MySQL. You have two options:

### Option A: Convert to PostgreSQL (Recommended for Railway)


I can help you convert your MSSQL code to PostgreSQL. The main changes:
- Replace `mssql` package with `pg`
- Update SQL syntax (GETDATE() → NOW(), etc.)
- Adjust connection configuration

### Option B: Use Railway with MSSQL (Paid Add-on)
Railway offers MSSQL but it's not free. Cost: ~$10-15/month

**For this guide, I'll show you Option A (PostgreSQL - FREE)**

---

## Part 4: Deploy Backend API

### Step 1: Add Backend Service
1. In your Railway project, click "New"
2. Choose "GitHub Repo"
3. Select your repository
4. Railway will detect it's a Node.js app

### Step 2: Configure Backend Service
1. Click on the backend service
2. Go to "Settings" tab
3. Configure:
   ```
   Service Name: backend-api
   Root Directory: backend-api
   Start Command: npm start
   ```

### Step 3: Add Environment Variables
1. Go to "Variables" tab
2. Click "New Variable"
3. Add these one by one:


```
PORT=5000
NODE_ENV=production

# Database - Reference the PostgreSQL service
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}

# JWT
JWT_SECRET=your_random_secret_key_change_this
JWT_EXPIRES_IN=7d
```

**Note**: The `${{Postgres.VARIABLE}}` syntax automatically references your database service.

### Step 4: Generate Domain
1. Go to "Settings" tab
2. Scroll to "Networking"
3. Click "Generate Domain"
4. You'll get a URL like: `https://backend-api-production-xxxx.up.railway.app`
5. **Copy this URL** - you'll need it for frontend

### Step 5: Deploy
1. Railway automatically deploys when you configure
2. Go to "Deployments" tab to watch progress
3. Wait 3-5 minutes for build and deployment
4. Check logs for any errors

---

## Part 5: Deploy Frontend

### Step 1: Add Frontend Service
1. In your Railway project, click "New"
2. Choose "GitHub Repo"
3. Select the same repository
4. Railway creates a new service

### Step 2: Configure Frontend Service
1. Click on the frontend service
2. Go to "Settings" tab
3. Configure:

   ```
   Service Name: frontend
   Root Directory: frontend
   Build Command: npm install && npm run build
   Start Command: npx serve -s build -l $PORT
   ```

### Step 3: Add Environment Variables
1. Go to "Variables" tab
2. Add:
   ```
   REACT_APP_API_URL=https://backend-api-production-xxxx.up.railway.app
   ```
   (Use the backend URL from Part 4, Step 4)

### Step 4: Install Serve Package
Add to `frontend/package.json`:
```json
{
  "dependencies": {
    "serve": "^14.2.0"
  }
}
```

Or Railway will install it automatically if you use the start command above.

### Step 5: Generate Domain
1. Go to "Settings" tab
2. Scroll to "Networking"
3. Click "Generate Domain"
4. You'll get: `https://frontend-production-xxxx.up.railway.app`
5. **This is your QA URL!**

---

## Part 6: Initialize Database

### Step 1: Access Railway Database
1. Click on PostgreSQL service
2. Go to "Data" tab
3. Click "Query" to open SQL console

### Step 2: Create Schema


You need to convert your MSSQL schema to PostgreSQL. Here's the converted version:

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    UserId VARCHAR(50) PRIMARY KEY,
    Username VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    FullName VARCHAR(200) NOT NULL,
    Role VARCHAR(50) NOT NULL CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'Waff Clerk', 'User')),
    Email VARCHAR(200) NOT NULL,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    IsActive BOOLEAN DEFAULT TRUE
);

-- Insert default Super Admin (password will be hashed by backend)
INSERT INTO Users (UserId, Username, Password, FullName, Role, Email, CreatedDate)
VALUES ('USER0001', 'superadmin', 'admin123', 'Super Admin', 'Super Admin', 'superadmin@supershine.lk', NOW())
ON CONFLICT (UserId) DO NOTHING;

-- Customers Table
CREATE TABLE IF NOT EXISTS Customers (
    CustomerId VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(200) NOT NULL,
    Phone VARCHAR(50) NOT NULL,
    Email VARCHAR(200) NOT NULL,
    Address VARCHAR(500) NOT NULL,
    RegistrationDate TIMESTAMP DEFAULT NOW(),
    IsActive BOOLEAN DEFAULT TRUE
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS Jobs (
    JobId VARCHAR(50) PRIMARY KEY,
    CustomerId VARCHAR(50) NOT NULL,
    Description VARCHAR(500) NOT NULL,
    Origin VARCHAR(200) NOT NULL,
    Destination VARCHAR(200) NOT NULL,
    ContainerNumber VARCHAR(100),
    ShipmentType VARCHAR(50),
    Weight DECIMAL(10, 2),
    AdvancePayment DECIMAL(10, 2) DEFAULT 0,
    AssignedTo VARCHAR(50),
    Status VARCHAR(50) DEFAULT 'Open',
    PettyCashStatus VARCHAR(50) DEFAULT 'Not Assigned',
    CreatedDate TIMESTAMP DEFAULT NOW(),
    CreatedBy VARCHAR(50) NOT NULL,
    CompletedDate TIMESTAMP,
    FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId),
    FOREIGN KEY (AssignedTo) REFERENCES Users(UserId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

-- Continue with other tables...
-- (I can provide the complete conversion if needed)
```

Paste this in Railway's Query console and execute.

---

## Part 7: Update Backend Code for PostgreSQL

### Step 1: Update package.json


Replace `mssql` with `pg`:
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^17.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.3",
    "node-cron": "^4.2.1"
  }
}
```

### Step 2: Update Database Connection

Create `backend-api/src/config/database-pg.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

**OR** - I can help you create a complete PostgreSQL adapter for your existing code structure.

---

## Part 8: Verify Deployment

### Step 1: Check Backend
1. Go to backend service in Railway
2. Click "Deployments" tab
3. Wait for "Success" status
4. Click "View Logs" to check for errors
5. Test the URL: `https://your-backend.up.railway.app`

### Step 2: Check Frontend
1. Go to frontend service
2. Check deployment status
3. View logs
4. Open the URL: `https://your-frontend.up.railway.app`

### Step 3: Test Application
1. Open frontend URL in browser
2. Try to login with: superadmin / admin123
3. Check browser console for errors
4. Test basic functionality

---

## Part 9: Share with QA Team

### QA Access Information


```
🎯 QA Environment Access

URL: https://your-frontend.up.railway.app

Login Credentials:
Username: superadmin
Password: admin123

Backend API: https://your-backend.up.railway.app
Database: PostgreSQL (managed by Railway)

Status: Active 24/7
Environment: QA/Testing
```

---

## Railway.app - Detailed Walkthrough

Let me give you the EXACT clicks and steps:

### 🚀 Complete Setup (15 Minutes)

#### Minute 1-2: Sign Up
1. Open browser → https://railway.app/
2. Click "Start a New Project" or "Login"
3. Click "Login with GitHub"
4. Click "Authorize Railway"
5. You're in! Dashboard opens.

#### Minute 3-5: Add Database
1. Click "New Project"
2. Click "Provision PostgreSQL"
3. Railway creates database (30 seconds)
4. Click on the PostgreSQL card
5. Go to "Variables" tab
6. You'll see: `DATABASE_URL`, `PGHOST`, `PGPORT`, etc.
7. Leave this tab open

#### Minute 6-10: Deploy Backend
1. Go back to project view
2. Click "New" → "GitHub Repo"
3. If first time: Click "Configure GitHub App"
4. Select your repository
5. Click "Add Repository"
6. Back in Railway, select your repo
7. Railway detects services automatically
8. Click on the backend service (or create new service)
9. Settings:
   - Root Directory: `backend-api`
   - Start Command: `npm start`
10. Go to "Variables" tab
11. Click "New Variable" and add:

    ```
    PORT=5000
    NODE_ENV=production
    DATABASE_URL=${{Postgres.DATABASE_URL}}
    JWT_SECRET=my_super_secret_jwt_key_for_qa_2024
    JWT_EXPIRES_IN=7d
    ```
12. Click "Settings" → "Networking" → "Generate Domain"
13. Copy the domain (e.g., `backend-api-production-abc123.up.railway.app`)
14. Deployment starts automatically!

#### Minute 11-15: Deploy Frontend
1. Click "New" → "GitHub Repo"
2. Select same repository
3. Railway creates another service
4. Click on frontend service
5. Settings:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s build -l $PORT`
6. Go to "Variables" tab
7. Add:
    ```
    REACT_APP_API_URL=https://backend-api-production-abc123.up.railway.app
    ```
    (Use your backend URL from step 13 above)
8. Click "Settings" → "Networking" → "Generate Domain"
9. Copy the domain (e.g., `frontend-production-xyz789.up.railway.app`)
10. Deployment starts!

#### Minute 16-20: Initialize Database & Test
1. Click PostgreSQL service
2. Click "Data" tab
3. Click "Query"
4. Paste your PostgreSQL schema (converted from MSSQL)
5. Click "Run"
6. Open frontend URL in browser
7. Test login!

---

## Important: Database Conversion

Since Railway free tier uses PostgreSQL, you need to convert your MSSQL code.

### Quick Conversion Checklist:

**1. Package Changes:**
```bash
# Remove
npm uninstall mssql

# Add
npm install pg
```

**2. Connection Code:**
```javascript
// OLD (MSSQL)
const sql = require('mssql');
const pool = await sql.connect(config);

// NEW (PostgreSQL)
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**3. Query Syntax:**
```javascript
// OLD (MSSQL)
const result = await pool.request()
  .input('id', sql.VarChar, userId)
  .query('SELECT * FROM Users WHERE UserId = @id');

// NEW (PostgreSQL)
const result = await pool.query(
  'SELECT * FROM Users WHERE UserId = $1',
  [userId]
);
```

**4. SQL Syntax Changes:**
- `GETDATE()` → `NOW()`
- `BIT` → `BOOLEAN`
- `@parameter` → `$1, $2, $3`
- `VARCHAR(MAX)` → `TEXT`
- `IDENTITY(1,1)` → `SERIAL`

---

## Alternative: Railway with MySQL (Closer to MSSQL)

If you prefer MySQL (more similar to MSSQL):

### Step 1: Add MySQL Instead
1. In Railway project, click "New"
2. Choose "Database" → "Add MySQL"
3. Railway provisions MySQL

### Step 2: Update Backend
```bash
npm install mysql2
```

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10
});
```

MySQL syntax is closer to MSSQL, making conversion easier.

---

## Monitoring Your Railway Deployment

### Check Usage
1. Go to Railway dashboard
2. Click "Usage" in sidebar
3. Monitor your $5 credit
4. See estimated hours remaining

### View Logs
1. Click on any service
2. Go to "Deployments" tab
3. Click on latest deployment
4. View real-time logs

### Restart Services
1. Click on service
2. Go to "Settings"
3. Click "Restart"

---

## Updating Your QA Environment

### Automatic Updates (Recommended)
1. Push code to GitHub
2. Railway automatically detects and deploys
3. Wait 2-3 minutes
4. Changes are live!

### Manual Redeploy
1. Go to service in Railway
2. Click "Deployments"
3. Click "Deploy" button
4. Select branch
5. Deploy

---

## Cost Management (Staying Free)

### Tips to Maximize Free Tier:

1. **Optimize Sleep Settings**
   - Railway doesn't charge when services are idle
   - Free tier is generous for QA usage

2. **Monitor Usage**
   - Check dashboard weekly
   - $5/month = ~500 hours
   - One service 24/7 = 720 hours (over limit)
   - Two services 12 hours/day = ~720 hours (over limit)
   - **Solution**: Services auto-sleep when idle (free tier)

3. **Usage Breakdown**
   ```
   Backend (always on): ~$3/month
   Frontend (static): ~$0.50/month
   Database: ~$1/month
   Total: ~$4.50/month (within $5 credit!)
   ```

4. **If You Exceed $5**
   - Add credit card (pay only overage)
   - Or reduce usage
   - Or use multiple Railway accounts (not recommended)

---

## Troubleshooting

### Issue: Build Failed
**Check:**
1. Go to "Deployments" → View logs
2. Common issues:
   - Missing dependencies in package.json
   - Wrong root directory
   - Build command errors

**Fix:**
- Update package.json
- Check root directory setting
- Verify build command

### Issue: Backend Can't Connect to Database
**Check:**
1. Environment variables are set correctly
2. Using `${{Postgres.DATABASE_URL}}` syntax
3. Database service is running

**Fix:**
- Re-add environment variables
- Restart backend service
- Check database logs

### Issue: Frontend Can't Reach Backend
**Check:**
1. REACT_APP_API_URL is set correctly
2. Backend domain is generated
3. CORS is enabled in backend

**Fix:**
- Update REACT_APP_API_URL
- Redeploy frontend
- Add CORS middleware in backend

### Issue: "Service Unavailable"
**Cause**: Free tier services sleep after inactivity

**Solution**: 
- First request wakes it up (takes 30-60 seconds)
- This is normal for free tier
- Subsequent requests are fast

---

## Do I Need to Convert to PostgreSQL?

### Short Answer: YES (for Railway free tier)

### Why?
- Railway free tier includes PostgreSQL/MySQL
- MSSQL is paid add-on (~$10-15/month)
- PostgreSQL is industry-standard and powerful

### How Hard is Conversion?
- **Database Schema**: 30 minutes (I can help)
- **Backend Code**: 1-2 hours (I can help)
- **Testing**: 30 minutes

### Can I Keep MSSQL?
**Option 1**: Use Railway paid MSSQL (~$10/month)
**Option 2**: Use Oracle Cloud Free Tier (supports MSSQL via Docker)
**Option 3**: Use Ngrok with local MSSQL (free but temporary)

---

## Quick Decision Guide

### Choose Railway.app if:
- ✅ You want easy setup
- ✅ You're okay converting to PostgreSQL
- ✅ You want auto-deploy from Git
- ✅ You want 24/7 uptime
- ✅ You want professional URLs

### Choose Ngrok if:
- ✅ You want to keep MSSQL
- ✅ You need it working in 5 minutes
- ✅ You can keep your PC on
- ✅ You're okay with temporary URLs

### Choose Oracle Cloud if:
- ✅ You want to keep MSSQL
- ✅ You want 24/7 uptime
- ✅ You want full control
- ✅ You can spend 1 hour on setup

---

## What I Recommend for You

Based on your needs, here's my recommendation:

### For Immediate QA Testing (This Week):
→ **Use Ngrok** (5 minutes)
- No code changes
- Keep MSSQL
- Share link today

### For Long-Term QA (Next Month):
→ **Convert to PostgreSQL + Railway** (2-3 hours total)
- Professional setup
- Auto-deploy
- 24/7 access
- I can help with conversion

---

## Need Help with PostgreSQL Conversion?

I can help you convert your entire application from MSSQL to PostgreSQL:

### What I'll Convert:
1. ✅ Database schema (init-database.sql)
2. ✅ All repository files
3. ✅ Connection configuration
4. ✅ Query syntax
5. ✅ Data types
6. ✅ Test the conversion

### Time Required:
- Schema conversion: 30 minutes
- Code conversion: 1-2 hours
- Testing: 30 minutes
- **Total: 2-3 hours**

Just let me know if you want me to start the conversion!

---

## Railway.app Pros & Cons

### ✅ Pros:
- Super easy setup
- Auto-deploy from GitHub
- Free $5 credit monthly
- Professional URLs
- Automatic SSL
- Great dashboard
- Good documentation

### ❌ Cons:
- No free MSSQL (PostgreSQL/MySQL only)
- $5 credit may not cover 24/7 for all services
- Services sleep on free tier after inactivity
- Need to convert database

---

## Final Recommendation

**For your situation, I recommend this approach:**

### Phase 1: Immediate (Today) - Use Ngrok
```bash
# 5 minutes setup
1. Download ngrok
2. Run: ngrok http 3000
3. Share URL with QA
4. Start testing immediately
```

### Phase 2: Permanent (This Week) - Railway.app
```bash
# 2-3 hours setup (I'll help)
1. Convert MSSQL → PostgreSQL
2. Deploy to Railway
3. Get permanent URL
4. QA team has 24/7 access
```

This gives you:
- ✅ Immediate QA access (today)
- ✅ Professional environment (this week)
- ✅ Zero cost
- ✅ Easy maintenance

---

## Next Steps

**Tell me which option you prefer:**

**Option A**: "Let's use Ngrok now" 
→ I'll give you exact commands to run

**Option B**: "Let's convert to PostgreSQL and use Railway"
→ I'll start converting your database and code

**Option C**: "Let's use Oracle Cloud with MSSQL"
→ I'll guide you through VM setup

**Which would you like to proceed with?**
