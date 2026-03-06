-- Update existing jobs to have pettyCashStatus
USE SuperShineCargoDb;
GO

-- Set default status for all existing jobs that don't have it
UPDATE Jobs 
SET pettyCashStatus = 'Not Assigned' 
WHERE pettyCashStatus IS NULL OR pettyCashStatus = '';
GO

-- Verify the update
SELECT jobId, pettyCashStatus 
FROM Jobs 
ORDER BY createdDate DESC;
GO

PRINT 'All existing jobs updated with pettyCashStatus = Not Assigned';
