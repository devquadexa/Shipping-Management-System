-- ============================================================
-- Migration: Add 'Partially Paid' to Bills.PaymentStatus CHECK constraint
-- Error fixed: CK__Bills__PaymentSt__52E34C9D did not allow 'Partially Paid'
-- ============================================================

-- Step 1: Drop the old auto-named CHECK constraint
--         The system name may vary across environments, so we look it up dynamically.
DECLARE @constraintName NVARCHAR(256);

SELECT @constraintName = cc.name
FROM   sys.check_constraints cc
JOIN   sys.columns           col ON cc.parent_object_id = col.object_id
                                 AND cc.parent_column_id = col.column_id
JOIN   sys.tables            t   ON cc.parent_object_id = t.object_id
WHERE  t.name   = 'Bills'
AND    col.name = 'PaymentStatus';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Bills DROP CONSTRAINT [' + @constraintName + ']');
    PRINT '✓ Dropped old PaymentStatus constraint: ' + @constraintName;
END
ELSE
BEGIN
    PRINT '⚠ No existing PaymentStatus CHECK constraint found — skipping drop.';
END
GO

-- Step 2: Add new constraint that includes 'Partially Paid'
IF NOT EXISTS (
    SELECT 1
    FROM   sys.check_constraints cc
    JOIN   sys.tables t ON cc.parent_object_id = t.object_id
    WHERE  t.name  = 'Bills'
    AND    cc.name = 'CK_Bills_PaymentStatus'
)
BEGIN
    ALTER TABLE Bills
    ADD CONSTRAINT CK_Bills_PaymentStatus
    CHECK (PaymentStatus IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'));

    PRINT '✓ Added new CK_Bills_PaymentStatus constraint (includes Partially Paid)';
END
ELSE
BEGIN
    PRINT '⚠ CK_Bills_PaymentStatus already exists — skipping.';
END
GO

PRINT '✅ PaymentStatus constraint migration complete.';
