# 🗄️ Database Changes for Enhanced Customer Registration

## 📋 New Requirements Summary

### Customer Fields:
1. ✅ Customer/Company Name
2. ✅ Main Phone Number
3. ✅ Contact Persons (up to 3 with name + phone)
4. ✅ Address
5. ✅ Office Location (with "same as address" option)
6. ✅ Categories (multiple selection from predefined list)
7. ✅ Email Address
8. ✅ Website

---

## 🗄️ Database Design

### Option 1: Normalized Design (Recommended) ⭐

This approach uses separate tables for contact persons and categories, following database normalization principles.

#### 1. Update Customers Table

```sql
-- Modify existing Customers table
ALTER TABLE Customers
ADD CompanyName NVARCHAR(255) NULL,
    MainPhone NVARCHAR(50) NULL,
    Address NVARCHAR(500) NULL,
    OfficeLocation NVARCHAR(500) NULL,
    IsSameLocation BIT DEFAULT 0,
    Website NVARCHAR(255) NULL;

-- Rename Name column to be clearer (optional)
EXEC sp_rename 'Customers.Name', 'CustomerName', 'COLUMN';

-- Update existing data
UPDATE Customers 
SET CompanyName = CustomerName,
    MainPhone = Phone,
    IsSameLocation = 0
WHERE CompanyName IS NULL;
```

**Updated Customers Table Structure:**
```
Customers
├── CustomerId (PK) - VARCHAR(50)
├── CustomerName - NVARCHAR(255) - Display name
├── CompanyName - NVARCHAR(255) - Official company name
├── MainPhone - NVARCHAR(50) - Primary contact number
├── Email - NVARCHAR(255) - Email address
├── Address - NVARCHAR(500) - Physical address
├── OfficeLocation - NVARCHAR(500) - Office location
├── IsSameLocation - BIT - True if office = address
├── Website - NVARCHAR(255) - Company website
├── RegistrationDate - DATETIME
├── IsActive - BIT
└── TIN - NVARCHAR(50) - (existing, nullable)
```

---

#### 2. Create ContactPersons Table (NEW)

```sql
-- Create ContactPersons table
CREATE TABLE ContactPersons (
    ContactPersonId INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId VARCHAR(50) NOT NULL,
    ContactName NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(50) NOT NULL,
    ContactOrder INT NOT NULL, -- 1, 2, or 3
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    CONSTRAINT FK_ContactPersons_Customers 
        FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId)
        ON DELETE CASCADE,
    CONSTRAINT CHK_ContactOrder CHECK (ContactOrder BETWEEN 1 AND 3)
);

-- Create index for faster queries
CREATE INDEX IX_ContactPersons_CustomerId ON ContactPersons(CustomerId);
```

**ContactPersons Table Structure:**
```
ContactPersons
├── ContactPersonId (PK) - INT IDENTITY
├── CustomerId (FK) - VARCHAR(50)
├── ContactName - NVARCHAR(255)
├── PhoneNumber - NVARCHAR(50)
├── ContactOrder - INT (1, 2, or 3)
├── CreatedDate - DATETIME
└── IsActive - BIT
```

---

#### 3. Create Categories Table (NEW)

```sql
-- Create Categories lookup table
CREATE TABLE Categories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    CategoryCode NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Insert predefined categories
INSERT INTO Categories (CategoryName, CategoryCode, Description) VALUES
('Chemical / Raw Materials', 'CHEMICAL', 'Chemical products and raw materials'),
('Paper', 'PAPER', 'Paper and paper products'),
('Animal Feed', 'ANIMAL_FEED', 'Animal feed and related products'),
('Machinery', 'MACHINERY', 'Machinery and equipment'),
('Vehicle', 'VEHICLE', 'Vehicles and automotive'),
('Raw Material', 'RAW_MATERIAL', 'General raw materials');
```

