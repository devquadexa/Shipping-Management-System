/**
 * MSSQL Bill Repository Implementation
 * Handles all database operations for Bills
 */
const IBillRepository = require('../../domain/repositories/IBillRepository');
const Bill = require('../../domain/entities/Bill');

class MSSQLBillRepository extends IBillRepository {
  constructor(getConnection, sql) {
    super();
    this.db = getConnection;
    this.sql = sql;
  }

  async create(bill) {
    const pool = await this.db();
    
    await pool.request()
      .input('billId', this.sql.VarChar, bill.billId)
      .input('jobId', this.sql.VarChar, bill.jobId)
      .input('customerId', this.sql.VarChar, bill.customerId)
      .input('amount', this.sql.Decimal(10, 2), bill.amount || bill.billingAmount)
      .input('tax', this.sql.Decimal(10, 2), bill.tax)
      .input('total', this.sql.Decimal(10, 2), bill.total)
      .input('actualCost', this.sql.Decimal(10, 2), bill.actualCost)
      .input('billingAmount', this.sql.Decimal(10, 2), bill.billingAmount)
      .input('profit', this.sql.Decimal(10, 2), bill.profit)
      .input('advancePayment', this.sql.Decimal(18, 2), bill.advancePayment || 0.00)
      .input('grossTotal', this.sql.Decimal(18, 2), bill.grossTotal || bill.billingAmount)
      .input('netTotal', this.sql.Decimal(18, 2), bill.netTotal || bill.billingAmount)
      .input('paymentStatus', this.sql.VarChar, bill.paymentStatus)
      .input('invoiceNumber', this.sql.VarChar, bill.invoiceNumber)
      .input('invoiceDate', this.sql.DateTime, bill.invoiceDate || new Date())
      .input('dueDate', this.sql.DateTime, bill.dueDate)
      .input('isOverdue', this.sql.Bit, bill.isOverdue || false)
      .query(`
        INSERT INTO Bills (BillId, JobId, CustomerId, Amount, Tax, Total, ActualCost, BillingAmount, Profit, advancePayment, grossTotal, netTotal, PaymentStatus, InvoiceNumber, CreatedDate, BillDate, invoiceDate, dueDate, isOverdue)
        VALUES (@billId, @jobId, @customerId, @amount, @tax, @total, @actualCost, @billingAmount, @profit, @advancePayment, @grossTotal, @netTotal, @paymentStatus, @invoiceNumber, GETDATE(), GETDATE(), @invoiceDate, @dueDate, @isOverdue)
      `);
    
    return bill;
  }

