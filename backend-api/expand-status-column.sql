-- Migration: Expand PettyCashAssignments status column from nvarchar(20) to nvarchar(50)
-- Required for new longer status values:
--   'Balance To Be Return'         (20 chars - fits but tight)
--   'Pending Approval / Balance'   (26 chars - EXCEEDS 20!)
--   'Pending Approval / Over Due'  (27 chars - EXCEEDS 20!)
--   'Settled / Balance Returned'   (26 chars - EXCEEDS 20!)
--   'Settled / Over Due Collected' (28 chars - EXCEEDS 20!)

ALTER TABLE PettyCashAssignments
ALTER COLUMN status NVARCHAR(50) NOT NULL;

PRINT 'PettyCashAssignments.status column expanded to NVARCHAR(50)';
