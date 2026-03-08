# Quick Start Guide for Developer

## 🚀 Setup in 3 Simple Steps

### Step 1: Connect to SQL Server

1. Open **SQL Server Management Studio (SSMS)**
2. Click **"Connect" → "Database Engine"**
3. Enter connection details:
   - **Server name:** `localhost,58886`
   - **Authentication:** `Windows Authentication`
4. Click **"Options >>"** button
5. Go to **"Connection Properties"** tab
6. ✅ Check **"Trust server certificate"**
7. Click **"Connect"**

### Step 2: Run Database Setup Script

1. In SSMS, click **"File" → "Open" → "File"**
2. Navigate to: `backend-api/src/config/COMPLETE_DATABASE_SETUP.sql`
3. Click **"Open"**
4. Press **F5** or click **"Execute"** button
5. Wait for completion (you'll see success messages)

**That's it!** The script creates:
- ✅ Database: `SuperShineCargoDb`
- ✅ User: `SUPER_SHINE_CARGO`
- ✅ All 10 tables with proper structure
- ✅ Default categories
- ✅ Super Admin user (admin/admin123)
- ✅ Sample pay item templates

### Step 3: Configure and Run Application

1. **Update .env file** in `backend-api` folder:
   ```env
   DB_SERVER=localhost
   DB_PORT=58886
   DB_DATABASE=SuperShineCargoDb
   DB_USER=SUPER_SHINE_CARGO
   DB_PASSWORD=SuperShine@2024
   DB_ENCRYPT=false
   
   PORT=5000
   JWT_SECRET=your-secret-key-change-this
   NODE_ENV=development
   ```

2. **Install and run backend:**
   ```bash
   cd backend-api
   npm install
   node src/index.js
   ```
   
   Should see: `✅ Database connected successfully`

3. **Install and run frontend** (in new terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```
   
   Browser opens at: `http://localhost:3000`

4. **Login:**
   - Username: `admin`
   - Password: `admin123`

---

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Can login with admin/admin123
- [ ] Dashboard loads
- [ ] Can view Customers page
- [ ] Can view Jobs page
- [ ] Can view Invoicing page
- [ ] Can view Petty Cash page
- [ ] Can view Accounting page (Super Admin only)
- [ ] Can view Users page (Super Admin only)

---

## 🆘 Troubleshooting

### "Cannot connect to server"
- Verify SQL Server service is running
- Check port number is correct (58886)
- Make sure "Trust server certificate" is checked

### "Login failed"
- Use Windows Authentication, not SQL Server Authentication
- Run SSMS as Administrator

### "Database already exists"
- That's OK! The script handles existing databases
- It will skip creation and verify structure

### Backend won't start
- Check `.env` file exists in `backend-api` folder
- Verify `DB_PORT=58886` matches your SQL Server port
- Ensure `DB_ENCRYPT=false` is set

---

## 📋 What the Script Creates

**Tables:**
1. Categories - Shipment categories
2. Users - System users (4 roles: Super Admin, Admin, Manager, User)
3. Customers - Customer information with credit periods
4. ContactPersons - Customer contact persons
5. Jobs - Shipment jobs with status tracking
6. Bills - Invoices with payment tracking
7. PettyCashEntries - Petty cash transactions
8. PayItemTemplates - Reusable pay items by category
9. PettyCashAssignments - Petty cash workflow
10. PettyCashSettlementItems - Settlement details

**Default Data:**
- 5 Categories (Air Freight, Sea Freight, etc.)
- 1 Super Admin user (admin/admin123)
- 10 Sample pay item templates

---

## 🔐 Important Security Notes

⚠️ **Before going to production:**
- Change admin password
- Change JWT_SECRET in .env
- Use strong passwords
- Enable HTTPS
- Review user permissions

---

## 📞 Need Help?

1. Check error messages in console
2. Verify SQL Server is running
3. Review SETUP_GUIDE.md for detailed instructions
4. Contact team lead

---

**That's it! You're ready to start developing! 🎉**
