# Developer Onboarding Checklist

## Welcome to Super Shine Cargo Service Development Team!

Follow this checklist to get your development environment set up.

---

## ✅ Pre-Setup Checklist

- [ ] Received GitHub repository access
- [ ] Received branch assignment
- [ ] Have Windows PC with admin rights
- [ ] Have stable internet connection

---

## 📥 Step 1: Install Required Software

### 1.1 Install Node.js
- [ ] Download from: https://nodejs.org/
- [ ] Install LTS version (v14 or higher)
- [ ] Verify installation: `node --version` and `npm --version`

### 1.2 Install SQL Server Express
- [ ] Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- [ ] Choose "Basic" installation
- [ ] Note down server name (usually `localhost\SQLEXPRESS`)
- [ ] Set SA password during installation
- [ ] Remember your SA password!

### 1.3 Install SQL Server Management Studio (SSMS)
- [ ] Download from: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
- [ ] Install with default settings
- [ ] Test connection to SQL Server

### 1.4 Install Git
- [ ] Download from: https://git-scm.com/
- [ ] Install with default settings
- [ ] Configure Git:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```

---

## 🗄️ Step 2: Database Setup

### 2.1 Enable SQL Server TCP/IP
- [ ] Open SQL Server Configuration Manager
- [ ] Navigate to: SQL Server Network Configuration → Protocols for SQLEXPRESS
- [ ] Enable TCP/IP protocol
- [ ] Set TCP Port to `1433` in IPAll section
- [ ] Restart SQL Server service

### 2.2 Create Database and User
- [ ] Open SSMS
- [ ] Connect using SA credentials
- [ ] Run the database setup script from `DATABASE_SETUP.md`
- [ ] Verify database `SuperShineCargoDb` is created
- [ ] Verify user `SUPER_SHINE_CARGO` is created

### 2.3 Initialize Database Schema
- [ ] Navigate to `backend-api/src/config/` folder
- [ ] Run SQL scripts in this order:
  - [ ] init-database.sql
  - [ ] add-contact-person-fields.sql
  - [ ] add-credit-period-and-invoice-tracking.sql
  - [ ] add-pay-items-settings.sql
  - [ ] add-petty-cash-workflow.sql
  - [ ] update-job-status-constraint.sql
  - [ ] update-existing-jobs-petty-cash-status.sql
  - [ ] add-manager-role.sql

### 2.4 Create Super Admin User
- [ ] Run the Super Admin creation script from `DATABASE_SETUP.md`
- [ ] Verify you can see the admin user in Users table

### 2.5 Verify Database Setup
- [ ] Run verification query to check all tables exist
- [ ] Should see 10 tables total

---

## 💻 Step 3: Clone and Setup Code

### 3.1 Clone Repository
- [ ] Open terminal/command prompt
- [ ] Navigate to your projects folder
- [ ] Clone repository:
  ```bash
  git clone <repository-url>
  cd super-shine-cargo
  ```
- [ ] Checkout your assigned branch:
  ```bash
  git checkout <your-branch-name>
  ```

### 3.2 Setup Backend
- [ ] Navigate to backend folder: `cd backend-api`
- [ ] Install dependencies: `npm install`
- [ ] Copy environment file: `copy .env.example .env`
- [ ] Edit `.env` file with your database credentials:
  ```env
  DB_SERVER=localhost
  DB_PORT=1433
  DB_DATABASE=SuperShineCargoDb
  DB_USER=SUPER_SHINE_CARGO
  DB_PASSWORD=SuperShine@2024
  DB_ENCRYPT=false
  PORT=5000
  JWT_SECRET=your-secret-key
  NODE_ENV=development
  ```
- [ ] Test database connection: `node src/config/database.js`
- [ ] Should see: "✅ Connected to MSSQL database"

### 3.3 Setup Frontend
- [ ] Navigate to frontend folder: `cd ../frontend`
- [ ] Install dependencies: `npm install`
- [ ] Verify no errors during installation

---

## 🚀 Step 4: Run the Application

### 4.1 Start Backend Server
- [ ] Open terminal in `backend-api` folder
- [ ] Run: `node src/index.js`
- [ ] Verify you see:
  ```
  🚀 Server running on port 5000
  ✅ Database connected successfully
  ```
- [ ] Keep this terminal open

### 4.2 Start Frontend Server
- [ ] Open NEW terminal in `frontend` folder
- [ ] Run: `npm start`
- [ ] Browser should automatically open to `http://localhost:3000`
- [ ] Keep this terminal open

