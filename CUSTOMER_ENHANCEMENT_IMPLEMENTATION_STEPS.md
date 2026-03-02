# Customer Enhancement Implementation Steps

## ✅ COMPLETED BACKEND CHANGES

### 1. New Domain Entities Created
- `ContactPerson.js` - Represents contact persons for customers
- `Category.js` - Represents business categories

### 2. New Repository Interfaces Created
- `IContactPersonRepository.js` - Contract for contact person data access
- `ICategoryRepository.js` - Contract for category data access

### 3. New Repository Implementations Created
- `MSSQLContactPersonRepository.js` - SQL Server implementation for contact persons
- `MSSQLCategoryRepository.js` - SQL Server implementation for categories

### 4. Updated Files
- `Customer.js` (Entity) - Added new fields: mainPhone, officeLocation, isSameLocation, website, contactPersons, categories
- `MSSQLCustomerRepository.js` - Updated to handle new fields and relationships
- `container.js` (DI) - Registered new repositories
- `CustomerController.js` - Added getCategories endpoint
- `customers.js` (Routes) - Added GET /api/customers/categories/all route

### 5. Updated Frontend
- `Customers.js` - Complete form redesign with all new fields:
  - Customer/Company Name (single field)
  - Main Phone Number
  - Email Address
  - Address
  - Office Location (with "same as address" checkbox)
  - Website
  - Contact Persons (up to 3 with name and phone)
  - Categories (multi-select checkboxes)

## 🔴 REQUIRED STEPS TO COMPLETE

### Step 1: Backup Your Database
**IMPORTANT: Do this first!**
```sql
-- In SQL Server Management Studio, right-click on SuperShineCargoDb
-- Tasks > Back Up...
-- Save the backup file to a safe location
```

### Step 2: Run the Database Migration Script
1. Open SQL Server Management Studio
2. Connect to your SQL Server instance (localhost:53181)
3. Open the file: `backend-api/src/config/recreate-customers-fresh.sql`
4. Execute the script (F5 or click Execute)
5. Verify the output shows successful creation of all tables

### Step 3: Restart the Backend Server
```bash
cd backend-api
npm start
```

### Step 4: Restart the Frontend
```bash
cd frontend
npm start
```

### Step 5: Test the New Customer Registration
1. Login to the system (superadmin / admin123)
2. Navigate to Customers page
3. Click "Register Customer"
4. Fill in the new form with all fields:
   - Customer/Company Name
   - Main Phone Number
   - Email Address
   - Address
   - Check "same as address" or enter Office Location
   - Enter Website (optional)
   - Add up to 3 contact persons
   - Select one or more categories
5. Submit and verify customer is created successfully

## 📋 DATABASE CHANGES SUMMARY

### New Tables Created:
1. **ContactPersons** - Stores up to 3 contact persons per customer
2. **Categories** - Predefined list of 6 business categories
3. **CustomerCategories** - Junction table for many-to-many relationship

### Updated Tables:
1. **Customers** - New columns:
   - MainPhone (replaces Phone)
   - OfficeLocation
   - IsSameLocation
   - Website
   - Removed: CompanyName (using single Name field)

### Predefined Categories:
1. Chemical / Raw Materials
2. Paper
3. Animal Feed
4. Machinery
5. Vehicle
6. Raw Material

## 🔍 VERIFICATION CHECKLIST

- [ ] Database backup completed
- [ ] Migration script executed successfully
- [ ] Backend server starts without errors
- [ ] Frontend loads without errors
- [ ] Can view existing customers (if any)
- [ ] Can register new customer with all fields
- [ ] Contact persons are saved correctly
- [ ] Categories are displayed and saved correctly
- [ ] "Same as address" checkbox works correctly
- [ ] Customer list displays new fields

## 🚨 TROUBLESHOOTING

### If backend fails to start:
1. Check database connection in `.env` file
2. Verify SQL Server is running
3. Check console for specific error messages

### If categories don't load:
1. Verify the migration script inserted the 6 categories
2. Check browser console for API errors
3. Verify the route `/api/customers/categories/all` is accessible

### If customer creation fails:
1. Check browser console for validation errors
2. Verify all required fields are filled
3. Check backend console for detailed error messages

## 📝 NOTES

- The system now uses a single "Name" field for both customer and company names
- Frontend displays it as "Customer / Company Name"
- Contact persons are optional but if added, both name and phone are required
- Categories are optional but recommended for better organization
- Office location defaults to address if "same as address" is checked
- Website field is optional and accepts URLs