**Categories Table Structure:**
```
Categories
├── CategoryId (PK) - INT IDENTITY
├── CategoryName - NVARCHAR(100) - Display name
├── CategoryCode - NVARCHAR(50) - Unique code
├── Description - NVARCHAR(500)
├── IsActive - BIT
└── CreatedDate - DATETIME
```

---

#### 4. Create CustomerCategories Junction Table (NEW)

```sql
-- Create junction table for many-to-many relationship
CREATE TABLE CustomerCategories (
    CustomerCategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId VARCHAR(50) NOT NULL,
    CategoryId INT NOT NULL,
    AssignedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CustomerCategories_Customers 
        FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId)
        ON DELETE CASCADE,
    CONSTRAINT FK_CustomerCategories_Categories 
        FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
        ON DELETE CASCADE,
    CONSTRAINT UQ_CustomerCategory UNIQUE (CustomerId, CategoryId)
);

-- Create indexes
CREATE INDEX IX_CustomerCategories_CustomerId ON CustomerCategories(CustomerId);
CREATE INDEX IX_CustomerCategories_CategoryId ON CustomerCategories(CategoryId);
```

**CustomerCategories Table Structure:**
```
CustomerCategories
├── CustomerCategoryId (PK) - INT IDENTITY
├── CustomerId (FK) - VARCHAR(50)
├── CategoryId (FK) - INT
└── AssignedDate - DATETIME
```

---

## 📊 Complete Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                        Customers                             │
│  - CustomerId (PK)                                          │
│  - CustomerName                                             │
│  - CompanyName                                              │
│  - MainPhone                                                │
│  - Email                                                    │
│  - Address                                                  │
│  - OfficeLocation                                           │
│  - IsSameLocation                                           │
│  - Website                                                  │
│  - RegistrationDate                                         │
│  - IsActive                                                 │
└────────────┬────────────────────────────────────────────────┘
             │
             │ 1:N
             │
┌────────────▼────────────────────────────────────────────────┐
│                    ContactPersons                            │
│  - ContactPersonId (PK)                                     │
│  - CustomerId (FK)                                          │
│  - ContactName                                              │
│  - PhoneNumber                                              │
│  - ContactOrder (1, 2, or 3)                                │
│  - CreatedDate                                              │
│  - IsActive                                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Customers                             │
└────────────┬────────────────────────────────────────────────┘
             │
             │ N:M
             │
┌────────────▼────────────────────────────────────────────────┐
│                  CustomerCategories                          │
│  - CustomerCategoryId (PK)                                  │
│  - CustomerId (FK)                                          │
│  - CategoryId (FK)                                          │
│  - AssignedDate                                             │
└────────────┬────────────────────────────────────────────────┘
             │
             │ N:1
             │
┌────────────▼────────────────────────────────────────────────┐
│                       Categories                             │
│  - CategoryId (PK)                                          │
│  - CategoryName                                             │
│  - CategoryCode                                             │
│  - Description                                              │
│  - IsActive                                                 │
│  - CreatedDate                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Complete SQL Script

