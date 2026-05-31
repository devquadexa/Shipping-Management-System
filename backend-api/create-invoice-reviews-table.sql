-- Create invoice_reviews table for SQL Server
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'invoice_reviews')
BEGIN
  CREATE TABLE invoice_reviews (
    reviewId VARCHAR(50) PRIMARY KEY,
    jobId VARCHAR(50) NOT NULL,
    clerkId VARCHAR(50) NOT NULL,
    sentBy VARCHAR(50) NOT NULL,
    reviewNotes NVARCHAR(MAX) NOT NULL,
    payItems NVARCHAR(MAX),
    invoiceDetails NVARCHAR(MAX),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    rejectionReason NVARCHAR(MAX),
    createdDate DATETIME DEFAULT GETDATE(),
    updatedDate DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (jobId) REFERENCES Jobs(JobId) ON DELETE NO ACTION,
    FOREIGN KEY (clerkId) REFERENCES Users(UserId) ON DELETE NO ACTION,
    FOREIGN KEY (sentBy) REFERENCES Users(UserId) ON DELETE NO ACTION
  );
  
  -- Create indexes
  CREATE INDEX idx_clerkId ON invoice_reviews(clerkId);
  CREATE INDEX idx_jobId ON invoice_reviews(jobId);
  CREATE INDEX idx_sentBy ON invoice_reviews(sentBy);
  CREATE INDEX idx_status ON invoice_reviews(status);
  CREATE INDEX idx_createdDate ON invoice_reviews(createdDate);
  CREATE INDEX idx_clerk_status ON invoice_reviews(clerkId, status);
  CREATE INDEX idx_job_status ON invoice_reviews(jobId, status);
  
  PRINT 'invoice_reviews table created successfully';
END
ELSE
BEGIN
  PRINT 'invoice_reviews table already exists';
END;
