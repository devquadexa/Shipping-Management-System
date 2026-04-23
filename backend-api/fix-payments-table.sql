-- Drop the Payments table if it exists (to start fresh)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Payments')
BEGIN
    DROP TABLE Payments;
    PRINT 'Existing Payments table dropped';
END
GO

-- Create Payments table with correct CustomerId length (VARCHAR(20))
CREATE TABLE Payments (
    PaymentId VARCHAR(50) PRIMARY KEY,
    JobId VARCHAR(50) NOT NULL,
    CustomerId VARCHAR(20) NOT NULL,
    CustomerName NVARCHAR(255),
    InvoiceNumber VARCHAR(50),
    BillId VARCHAR(50),
    PaymentMethod VARCHAR(50) NOT NULL, -- 'Cheque', 'Bank Transfer', 'Cash'
    PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
    Amount DECIMAL(18, 2) NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Cleared', 'Bounced'
    
    -- Cheque specific fields
    ChequeNumber VARCHAR(100),
    ChequeDate DATE,
    BankName NVARCHAR(255),
    
    -- Bank Transfer specific fields
    ReferenceNumber VARCHAR(100),
    
    -- Status tracking
    ClearedDate DATETIME,
    BouncedDate DATETIME,
    
    -- Additional info
    Notes NVARCHAR(MAX),
    CreatedBy VARCHAR(50),
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME,
    
    CONSTRAINT FK_Payments_Jobs FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
    CONSTRAINT FK_Payments_Customers FOREIGN KEY (CustomerId) REFERENCES Customers(CustomerId),
    CONSTRAINT FK_Payments_Bills FOREIGN KEY (BillId) REFERENCES Bills(BillId)
);

PRINT 'Payments table created successfully with correct CustomerId length (VARCHAR(20))';
GO

-- Create indexes for faster queries
CREATE INDEX IX_Payments_JobId ON Payments(JobId);
PRINT 'Index IX_Payments_JobId created';
GO

CREATE INDEX IX_Payments_CustomerId ON Payments(CustomerId);
PRINT 'Index IX_Payments_CustomerId created';
GO

CREATE INDEX IX_Payments_Status ON Payments(Status);
PRINT 'Index IX_Payments_Status created';
GO

CREATE INDEX IX_Payments_PaymentMethod ON Payments(PaymentMethod);
PRINT 'Index IX_Payments_PaymentMethod created';
GO

PRINT '✅ Payment tracking system setup complete!';
PRINT 'CustomerId column: VARCHAR(20) - matches Customers table';