  async findById(billId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('billId', this.sql.VarChar, billId)
      .query('SELECT * FROM Bills WHERE BillId = @billId');
    
    return result.recordset[0] ? this.mapToEntity(result.recordset[0]) : null;
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    let query = 'SELECT * FROM Bills';
    const conditions = [];
    
    if (filters.paymentStatus) {
      conditions.push('PaymentStatus = @paymentStatus');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY CreatedDate DESC';
    
    const request = pool.request();
    if (filters.paymentStatus) {
      request.input('paymentStatus', this.sql.VarChar, filters.paymentStatus);
    }
    
    const result = await request.query(query);
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByJob(jobId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('SELECT * FROM Bills WHERE JobId = @jobId');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByCustomer(customerId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('SELECT * FROM Bills WHERE CustomerId = @customerId ORDER BY CreatedDate DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findUnpaid() {
    const pool = await this.db();
    const result = await pool.request()
      .query("SELECT * FROM Bills WHERE PaymentStatus = 'Unpaid' ORDER BY CreatedDate DESC");
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async update(billId, bill) {
    const pool = await this.db();
    
    const request = pool.request()
      .input('billId', this.sql.VarChar, billId);
    
    const updates = [];
    
    if (bill.amount !== undefined) {
      request.input('amount', this.sql.Decimal(10, 2), bill.amount);
      updates.push('Amount = @amount');
    }
    if (bill.tax !== undefined) {
      request.input('tax', this.sql.Decimal(10, 2), bill.tax);
      updates.push('Tax = @tax');
    }
    if (bill.total !== undefined) {
      request.input('total', this.sql.Decimal(10, 2), bill.total);
      updates.push('Total = @total');
    }
    if (bill.advancePayment !== undefined) {
      request.input('advancePayment', this.sql.Decimal(18, 2), bill.advancePayment);
      updates.push('advancePayment = @advancePayment');
    }
    if (bill.grossTotal !== undefined) {
      request.input('grossTotal', this.sql.Decimal(18, 2), bill.grossTotal);
      updates.push('grossTotal = @grossTotal');
    }
    if (bill.netTotal !== undefined) {
      request.input('netTotal', this.sql.Decimal(18, 2), bill.netTotal);
      updates.push('netTotal = @netTotal');
    }
    if (bill.paymentStatus !== undefined) {
      request.input('paymentStatus', this.sql.VarChar, bill.paymentStatus);
      updates.push('PaymentStatus = @paymentStatus');
    }
    if (bill.isOverdue !== undefined) {
      request.input('isOverdue', this.sql.Bit, bill.isOverdue);
      updates.push('isOverdue = @isOverdue');
    }
    
    if (updates.length > 0) {
      await request.query(`
        UPDATE Bills 
        SET ${updates.join(', ')}
        WHERE BillId = @billId
      `);
    }
    
    return await this.findById(billId);
  }

  async markAsPaid(billId, paymentDetails = {}) {
    const pool = await this.db();

    // Get current bill to calculate paidAmount
    const bill = await this.findById(billId);
    const invoiceTotal = parseFloat(bill?.netTotal || bill?.total || 0);

    const request = pool.request()
      .input('billId', this.sql.VarChar, billId)
      .input('paidDate', this.sql.DateTime, paymentDetails.paidDate ? new Date(paymentDetails.paidDate) : new Date())
      .input('paidAmount', this.sql.Decimal(18, 2), invoiceTotal)
      .input('remainingAmount', this.sql.Decimal(18, 2), 0);

    const updates = ["PaymentStatus = 'Paid'", "paidDate = @paidDate",
                     "paidAmount = @paidAmount", "remainingAmount = @remainingAmount"];

    if (paymentDetails.paymentMethod) {
      request.input('paymentMethod', this.sql.VarChar, paymentDetails.paymentMethod);
      updates.push('paymentMethod = @paymentMethod');
    }
    if (paymentDetails.chequeNumber) {
      request.input('chequeNumber', this.sql.VarChar, paymentDetails.chequeNumber);
      updates.push('chequeNumber = @chequeNumber');
    }
    if (paymentDetails.chequeDate) {
      request.input('chequeDate', this.sql.Date, paymentDetails.chequeDate);
      updates.push('chequeDate = @chequeDate');
    }
    if (paymentDetails.chequeAmount) {
      request.input('chequeAmount', this.sql.Decimal(18, 2), paymentDetails.chequeAmount);
      updates.push('chequeAmount = @chequeAmount');
    }
    if (paymentDetails.bankName) {
      request.input('bankName', this.sql.VarChar, paymentDetails.bankName);
      updates.push('bankName = @bankName');
    }

    await request.query(`UPDATE Bills SET ${updates.join(', ')} WHERE BillId = @billId`);
    return await this.findById(billId);
  }

  async applyPartialPayment(billId, paymentAmount, paymentDetails = {}) {
    const pool = await this.db();

    // Get current bill
    const bill = await this.findById(billId);
    if (!bill) throw new Error('Bill not found');

    const invoiceTotal = parseFloat(bill.netTotal || bill.total || 0);
    const currentPaid = parseFloat(bill.paidAmount) || 0;
    const newPaidAmount = currentPaid + parseFloat(paymentAmount);
    const newRemaining = Math.max(0, invoiceTotal - newPaidAmount);
    const newStatus = newRemaining <= 0 ? 'Paid' : 'Partially Paid';

    const request = pool.request()
      .input('billId', this.sql.VarChar, billId)
      .input('paidAmount', this.sql.Decimal(18, 2), newPaidAmount)
      .input('remainingAmount', this.sql.Decimal(18, 2), newRemaining)
      .input('paymentStatus', this.sql.VarChar, newStatus);

    // Only update the running totals and status on the Bills row.
    // Payment method details (paymentMethod, chequeNumber, bankName, etc.) are
    // stored per-payment in the Payments table — do NOT overwrite them here so
    // that a second payment never erases the first payment's details on the bill.
    const updates = [
      'paidAmount = @paidAmount',
      'remainingAmount = @remainingAmount',
      'PaymentStatus = @paymentStatus'
    ];

    if (newStatus === 'Paid' || newStatus === 'Partially Paid') {
      request.input('paidDate', this.sql.DateTime, paymentDetails.paidDate ? new Date(paymentDetails.paidDate) : new Date());
      updates.push('paidDate = @paidDate');
    }

    await request.query(`UPDATE Bills SET ${updates.join(', ')} WHERE BillId = @billId`);
    return await this.findById(billId);
  }

  async replaceBill(billId, billData) {
    const pool = await this.db();

    await pool.request()
      .input('billId', this.sql.VarChar, billId)
      .input('customerId', this.sql.VarChar, billData.customerId)
      .input('amount', this.sql.Decimal(10, 2), billData.amount || billData.billingAmount)
      .input('tax', this.sql.Decimal(10, 2), billData.tax || 0)
      .input('total', this.sql.Decimal(10, 2), billData.total)
      .input('actualCost', this.sql.Decimal(10, 2), billData.actualCost)
      .input('billingAmount', this.sql.Decimal(10, 2), billData.billingAmount)
      .input('profit', this.sql.Decimal(10, 2), billData.profit)
      .input('advancePayment', this.sql.Decimal(18, 2), billData.advancePayment || 0)
      .input('grossTotal', this.sql.Decimal(18, 2), billData.grossTotal)
      .input('netTotal', this.sql.Decimal(18, 2), billData.netTotal)
      .input('paymentStatus', this.sql.VarChar, billData.paymentStatus || 'Unpaid')
      .input('invoiceNumber', this.sql.VarChar, billData.invoiceNumber || null)
      .input('invoiceDate', this.sql.DateTime, billData.invoiceDate || new Date())
      .input('dueDate', this.sql.DateTime, billData.dueDate)
      .input('isOverdue', this.sql.Bit, billData.isOverdue || false)
      .query(`
        UPDATE Bills SET 
          CustomerId = @customerId,
          Amount = @amount,
          Tax = @tax,
          Total = @total,
          ActualCost = @actualCost,
          BillingAmount = @billingAmount,
          Profit = @profit,
          advancePayment = @advancePayment,
          grossTotal = @grossTotal,
          netTotal = @netTotal,
          PaymentStatus = @paymentStatus,
          InvoiceNumber = @invoiceNumber,
          invoiceDate = @invoiceDate,
          dueDate = @dueDate,
          isOverdue = @isOverdue,
          BillDate = GETDATE()
        WHERE BillId = @billId
      `);

    return await this.findById(billId);
  }

  async delete(billId) {
    const pool = await this.db();
    
    await pool.request()
      .input('billId', this.sql.VarChar, billId)
      .query('DELETE FROM Bills WHERE BillId = @billId');
  }

  async generateNextId() {
    const pool = await this.db();
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(BillId, 5, 4) AS INT)) as MaxId FROM Bills');
    
    const nextId = (result.recordset[0].MaxId || 0) + 1;
    return `BILL${String(nextId).padStart(4, '0')}`;
  }

  mapToEntity(row) {
    return new Bill({
      billId: row.BillId,
      jobId: row.JobId,
      customerId: row.CustomerId,
      amount: row.Amount,
      tax: row.Tax,
      total: row.Total,
      actualCost: row.ActualCost || 0,
      billingAmount: row.BillingAmount || row.Amount,
      profit: row.Profit || 0,
      advancePayment: row.advancePayment || 0.00,
      grossTotal: row.grossTotal || row.BillingAmount || row.Amount,
      netTotal: row.netTotal || row.BillingAmount || row.Amount,
      paymentStatus: row.PaymentStatus,
      createdDate: row.CreatedDate,
      billDate: row.BillDate || row.CreatedDate,
      paidDate: row.paidDate || row.PaidDate,
      invoiceNumber: row.InvoiceNumber,
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,
      isOverdue: row.isOverdue || false,
      paymentMethod: row.paymentMethod,
      chequeNumber: row.chequeNumber,
      chequeDate: row.chequeDate,
      chequeAmount: row.chequeAmount,
      bankName: row.bankName,
      paidAmount: row.paidAmount || 0,
      remainingAmount: row.remainingAmount !== undefined ? row.remainingAmount : (row.netTotal || row.total || 0)
    });
  }
}

module.exports = MSSQLBillRepository;
