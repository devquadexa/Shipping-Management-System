-- Create OldInvoices table for historical invoice data entry
CREATE TABLE OldInvoices (
    oldInvoiceId INT IDENTITY(1,1) PRIMARY KEY,
    customerId VARCHAR(20) NOT NULL,
    cusdecNumber NVARCHAR(100),
    cusdecDate DATE,
    invoiceDate DATE NOT NULL,
    invoiceNumber NVARCHAR(100) NOT NULL UNIQUE,
    totalAmount DECIMAL(18, 2) NOT NULL,
    amountReceived DECIMAL(18, 2) DEFAULT 0,
    balance DECIMAL(18, 2) NOT NULL,
    status NVARCHAR(50) DEFAULT 'Pending',
    settleDate DATE,
    daysAfterInvoice INT,
    createdAt DATETIME DEFAULT GETDATE(),
    createdBy VARCHAR(50),
    updatedAt DATETIME,
    FOREIGN KEY (customerId) REFERENCES Customers(customerId)
);

-- Create OldInvoicePayments table for tracking multiple payments
CREATE TABLE OldInvoicePayments (
    paymentId INT IDENTITY(1,1) PRIMARY KEY,
    oldInvoiceId INT NOT NULL,
    paymentAmount DECIMAL(18, 2) NOT NULL,
    paymentMethod NVARCHAR(50) NOT NULL,
    receivedDate DATE NOT NULL,
    notes NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE(),
    createdBy VARCHAR(50),
    FOREIGN KEY (oldInvoiceId) REFERENCES OldInvoices(oldInvoiceId) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IX_OldInvoices_CustomerId ON OldInvoices(customerId);
CREATE INDEX IX_OldInvoices_InvoiceDate ON OldInvoices(invoiceDate);
CREATE INDEX IX_OldInvoices_Status ON OldInvoices(status);
CREATE INDEX IX_OldInvoicePayments_OldInvoiceId ON OldInvoicePayments(oldInvoiceId);