```sql
-- ============================================
-- STEP 1: Update Customers Table
-- ============================================

-- Add new columns
ALTER TABLE Customers
ADD CompanyName NVARCHAR(255) NULL,
    MainPhone NVARCHAR(50) NULL,
    Address NVARCHAR(500) NULL,
    OfficeLocation NVARCHAR(500) NULL,
    IsSameLocation BIT DEFAULT 0,
    Website NVARCHAR(255) NULL;

-- Rename Name column (optional)
EXEC sp_rename 'Customers.Name', 'CustomerName', 'COLUMN';

-- Update existing data
UPDATE Customers 
SET CompanyName = CustomerName,
    MainPhone = Phone,
    IsSameLocation = 0
WHERE CompanyName IS NULL;

-- ============================================
-- STEP 2: Create ContactPersons Table
-- ============================================

CREATE TABLE ContactPersons (
    ContactPersonId INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId VARCHAR(50) NOT NULL,
    ContactName NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(50) NOT NULL,
    ContactOrder INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    CONSTRAINT FK_ContactPersons_Customers 
        FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId)
        ON DELETE CASCADE,
    CONSTRAINT CHK_ContactOrder CHECK (ContactOrder BETWEEN 1 AND 3)
);

CREATE INDEX IX_ContactPersons_CustomerId ON ContactPersons(CustomerId);

-- ============================================
-- STEP 3: Create Categories Table
-- ============================================

CREATE TABLE Categories (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    CategoryCode NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Insert predefined categories
INSERT INTO Categories (CategoryName, CategoryCode, Description) VALUES
('Chemical / Raw Materials', 'CHEMICAL', 'Chemical products and raw materials'),
('Paper', 'PAPER', 'Paper and paper products'),
('Animal Feed', 'ANIMAL_FEED', 'Animal feed and related products'),
('Machinery', 'MACHINERY', 'Machinery and equipment'),
('Vehicle', 'VEHICLE', 'Vehicles and automotive'),
('Raw Material', 'RAW_MATERIAL', 'General raw materials');

-- ============================================
-- STEP 4: Create CustomerCategories Table
-- ============================================

CREATE TABLE CustomerCategories (
    CustomerCategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId VARCHAR(50) NOT NULL,
    CategoryId INT NOT NULL,
    AssignedDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CustomerCategories_Customers 
        FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId)
        ON DELETE CASCADE,
    CONSTRAINT FK_CustomerCategories_Categories 
        FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
        ON DELETE CASCADE,
    CONSTRAINT UQ_CustomerCategory UNIQUE (CustomerId, CategoryId)
);

CREATE INDEX IX_CustomerCategories_CustomerId ON CustomerCategories(CustomerId);
CREATE INDEX IX_CustomerCategories_CategoryId ON CustomerCategories(CategoryId);

-- ============================================
-- STEP 5: Verification Queries
-- ============================================

-- Check Customers table structure
EXEC sp_help 'Customers';

-- Check ContactPersons table
SELECT * FROM ContactPersons;

-- Check Categories
SELECT * FROM Categories;

-- Check CustomerCategories
SELECT * FROM CustomerCategories;
```

---

## 📝 Sample Data Examples

### Example 1: Customer with Multiple Contacts and Categories

```sql
-- Insert customer
INSERT INTO Customers (CustomerId, CustomerName, CompanyName, MainPhone, Email, Address, OfficeLocation, IsSameLocation, Website, RegistrationDate, IsActive)
VALUES ('CUST0001', 'ABC Trading', 'ABC Trading (Pvt) Ltd', '0112345678', 'info@abctrading.lk', '123 Main St, Colombo 01', '123 Main St, Colombo 01', 1, 'www.abctrading.lk', GETDATE(), 1);

-- Insert contact persons
INSERT INTO ContactPersons (CustomerId, ContactName, PhoneNumber, ContactOrder)
VALUES 
('CUST0001', 'John Silva', '0771234567', 1),
('CUST0001', 'Mary Fernando', '0779876543', 2),
('CUST0001', 'David Perera', '0765432109', 3);

-- Assign categories
INSERT INTO CustomerCategories (CustomerId, CategoryId)
VALUES 
('CUST0001', 1), -- Chemical / Raw Materials
('CUST0001', 4); -- Machinery
```

### Example 2: Customer with Different Office Location

```sql
-- Insert customer
INSERT INTO Customers (CustomerId, CustomerName, CompanyName, MainPhone, Email, Address, OfficeLocation, IsSameLocation, Website, RegistrationDate, IsActive)
VALUES ('CUST0002', 'XYZ Logistics', 'XYZ Logistics Ltd', '0117654321', 'contact@xyzlogistics.lk', '456 Warehouse Rd, Kelaniya', '789 Office Tower, Colombo 03', 0, 'www.xyzlogistics.lk', GETDATE(), 1);

-- Insert contact person (only 1)
INSERT INTO ContactPersons (CustomerId, ContactName, PhoneNumber, ContactOrder)
VALUES ('CUST0002', 'Saman Kumara', '0771111111', 1);

-- Assign category
INSERT INTO CustomerCategories (CustomerId, CategoryId)
VALUES ('CUST0002', 5); -- Vehicle
```

