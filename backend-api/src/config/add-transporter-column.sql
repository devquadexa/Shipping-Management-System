-- Add Transporter column to Jobs table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Jobs') AND name = 'Transporter')
BEGIN
    ALTER TABLE Jobs ADD Transporter NVARCHAR(255) NULL;
    PRINT '✓ Column added: Jobs.Transporter';
END
ELSE
BEGIN
    PRINT '✓ Column already exists: Jobs.Transporter';
END
GO
