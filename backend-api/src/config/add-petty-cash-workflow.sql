-- Petty Cash Workflow Enhancement
-- This script adds comprehensive petty cash assignment and settlement functionality

-- Drop existing PettyCash table and recreate with new structure
IF OBJECT_ID('PettyCashSettlementItems', 'U') IS NOT NULL
    DROP TABLE PettyCashSettlementItems;

IF OBJECT_ID('PettyCashAssignments', 'U') IS NOT NULL
    DROP TABLE PettyCashAssignments;

-- Create PettyCashAssignments table
CREATE TABLE PettyCashAssignments (
    assignmentId INT IDENTITY(1,1) PRIMARY KEY,
    jobId VARCHAR(50) NOT NULL,
    assignedTo VARCHAR(50) NOT NULL,
    assignedBy VARCHAR(50) NOT NULL,
    assignedAmount DECIMAL(18, 2) NOT NULL,
    assignedDate DATETIME NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(20) NOT NULL DEFAULT 'Assigned', -- Assigned, Settled, Returned
    settlementDate DATETIME NULL,
    actualSpent DECIMAL(18, 2) NULL,
    balanceAmount DECIMAL(18, 2) NULL,
    overAmount DECIMAL(18, 2) NULL,
    notes NVARCHAR(500) NULL,
    CONSTRAINT FK_PettyCashAssignments_Jobs FOREIGN KEY (jobId) REFERENCES Jobs(JobId),
    CONSTRAINT FK_PettyCashAssignments_AssignedTo FOREIGN KEY (assignedTo) REFERENCES Users(UserId),
    CONSTRAINT FK_PettyCashAssignments_AssignedBy FOREIGN KEY (assignedBy) REFERENCES Users(UserId)
);
GO

-- Create PettyCashSettlementItems table
CREATE TABLE PettyCashSettlementItems (
    settlementItemId INT IDENTITY(1,1) PRIMARY KEY,
    assignmentId INT NOT NULL,
    itemName NVARCHAR(200) NOT NULL,
    actualCost DECIMAL(18, 2) NOT NULL,
    isCustomItem BIT NOT NULL DEFAULT 0,
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PettyCashSettlementItems_Assignment FOREIGN KEY (assignmentId) REFERENCES PettyCashAssignments(assignmentId)
);
GO

-- Add index for better performance
CREATE INDEX IX_PettyCashAssignments_JobId ON PettyCashAssignments(jobId);
CREATE INDEX IX_PettyCashAssignments_AssignedTo ON PettyCashAssignments(assignedTo);
CREATE INDEX IX_PettyCashAssignments_Status ON PettyCashAssignments(status);
CREATE INDEX IX_PettyCashSettlementItems_AssignmentId ON PettyCashSettlementItems(assignmentId);
GO

-- Add petty cash settlement status to Jobs table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'pettyCashStatus')
BEGIN
    ALTER TABLE Jobs ADD pettyCashStatus NVARCHAR(20) NULL;
END
GO

-- Update existing jobs to have default status
UPDATE Jobs SET pettyCashStatus = 'Not Assigned' WHERE pettyCashStatus IS NULL;
GO

-- Now make it NOT NULL with default
ALTER TABLE Jobs ALTER COLUMN pettyCashStatus NVARCHAR(20) NOT NULL;
GO

-- Add default constraint
IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_Jobs_pettyCashStatus')
BEGIN
    ALTER TABLE Jobs ADD CONSTRAINT DF_Jobs_pettyCashStatus DEFAULT 'Not Assigned' FOR pettyCashStatus;
END
GO

-- Add constraint to Bills table to ensure petty cash is settled before billing
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Bills') AND name = 'pettyCashSettled')
BEGIN
    ALTER TABLE Bills ADD pettyCashSettled BIT NULL;
END
GO

-- Update existing bills
UPDATE Bills SET pettyCashSettled = 0 WHERE pettyCashSettled IS NULL;
GO

-- Make it NOT NULL
ALTER TABLE Bills ALTER COLUMN pettyCashSettled BIT NOT NULL;
GO

-- Add default constraint
IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF_Bills_pettyCashSettled')
BEGIN
    ALTER TABLE Bills ADD CONSTRAINT DF_Bills_pettyCashSettled DEFAULT 0 FOR pettyCashSettled;
END
GO

PRINT 'Petty Cash Workflow tables created successfully!';
PRINT 'Tables created:';
PRINT '  - PettyCashAssignments: Tracks petty cash assignments to users for jobs';
PRINT '  - PettyCashSettlementItems: Stores settlement details with actual costs';
PRINT 'Jobs table updated with pettyCashStatus column';
PRINT 'Bills table updated with pettyCashSettled column';
