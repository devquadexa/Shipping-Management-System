-- Create TransporterPayments table for tracking transporter cost payments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TransporterPayments')
BEGIN
    CREATE TABLE TransporterPayments (
        PaymentId VARCHAR(50) PRIMARY KEY,
        JobId VARCHAR(50) NOT NULL,
        TransporterId VARCHAR(50) NOT NULL,
        Amount DECIMAL(18, 2) NOT NULL,
        PaymentMethod VARCHAR(50) NOT NULL, -- 'Cheque', 'Bank Transfer', 'Cash'
        PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
        Status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Cleared', 'Bounced'
        
        -- Cheque specific fields
        ChequeNumber VARCHAR(100),
        ChequeDate DATE,
        ChequeAmount DECIMAL(18, 2),
        BankName NVARCHAR(255),
        
        -- Status tracking
        ClearedDate DATETIME,
        
        -- Additional info
        Notes NVARCHAR(MAX),
        PaidBy VARCHAR(50),
        PaidByName NVARCHAR(255),
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedDate DATETIME,
        
        CONSTRAINT FK_TransporterPayments_Jobs FOREIGN KEY (JobId) REFERENCES Jobs(JobId),
        CONSTRAINT FK_TransporterPayments_Transporters FOREIGN KEY (TransporterId) REFERENCES Transporters(TransporterId)
    );
    
    PRINT 'TransporterPayments table created successfully';
END
ELSE
BEGIN
    PRINT 'TransporterPayments table already exists';
END
GO

-- Create indexes for faster queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TransporterPayments_JobId')
BEGIN
    CREATE INDEX IX_TransporterPayments_JobId ON TransporterPayments(JobId);
    PRINT 'Index IX_TransporterPayments_JobId created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TransporterPayments_TransporterId')
BEGIN
    CREATE INDEX IX_TransporterPayments_TransporterId ON TransporterPayments(TransporterId);
    PRINT 'Index IX_TransporterPayments_TransporterId created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TransporterPayments_Status')
BEGIN
    CREATE INDEX IX_TransporterPayments_Status ON TransporterPayments(Status);
    PRINT 'Index IX_TransporterPayments_Status created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TransporterPayments_PaymentDate')
BEGIN
    CREATE INDEX IX_TransporterPayments_PaymentDate ON TransporterPayments(PaymentDate);
    PRINT 'Index IX_TransporterPayments_PaymentDate created';
END
GO

PRINT 'Transporter payment tracking system setup complete';