### 4.3 Test Login
- [ ] Go to `http://localhost:3000`
- [ ] Login with:
  - Username: `admin`
  - Password: `admin123`
- [ ] Verify you can see the dashboard
- [ ] Check all menu items are accessible

---

## 🧪 Step 5: Verify Everything Works

### 5.1 Test Core Features
- [ ] Dashboard loads without errors
- [ ] Can view Customers page
- [ ] Can view Jobs page
- [ ] Can view Invoicing page (Admin+)
- [ ] Can view Petty Cash page
- [ ] Can view Accounting page (Super Admin only)
- [ ] Can view Users page (Super Admin only)

### 5.2 Test User Creation
- [ ] Go to Users page
- [ ] Create a test user with each role:
  - [ ] User role
  - [ ] Manager role
  - [ ] Admin role
- [ ] Logout and test login with each new user
- [ ] Verify role-based access works correctly

### 5.3 Test Customer Management
- [ ] Create a new customer
- [ ] Add contact person
- [ ] Edit customer details
- [ ] Verify customer appears in list

---

## 📚 Step 6: Familiarize with Codebase

### 6.1 Backend Structure
- [ ] Review `backend-api/CLEAN_ARCHITECTURE.md`
- [ ] Understand folder structure:
  - [ ] `src/application/` - Business logic (use cases)
  - [ ] `src/domain/` - Entities and interfaces
  - [ ] `src/infrastructure/` - Database repositories
  - [ ] `src/presentation/` - API routes and controllers
  - [ ] `src/middleware/` - Authentication
  - [ ] `src/config/` - Database configuration

### 6.2 Frontend Structure
- [ ] Review `frontend/src/` folder
- [ ] Understand structure:
  - [ ] `components/` - React components
  - [ ] `api/` - API service layer
  - [ ] `context/` - Authentication context
  - [ ] `styles/` - CSS files

### 6.3 Key Concepts
- [ ] Understand user roles and permissions
- [ ] Review authentication flow
- [ ] Understand job workflow
- [ ] Review petty cash workflow
- [ ] Understand billing and credit period system

---

## 🔧 Step 7: Development Tools Setup

### 7.1 Code Editor
- [ ] Install VS Code (recommended) or your preferred editor
- [ ] Install useful extensions:
  - [ ] ESLint
  - [ ] Prettier
  - [ ] SQL Server (mssql)
  - [ ] GitLens

### 7.2 Git Workflow
- [ ] Understand branching strategy
- [ ] Know how to create feature branches
- [ ] Understand commit message conventions
- [ ] Know how to create pull requests

---

## 📝 Step 8: Documentation Review

- [ ] Read `SETUP_GUIDE.md` completely
- [ ] Read `DATABASE_SETUP.md`
- [ ] Review API endpoints documentation
- [ ] Understand database schema
- [ ] Review user role permissions

---

## 🎯 Step 9: First Task

- [ ] Receive first task assignment
- [ ] Create feature branch from your assigned branch
- [ ] Make changes
- [ ] Test thoroughly
- [ ] Commit and push
- [ ] Create pull request

---

## 🆘 Getting Help

If you encounter issues:

1. **Database Issues**
   - Check `DATABASE_SETUP.md` troubleshooting section
   - Verify SQL Server service is running
   - Check connection string in `.env`

2. **Backend Issues**
   - Check console for error messages
   - Verify `.env` file is configured correctly
   - Ensure database is accessible

3. **Frontend Issues**
   - Check browser console for errors
   - Verify backend is running
   - Clear browser cache if needed

4. **Git Issues**
   - Check you're on the correct branch
   - Ensure you have latest changes: `git pull`
   - Resolve merge conflicts if any

5. **Contact Team**
   - Reach out to team lead
   - Check team communication channel
   - Review existing documentation

---

## ✨ Tips for Success

- **Keep terminals organized** - Use separate terminals for backend and frontend
- **Check logs regularly** - Console logs help identify issues quickly
- **Test frequently** - Test your changes as you develop
- **Commit often** - Make small, focused commits
- **Ask questions** - Don't hesitate to ask for help
- **Document your work** - Add comments and update docs when needed

---

## 🎉 Congratulations!

You're now ready to start developing for Super Shine Cargo Service!

**Next Steps:**
1. Attend team standup/meeting
2. Get assigned your first task
3. Start coding!

---

**Welcome to the team! 🚀**

For detailed information, refer to:
- [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [DATABASE_SETUP.md](DATABASE_SETUP.md)
- [CLEAN_ARCHITECTURE.md](backend-api/CLEAN_ARCHITECTURE.md)
