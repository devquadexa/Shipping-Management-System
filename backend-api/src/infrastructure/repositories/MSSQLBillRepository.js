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
      .input('paymentStatus', this.sql.VarChar, bill.paymentStatus)
      .input('invoiceNumber', this.sql.VarChar, bill.invoiceNumber)
      .query(`
        INSERT INTO Bills (BillId, JobId, CustomerId, Amount, Tax, Total, ActualCost, BillingAmount, Profit, PaymentStatus, InvoiceNumber, CreatedDate, BillDate)
        VALUES (@billId, @jobId, @customerId, @amount, @tax, @total, @actualCost, @billingAmount, @profit, @paymentStatus, @invoiceNumber, GETDATE(), GETDATE())
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

  async update(billId, bill) {
    const pool = await this.db();
    
    await pool.request()
      .input('billId', this.sql.VarChar, billId)
      .input('amount', this.sql.Decimal(10, 2), bill.amount)
      .input('tax', this.sql.Decimal(10, 2), bill.tax)
      .input('total', this.sql.Decimal(10, 2), bill.total)
      .input('paymentStatus', this.sql.VarChar, bill.paymentStatus)
      .query(`
        UPDATE Bills 
        SET Amount = @amount, Tax = @tax, Total = @total, PaymentStatus = @paymentStatus
        WHERE BillId = @billId
      `);
    
    return await this.findById(billId);
  }

  async markAsPaid(billId) {
    const pool = await this.db();
    
    await pool.request()
      .input('billId', this.sql.VarChar, billId)
      .query("UPDATE Bills SET PaymentStatus = 'Paid' WHERE BillId = @billId");
    
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
      paymentStatus: row.PaymentStatus,
      createdDate: row.CreatedDate,
      billDate: row.BillDate || row.CreatedDate,
      paidDate: row.PaidDate,
      invoiceNumber: row.InvoiceNumber
    });
  }
}

module.exports = MSSQLBillRepository;