---

## 🔍 Useful Queries

### Get Customer with All Details

```sql
SELECT 
    c.CustomerId,
    c.CustomerName,
    c.CompanyName,
    c.MainPhone,
    c.Email,
    c.Address,
    c.OfficeLocation,
    c.IsSameLocation,
    c.Website,
    c.RegistrationDate,
    -- Contact Persons (concatenated)
    STUFF((
        SELECT ', ' + cp.ContactName + ' (' + cp.PhoneNumber + ')'
        FROM ContactPersons cp
        WHERE cp.CustomerId = c.CustomerId
        ORDER BY cp.ContactOrder
        FOR XML PATH('')
    ), 1, 2, '') AS ContactPersons,
    -- Categories (concatenated)
    STUFF((
        SELECT ', ' + cat.CategoryName
        FROM CustomerCategories cc
        INNER JOIN Categories cat ON cc.CategoryId = cat.CategoryId
        WHERE cc.CustomerId = c.CustomerId
        FOR XML PATH('')
    ), 1, 2, '') AS Categories
FROM Customers c
WHERE c.IsActive = 1
ORDER BY c.RegistrationDate DESC;
```

### Get Customer with Contact Persons (Separate Rows)

```sql
SELECT 
    c.CustomerId,
    c.CompanyName,
    c.MainPhone,
    c.Email,
    cp.ContactName,
    cp.PhoneNumber,
    cp.ContactOrder
FROM Customers c
LEFT JOIN ContactPersons cp ON c.CustomerId = cp.CustomerId
WHERE c.IsActive = 1
ORDER BY c.CustomerId, cp.ContactOrder;
```

### Get Customer with Categories (Separate Rows)

```sql
SELECT 
    c.CustomerId,
    c.CompanyName,
    cat.CategoryName,
    cat.CategoryCode
FROM Customers c
LEFT JOIN CustomerCategories cc ON c.CustomerId = cc.CustomerId
LEFT JOIN Categories cat ON cc.CategoryId = cat.CategoryId
WHERE c.IsActive = 1
ORDER BY c.CustomerId, cat.CategoryName;
```

---

## 🎯 Benefits of This Design

### ✅ Normalized Design
- No data duplication
- Easy to maintain
- Scalable

### ✅ Flexible
- Can add unlimited contact persons (just change constraint)
- Can add new categories easily
- Can assign multiple categories per customer

### ✅ Data Integrity
- Foreign key constraints ensure data consistency
- Unique constraints prevent duplicates
- Check constraints validate data

### ✅ Performance
- Indexes on foreign keys for fast queries
- Efficient joins

### ✅ Clean Architecture Compatible
- Separate tables for separate concerns
- Easy to map to domain entities
- Repository pattern friendly

---

## 📋 Migration Checklist

- [ ] Backup existing database
- [ ] Run ALTER TABLE on Customers
- [ ] Create ContactPersons table
- [ ] Create Categories table
- [ ] Insert category data
- [ ] Create CustomerCategories table
- [ ] Test with sample data
- [ ] Update backend entities
- [ ] Update backend repositories
- [ ] Update backend use cases
- [ ] Update frontend forms
- [ ] Test complete flow

---

## 🚀 Next Steps

1. **Run the SQL script** on your database
2. **Update backend domain entities** to match new structure
3. **Update repositories** to handle new tables
4. **Update use cases** for new business logic
5. **Update frontend forms** to capture new fields
6. **Test thoroughly**

---

**This design follows database normalization principles and Clean Architecture!** ✅
