/**
 * Get Pending Payments Report
 * Retrieves all pending/unpaid invoices with optional date range and overdue filter
 */
class GetPendingPaymentsReport {
  constructor(billRepository) {
    this.billRepository = billRepository;
  }

  async execute(fromDate, toDate, showOverdueOnly = false) {
    const pool = await this.billRepository.db();
    
    // Convert Date objects to YYYY-MM-DD strings for proper comparison
    const fromDateStr = fromDate instanceof Date 
      ? fromDate.toISOString().split('T')[0] 
      : fromDate;
    const toDateStr = toDate instanceof Date 
      ? toDate.toISOString().split('T')[0] 
      : toDate;

    const request = pool.request()
      .input('fromDate', this.billRepository.sql.VarChar, fromDateStr)
      .input('toDate', this.billRepository.sql.VarChar, toDateStr);

    let whereClause = `
      WHERE b.PaymentStatus IN ('Unpaid', 'Partially Paid')
        AND CONVERT(DATE, b.invoiceDate) BETWEEN CONVERT(DATE, @fromDate) AND CONVERT(DATE, @toDate)
    `;

    if (showOverdueOnly) {
      whereClause += ` AND (b.isOverdue = 1 OR b.dueDate < GETDATE())`;
    }

    const result = await request.query(`
      SELECT 
        b.BillId,
        b.JobId,
        b.CustomerId,
        b.InvoiceNumber,
        b.invoiceDate,
        b.dueDate,
        b.grossTotal,
        b.netTotal,
        b.advancePayment,
        b.paidAmount,
        b.remainingAmount,
        b.PaymentStatus,
        b.isOverdue,
        c.Name as customerName,
        j.shipmentCategory,
        j.containerNumber,
        j.blNumber
      FROM Bills b
      LEFT JOIN Customers c ON b.CustomerId = c.customerId
      LEFT JOIN Jobs j ON b.JobId = j.jobId
      ${whereClause}
      ORDER BY b.invoiceDate DESC, b.JobId ASC
    `);

    return result.recordset.map(row => ({
      billId: row.BillId,
      jobId: row.JobId,
      customerId: row.CustomerId,
      customerName: row.customerName || '-',
      invoiceNumber: row.InvoiceNumber,
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,
      grossTotal: parseFloat(row.grossTotal) || 0,
      netTotal: parseFloat(row.netTotal) || 0,
      advancePayment: parseFloat(row.advancePayment) || 0,
      paidAmount: parseFloat(row.paidAmount) || 0,
      remainingAmount: parseFloat(row.remainingAmount) || parseFloat(row.netTotal) || 0,
      paymentStatus: row.PaymentStatus,
      isOverdue: row.isOverdue || false,
      shipmentCategory: row.shipmentCategory,
      containerNumber: row.containerNumber,
      blNumber: row.blNumber
    }));
  }
}

module.exports = GetPendingPaymentsReport;
