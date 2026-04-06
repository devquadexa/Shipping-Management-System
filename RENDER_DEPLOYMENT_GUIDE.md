# Render.com Deployment Guide - Complete Setup

Complete guide to deploy Super Shine Cargo Service on Render.com for FREE QA environment.

---

## Render.com Overview

**Free Tier Includes:**
- ✅ 750 hours/month per service (enough for 24/7)
- ✅ PostgreSQL database (1GB storage)
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ Auto-deploy from GitHub
- ✅ No credit card required

**Perfect for QA because:**
- ✅ Completely FREE
- ✅ 24/7 uptime
- ✅ Professional URLs
- ✅ Easy setup (30 minutes)
- ✅ Auto-deploy on Git push

---

## ⚠️ Important: Database Consideration

**Render.com Free Tier:**
- ✅ PostgreSQL (FREE)
- ✅ Redis (FREE)
- ❌ MSSQL (NOT available)

**Your Options:**

### Option 1: Convert to PostgreSQL (Recommended - FREE)
- I'll help you convert MSSQL → PostgreSQL
- Time: 2-3 hours
- Cost: $0
- Result: Professional 24/7 QA environment

### Option 2: Use External MSSQL Database
- Keep your MSSQL code
- Use Azure SQL Database (has free tier)
- Or use local MSSQL + Ngrok for database
- More complex setup

### Option 3: Stick with Ngrok
- Keep everything as-is
- No conversion needed
- Your PC must stay on

---

## Decision Helper

**Choose Render.com if:**
- ✅ You want 24/7 QA environment
- ✅ You're okay converting to PostgreSQL
- ✅ You want professional setup
- ✅ You want auto-deploy from Git

**Choose Ngrok if:**
- ✅ You must keep MSSQL
- ✅ You need it working today
- ✅ You can keep PC on during QA hours
- ✅ You don't want to change code

---

## Part 1: Render.com with PostgreSQL (FREE)

I'll show you both approaches:
1. How to deploy with PostgreSQL conversion
2. How to use external MSSQL (if you prefer)

---

## Approach A: Render.com + PostgreSQL (Recommended)

### Prerequisites
- GitHub account
- Your code pushed to GitHub
- 30 minutes of time

### Step 1: Sign Up for Render (2 minutes)

1. Go to: **https://render.com/**
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest)
4. Authorize Render to access your repositories
5. Verify your email

### Step 2: Create PostgreSQL Database (3 minutes)

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Configure:
   ```
   Name: supershine-qa-db
   Database: supershine_qa
   User: supershine_user
   Region: Choose closest to you (e.g., Oregon, Frankfurt, Singapore)
   PostgreSQL Version: 15
   Plan: Free
   ```
