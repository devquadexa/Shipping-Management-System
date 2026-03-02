-- Super Shine Cargo Service Database Schema
-- Run this script to create the database and tables

-- Create Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SuperShineCargoDb')
BEGIN
    CREATE DATABASE SuperShineCargoDb;
END
GO

USE SuperShineCargoDb;
GO

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserId VARCHAR(50) PRIMARY KEY,
        Username VARCHAR(100) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        FullName VARCHAR(200) NOT NULL,
        Role VARCHAR(50) NOT NULL CHECK (Role IN ('Super Admin', 'Admin', 'User')),
        Email VARCHAR(200) NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );

    -- Insert default Super Admin
    INSERT INTO Users (UserId, Username, Password, FullName, Role, Email, CreatedDate)
    VALUES ('USER0001', 'superadmin', 'admin123', 'Super Admin', 'Super Admin', 'superadmin@supershine.lk', GETDATE());
END
GO

-- Customers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
BEGIN
    CREATE TABLE Customers (
        CustomerId VARCHAR(50) PRIMARY KEY,
        Name VARCHAR(200) NOT NULL,
        Phone VARCHAR(50) NOT NULL,
        Email VARCHAR(200) NOT NULL,
        Address VARCHAR(500) NOT NULL,
        RegistrationDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
END
GO

-- Jobs Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Jobs')
BEGIN
    CREATE TABLE Jobs (
        JobId VARCHAR(50) PRIMARY KEY,
        CustomerId VARCHAR(50) NOT NULL,
        Description VARCHAR(500) NOT NULL,
        Origin VARCHAR(200) NOT NULL,
        Destination VARCHAR(200) NOT NULL,
        Weight DECIMAL(10, 2) NOT NULL,
        ShippingCost DECIMAL(10, 2) NOT NULL,
        AssignedTo VARCHAR(50) NULL,
        Status VARCHAR(50) DEFAULT 'Open' CHECK (Status IN ('Open', 'In Transit', 'Completed', 'Cancelled')),
        CreatedDate DATETIME DEFAULT GETDATE(),
        CreatedBy VARCHAR(50) NOT NULL,
        CompletedDate DATETIME NULL,
        FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId),
        FOREIGN KEY (AssignedTo) REFERENCES Users(UserId),
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
    );
END
GO

-- Pay Items Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PayItems')
BEGIN
    CREATE TABLE PayItems (
        PayItemId VARCHAR(50) PRIMARY KEY,
        JobId VARCHAR(50) NOT NULL,
        Description VARCHAR(500) NOT NULL,
        Amount DECIMAL(10, 2) NOT NULL,
        AddedBy VARCHAR(50) NOT NULL,
        AddedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
        FOREIGN KEY (AddedBy) REFERENCES Users(UserId)
    );
END
GO

-- Bills Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Bills')
BEGIN
    CREATE TABLE Bills (
        BillId VARCHAR(50) PRIMARY KEY,
        JobId VARCHAR(50) NOT NULL,
        CustomerId VARCHAR(50) NOT NULL,
        Amount DECIMAL(10, 2) NOT NULL,
        Tax DECIMAL(10, 2) NOT NULL,
        Total DECIMAL(10, 2) NOT NULL,
        PaymentStatus VARCHAR(50) DEFAULT 'Unpaid' CHECK (PaymentStatus IN ('Paid', 'Unpaid')),
        CreatedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
        FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId)
    );
END
GO

-- Petty Cash Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCash')
BEGIN
    CREATE TABLE PettyCash (
        EntryId VARCHAR(50) PRIMARY KEY,
        Description VARCHAR(500) NOT NULL,
        Amount DECIMAL(10, 2) NOT NULL,
        EntryType VARCHAR(50) NOT NULL CHECK (EntryType IN ('Income', 'Expense')),
        JobId VARCHAR(50) NULL,
        CreatedBy VARCHAR(50) NOT NULL,
        BalanceAfter DECIMAL(10, 2) NOT NULL,
        Date DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
    );
END
GO

-- Petty Cash Balance Table (to track current balance)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PettyCashBalance')
BEGIN
    CREATE TABLE PettyCashBalance (
        Id INT PRIMARY KEY DEFAULT 1,
        Balance DECIMAL(10, 2) DEFAULT 1000.00,
        LastUpdated DATETIME DEFAULT GETDATE(),
        CHECK (Id = 1)
    );

    -- Insert initial balance
    INSERT INTO PettyCashBalance (Id, Balance, LastUpdated)
    VALUES (1, 1000.00, GETDATE());
END
GO

-- Create Indexes for better performance
CREATE INDEX IX_Jobs_CustomerId ON Jobs(CustomerId);
CREATE INDEX IX_Jobs_AssignedTo ON Jobs(AssignedTo);
CREATE INDEX IX_Jobs_Status ON Jobs(Status);
CREATE INDEX IX_Bills_JobId ON Bills(JobId);
CREATE INDEX IX_Bills_CustomerId ON Bills(CustomerId);
CREATE INDEX IX_PayItems_JobId ON PayItems(JobId);
CREATE INDEX IX_PettyCash_JobId ON PettyCash(JobId);
CREATE INDEX IX_PettyCash_CreatedBy ON PettyCash(CreatedBy);
GO

PRINT 'Database schema created successfully!';
