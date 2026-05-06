-- Fix NULL invoiceDate and InvoiceNumber values in Bills table
-- Set invoiceDate to CreatedDate or BillDate for existing bills
-- Set InvoiceNumber to a generated value based on BillId for existing bills

-- Fix NULL invoiceDate values
UPDATE Bills
SET invoiceDate = COALESCE(BillDate, CreatedDate, GETDATE())
WHERE invoiceDate IS NULL;

-- Fix NULL or empty InvoiceNumber values
-- Generate invoice number from BillId (e.g., BILL0001 -> INV-0001)
UPDATE Bills
SET InvoiceNumber = 'INV-' + RIGHT(BillId, 4)
WHERE InvoiceNumber IS NULL OR InvoiceNumber = '';

-- Verify the update
SELECT 
  BillId,
  JobId,
  InvoiceNumber,
  invoiceDate,
  BillDate,
  CreatedDate,
  PaymentStatus
FROM Bills
WHERE invoiceDate IS NOT NULL AND InvoiceNumber IS NOT NULL
ORDER BY invoiceDate DESC;

-- Check if any NULL values remain
SELECT 
  COUNT(*) as NullInvoiceDateCount,
  (SELECT COUNT(*) FROM Bills WHERE InvoiceNumber IS NULL OR InvoiceNumber = '') as NullInvoiceNumberCount
FROM Bills
WHERE invoiceDate IS NULL;