4. Click "Create Database"
5. Wait 1-2 minutes for provisioning
6. Once ready, click on the database
7. Go to "Info" tab
8. **Copy these values** (you'll need them):
   - Internal Database URL
   - External Database URL
   - PSQL Command

### Step 3: Initialize Database Schema (5 minutes)

1. In database dashboard, click "Connect" → "External Connection"
2. You'll see connection details
3. Use one of these methods:

**Method A: Using Render's Web Shell**
1. Click "Shell" tab in database dashboard
2. Paste the converted PostgreSQL schema (I'll provide below)
3. Click "Run"

**Method B: Using Local psql Client**
```bash
# If you have PostgreSQL installed locally
psql -h [hostname] -U supershine_user -d supershine_qa

# Paste the schema
```

**PostgreSQL Schema (Converted from MSSQL):**


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

-- Insert default Super Admin
INSERT INTO Users (UserId, Username, Password, FullName, Role, Email)
VALUES ('USER0001', 'superadmin', '$2a$10$8K1p/a0dL3.I8.F9.8.8.eDOZjO8qjKX5qX5qX5qX5qX5qX5qX5qX', 'Super Admin', 'Super Admin', 'superadmin@supershine.lk')
ON CONFLICT (UserId) DO NOTHING;

-- Note: Password will be hashed by backend on first use
```

I'll provide the complete schema conversion in the next section.

### Step 4: Deploy Backend API (5 minutes)

1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Click "Connect a repository"
4. If first time: Click "Configure account" → Select your GitHub account → Choose repositories
5. Select your repository
6. Configure:
   ```
   Name: supershine-backend-qa
   Region: Same as database
   Branch: main (or your branch name)
   Root Directory: backend-api
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
7. Click "Advanced" → Add Environment Variables:

   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=${{supershine-qa-db.DATABASE_URL}}
   JWT_SECRET=qa_jwt_secret_key_random_string_12345
   JWT_EXPIRES_IN=7d
   ```
   
   **Note**: `${{supershine-qa-db.DATABASE_URL}}` automatically references your database

8. Click "Create Web Service"
9. Render starts building (3-5 minutes)
10. Once deployed, click "Settings" → scroll to "Domains"
11. **Copy the URL**: `https://supershine-backend-qa.onrender.com`

### Step 5: Deploy Frontend (5 minutes)

1. Click "New +"
2. Select "Static Site"
3. Connect same repository
4. Configure:
   ```
   Name: supershine-frontend-qa
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```
5. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://supershine-backend-qa.onrender.com
   ```
   (Use your backend URL from Step 4)
6. Click "Create Static Site"
7. Wait for build (3-5 minutes)
8. Once deployed, copy the URL: `https://supershine-frontend-qa.onrender.com`

### Step 6: Share with QA Team

```
🎯 QA Environment - Super Shine Cargo

URL: https://supershine-frontend-qa.onrender.com

Login:
Username: superadmin
Password: admin123

Note: First load after inactivity may take 30-60 seconds (service waking up)
```

---

## Part 2: Code Conversion (MSSQL → PostgreSQL)

Since Render uses PostgreSQL, you need to convert your code. I can help with this!

### What Needs Converting:

1. ✅ Database schema (SQL scripts)
2. ✅ Database connection code
3. ✅ Repository queries
4. ✅ Data types
5. ✅ SQL syntax

### Conversion Time:
- Schema: 30 minutes
- Backend code: 1-2 hours
- Testing: 30 minutes
- **Total: 2-3 hours**

---

## Quick Conversion Guide

### 1. Update package.json


**Remove:**
```json
"mssql": "^12.2.0"
```

**Add:**
```json
"pg": "^8.11.3"
```

### 2. Update Database Connection

**Create**: `backend-api/src/config/database-pg.js`
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

module.exports = pool;
```

### 3. Update Query Syntax

**MSSQL:**
```javascript
const result = await pool.request()
  .input('id', sql.VarChar, userId)
  .query('SELECT * FROM Users WHERE UserId = @id');
```

**PostgreSQL:**
```javascript
const result = await pool.query(
  'SELECT * FROM Users WHERE UserId = $1',
  [userId]
);
```

### 4. SQL Syntax Changes

| MSSQL | PostgreSQL |
|-------|------------|
| `GETDATE()` | `NOW()` |
| `BIT` | `BOOLEAN` |
| `@parameter` | `$1, $2, $3` |
| `VARCHAR(MAX)` | `TEXT` |
| `IDENTITY(1,1)` | `SERIAL` |
| `TOP 10` | `LIMIT 10` |
| `[TableName]` | `"TableName"` or tablename |

---

## Approach B: Render.com + External MSSQL

If you want to keep MSSQL, you can use an external database:

### Option 1: Azure SQL Database (Free Tier)

**Azure offers:**
- 32GB storage free for 12 months
- Then $5/month for basic tier

**Setup:**
1. Create Azure account
2. Create SQL Database
3. Get connection string
4. Use in Render environment variables

### Option 2: Local MSSQL + Ngrok Tunnel

**Setup:**
1. Keep MSSQL running locally
2. Use ngrok to expose SQL Server port
3. Connect Render backend to ngrok URL

**Not recommended** - complex and unreliable

---

## Comparison: Render vs Ngrok

| Feature | Render.com | Ngrok |
|---------|------------|-------|
| **Cost** | FREE | FREE |
| **Setup Time** | 30 min + conversion | 5 min |
| **Uptime** | 24/7 | While PC on |
| **URL** | Fixed | Changes |
| **Database** | PostgreSQL | MSSQL |
| **Code Changes** | Yes (conversion) | No |
| **Professional** | ✅ Very | ⚠️ Temporary |
| **Auto-deploy** | ✅ Yes | ❌ No |
| **Best For** | Long-term QA | Quick testing |

---

## My Recommendation

### For Immediate Testing (This Week):
→ **Use Ngrok** (5 minutes, no changes)
- Keep MSSQL
- Start testing today
- No code changes

### For Professional QA (Next 2 Weeks):
→ **Convert to PostgreSQL + Render** (2-3 hours)
- I'll help with conversion
- 24/7 professional environment
- Auto-deploy from Git
- Free forever

---

## I Can Help You Convert!

If you choose Render.com, I can help convert your entire application:

### What I'll Do:
1. ✅ Convert database schema
2. ✅ Update all repository files
3. ✅ Change connection code
4. ✅ Update query syntax
5. ✅ Test everything
6. ✅ Deploy to Render

### Time Required:
- Me: 2-3 hours of work
- You: Review and test

### Steps:
1. I convert the code
2. You test locally with PostgreSQL
3. We deploy to Render together
4. QA team gets permanent URL

---

## Complete PostgreSQL Schema

Here's your complete schema converted to PostgreSQL:

```sql
-- Super Shine Cargo Service - PostgreSQL Schema

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

-- PayItems Table
CREATE TABLE IF NOT EXISTS PayItems (
    PayItemId VARCHAR(50) PRIMARY KEY,
    JobId VARCHAR(50) NOT NULL,
    Description VARCHAR(500) NOT NULL,
    ActualCost DECIMAL(10, 2),
    BillingAmount DECIMAL(10, 2),
    Amount DECIMAL(10, 2) NOT NULL,
    Category VARCHAR(100),
    PaidBy VARCHAR(50),
    AddedBy VARCHAR(50) NOT NULL,
    AddedDate TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    FOREIGN KEY (PaidBy) REFERENCES Users(UserId),
    FOREIGN KEY (AddedBy) REFERENCES Users(UserId)
);

-- Bills Table
CREATE TABLE IF NOT EXISTS Bills (
    BillId VARCHAR(50) PRIMARY KEY,
    JobId VARCHAR(50) NOT NULL,
    CustomerId VARCHAR(50) NOT NULL,
    GrossTotal DECIMAL(10, 2) NOT NULL,
    AdvancePayment DECIMAL(10, 2) DEFAULT 0,
    NetTotal DECIMAL(10, 2) NOT NULL,
    PaymentStatus VARCHAR(50) DEFAULT 'Unpaid',
    PaymentMethod VARCHAR(50),
    ChequeNumber VARCHAR(100),
    ChequeDate DATE,
    ChequeAmount DECIMAL(10, 2),
    BankName VARCHAR(200),
    PaidDate DATE,
    DueDate DATE,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId)
);

-- PettyCash Table
CREATE TABLE IF NOT EXISTS PettyCash (
    EntryId VARCHAR(50) PRIMARY KEY,
    Description VARCHAR(500) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    EntryType VARCHAR(50) NOT NULL CHECK (EntryType IN ('Income', 'Expense')),
    JobId VARCHAR(50),
    CreatedBy VARCHAR(50) NOT NULL,
    BalanceAfter DECIMAL(10, 2) NOT NULL,
    Date TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

-- PettyCashBalance Table
CREATE TABLE IF NOT EXISTS PettyCashBalance (
    Id INTEGER PRIMARY KEY DEFAULT 1,
    Balance DECIMAL(10, 2) DEFAULT 1000.00,
    LastUpdated TIMESTAMP DEFAULT NOW(),
    CHECK (Id = 1)
);

-- PettyCashAssignments Table
CREATE TABLE IF NOT EXISTS PettyCashAssignments (
    AssignmentId SERIAL PRIMARY KEY,
    JobId VARCHAR(50) NOT NULL,
    AssignedTo VARCHAR(50) NOT NULL,
    AssignedAmount DECIMAL(10, 2) NOT NULL,
    ActualSpent DECIMAL(10, 2) DEFAULT 0,
    BalanceAmount DECIMAL(10, 2) DEFAULT 0,
    OverAmount DECIMAL(10, 2) DEFAULT 0,
    Status VARCHAR(50) DEFAULT 'Assigned',
    AssignedDate TIMESTAMP DEFAULT NOW(),
    SettledDate TIMESTAMP,
    ParentAssignmentId INTEGER,
    FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    FOREIGN KEY (AssignedTo) REFERENCES Users(UserId),
    FOREIGN KEY (ParentAssignmentId) REFERENCES PettyCashAssignments(AssignmentId)
);

-- SettlementItems Table
CREATE TABLE IF NOT EXISTS SettlementItems (
    SettlementItemId SERIAL PRIMARY KEY,
    AssignmentId INTEGER NOT NULL,
    ItemName VARCHAR(200) NOT NULL,
    ActualCost DECIMAL(10, 2) NOT NULL,
    HasBill BOOLEAN DEFAULT FALSE,
    IsCustomItem BOOLEAN DEFAULT FALSE,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (AssignmentId) REFERENCES PettyCashAssignments(AssignmentId)
);

-- PayItemTemplates Table
CREATE TABLE IF NOT EXISTS PayItemTemplates (
    TemplateId SERIAL PRIMARY KEY,
    ItemName VARCHAR(200) NOT NULL,
    Category VARCHAR(100) NOT NULL,
    DefaultAmount DECIMAL(10, 2),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT NOW()
);

-- OfficePayItems Table
CREATE TABLE IF NOT EXISTS OfficePayItems (
    OfficePayItemId SERIAL PRIMARY KEY,
    JobId VARCHAR(50) NOT NULL,
    ItemName VARCHAR(200) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Category VARCHAR(100),
    CreatedBy VARCHAR(50) NOT NULL,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

-- OldInvoices Table
CREATE TABLE IF NOT EXISTS OldInvoices (
    OldInvoiceId SERIAL PRIMARY KEY,
    CustomerId VARCHAR(50) NOT NULL,
    InvoiceNumber VARCHAR(100) NOT NULL,
    InvoiceDate DATE NOT NULL,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    PaidAmount DECIMAL(10, 2) DEFAULT 0,
    BalanceAmount DECIMAL(10, 2) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Unpaid',
    CreatedBy VARCHAR(50) NOT NULL,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

-- OldInvoicePayments Table
CREATE TABLE IF NOT EXISTS OldInvoicePayments (
    PaymentId SERIAL PRIMARY KEY,
    OldInvoiceId INTEGER NOT NULL,
    PaymentAmount DECIMAL(10, 2) NOT NULL,
    PaymentDate DATE NOT NULL,
    PaymentMethod VARCHAR(50),
    ChequeNumber VARCHAR(100),
    BankName VARCHAR(200),
    CreatedBy VARCHAR(50) NOT NULL,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (OldInvoiceId) REFERENCES OldInvoices(OldInvoiceId),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);

-- CashBalanceSettlements Table
CREATE TABLE IF NOT EXISTS CashBalanceSettlements (
    SettlementId SERIAL PRIMARY KEY,
    UserId VARCHAR(50) NOT NULL,
    TotalBalance DECIMAL(10, 2) NOT NULL,
    TotalOverdue DECIMAL(10, 2) NOT NULL,
    NetAmount DECIMAL(10, 2) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Pending',
    SubmittedDate TIMESTAMP DEFAULT NOW(),
    ApprovedDate TIMESTAMP,
    ApprovedBy VARCHAR(50),
    CompletedDate TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserId)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_customerid ON Jobs(CustomerId);
CREATE INDEX IF NOT EXISTS idx_jobs_assignedto ON Jobs(AssignedTo);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON Jobs(Status);
CREATE INDEX IF NOT EXISTS idx_bills_jobid ON Bills(JobId);
CREATE INDEX IF NOT EXISTS idx_payitems_jobid ON PayItems(JobId);
CREATE INDEX IF NOT EXISTS idx_pettycash_jobid ON PettyCash(JobId);
CREATE INDEX IF NOT EXISTS idx_assignments_jobid ON PettyCashAssignments(JobId);
CREATE INDEX IF NOT EXISTS idx_assignments_assignedto ON PettyCashAssignments(AssignedTo);

-- Insert default data
INSERT INTO Users (UserId, Username, Password, FullName, Role, Email)
VALUES ('USER0001', 'superadmin', 'admin123', 'Super Admin', 'Super Admin', 'superadmin@supershine.lk')
ON CONFLICT (UserId) DO NOTHING;

INSERT INTO PettyCashBalance (Id, Balance, LastUpdated)
VALUES (1, 1000.00, NOW())
ON CONFLICT (Id) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully!' as message;
```

---

## Next Steps - Choose Your Path

### Path 1: Quick Start with Ngrok (Today)
1. Follow NGROK_QA_SETUP_GUIDE.md
2. 5 minutes setup
3. Start testing immediately
4. Keep MSSQL

### Path 2: Professional Setup with Render (This Week)
1. I convert your code to PostgreSQL (2-3 hours)
2. You test locally
3. Deploy to Render (30 minutes)
4. Get permanent QA URL
5. 24/7 access for QA team

---

## Which Do You Prefer?

**Option A**: "Let's use Ngrok now and convert to Render later"
→ Start with Ngrok today, plan Render conversion

**Option B**: "Let's convert to PostgreSQL and use Render"
→ I'll start converting your code now

**Option C**: "Let's stick with Ngrok only"
→ Keep it simple, no conversion needed

**Tell me which option you prefer and I'll help you proceed!**
