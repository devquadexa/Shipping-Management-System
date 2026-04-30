/**
 * MSSQL Payment Repository Implementation
 * Handles all database operations for Payments
 */
const IPaymentRepository = require('../../domain/repositories/IPaymentRepository');
const Payment = require('../../domain/entities/Payment');

class MSSQLPaymentRepository extends IPaymentRepository {
  constructor(getConnection, sql) {
    super();
    this.db = getConnection;
    this.sql = sql;
  }

  async create(payment) {
    const pool = await this.db();
    
    await pool.request()
      .input('paymentId', this.sql.VarChar, payment.paymentId)
      .input('jobId', this.sql.VarChar, payment.jobId)
      .input('customerId', this.sql.VarChar(20), payment.customerId)
      .input('customerName', this.sql.NVarChar, payment.customerName)
      .input('invoiceNumber', this.sql.VarChar, payment.invoiceNumber)
      .input('billId', this.sql.VarChar, payment.billId)
      .input('paymentMethod', this.sql.VarChar, payment.paymentMethod)
      .input('paymentDate', this.sql.DateTime, payment.paymentDate)
      .input('amount', this.sql.Decimal(18, 2), payment.amount)
      .input('status', this.sql.VarChar, payment.status || 'Pending')
      .input('chequeNumber', this.sql.VarChar, payment.chequeNumber || null)
      .input('chequeDate', this.sql.Date, payment.chequeDate || null)
      .input('chequeAmount', this.sql.Decimal(18, 2), payment.chequeAmount || null)
      .input('bankName', this.sql.NVarChar, payment.bankName || null)
      .input('referenceNumber', this.sql.VarChar, payment.referenceNumber || null)
      .input('notes', this.sql.NVarChar, payment.notes || null)
      .input('createdBy', this.sql.VarChar, payment.createdBy || null)
      .query(`
        INSERT INTO Payments (
          PaymentId, JobId, CustomerId, CustomerName, InvoiceNumber, BillId,
          PaymentMethod, PaymentDate, Amount, Status,
          ChequeNumber, ChequeDate, ChequeAmount, BankName, ReferenceNumber,
          Notes, CreatedBy, CreatedDate
        )
        VALUES (
          @paymentId, @jobId, @customerId, @customerName, @invoiceNumber, @billId,
          @paymentMethod, @paymentDate, @amount, @status,
          @chequeNumber, @chequeDate, @chequeAmount, @bankName, @referenceNumber,
          @notes, @createdBy, GETDATE()
        )
      `);
    
    return payment;
  }

  async findById(paymentId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('paymentId', this.sql.VarChar, paymentId)
      .query('SELECT * FROM Payments WHERE PaymentId = @paymentId');
    
    return result.recordset[0] ? this.mapToEntity(result.recordset[0]) : null;
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    let query = `
      SELECT p.*, j.CUSDECNumber, j.CUSDECDate
      FROM Payments p
      LEFT JOIN Jobs j ON p.JobId = j.JobId
      WHERE 1=1
    `;
    const request = pool.request();
    
    if (filters.status) {
      query += ' AND p.Status = @status';
      request.input('status', this.sql.VarChar, filters.status);
    }
    
    if (filters.paymentMethod) {
      query += ' AND p.PaymentMethod = @paymentMethod';
      request.input('paymentMethod', this.sql.VarChar, filters.paymentMethod);
    }
    
    if (filters.customerId) {
      query += ' AND p.CustomerId = @customerId';
      request.input('customerId', this.sql.VarChar(20), filters.customerId);
    }
    
    if (filters.jobId) {
      query += ' AND p.JobId = @jobId';
      request.input('jobId', this.sql.VarChar, filters.jobId);
    }
    
    query += ' ORDER BY p.PaymentDate DESC, p.CreatedDate DESC';
    
    const result = await request.query(query);
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByJob(jobId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('SELECT * FROM Payments WHERE JobId = @jobId ORDER BY PaymentDate DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByCustomer(customerId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('customerId', this.sql.VarChar(20), customerId)
      .query('SELECT * FROM Payments WHERE CustomerId = @customerId ORDER BY PaymentDate DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByBillId(billId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('billId', this.sql.VarChar, billId)
      .query(`
        SELECT p.*, j.CUSDECNumber, j.CUSDECDate
        FROM Payments p
        LEFT JOIN Jobs j ON p.JobId = j.JobId
        WHERE p.BillId = @billId
        ORDER BY p.PaymentDate ASC, p.CreatedDate ASC
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByChequeNumber(chequeNumber) {
    const pool = await this.db();
    const result = await pool.request()
      .input('chequeNumber', this.sql.VarChar, chequeNumber)
      .query('SELECT * FROM Payments WHERE ChequeNumber = @chequeNumber AND PaymentMethod = \'Cheque\' ORDER BY PaymentDate ASC');
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByStatus(status) {
    const pool = await this.db();
    const result = await pool.request()
      .input('status', this.sql.VarChar, status)
      .query('SELECT * FROM Payments WHERE Status = @status ORDER BY PaymentDate DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByPaymentMethod(paymentMethod) {
    const pool = await this.db();
    const result = await pool.request()
      .input('paymentMethod', this.sql.VarChar, paymentMethod)
      .query('SELECT * FROM Payments WHERE PaymentMethod = @paymentMethod ORDER BY PaymentDate DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async updateStatus(paymentId, status, statusDate = new Date()) {
    const pool = await this.db();
    
    const request = pool.request()
      .input('paymentId', this.sql.VarChar, paymentId)
      .input('status', this.sql.VarChar, status)
      .input('statusDate', this.sql.DateTime, statusDate);
    
    let query = 'UPDATE Payments SET Status = @status, UpdatedDate = GETDATE()';
    
    if (status === 'Cleared') {
      query += ', ClearedDate = @statusDate';
    } else if (status === 'Bounced') {
      query += ', BouncedDate = @statusDate';
    }
    
    query += ' WHERE PaymentId = @paymentId';
    
    await request.query(query);
    
    return await this.findById(paymentId);
  }

  async update(paymentId, payment) {
    const pool = await this.db();
    
    const request = pool.request()
      .input('paymentId', this.sql.VarChar, paymentId);
    
    const updates = [];
    
    if (payment.status !== undefined) {
      request.input('status', this.sql.VarChar, payment.status);
      updates.push('Status = @status');
    }
    
    if (payment.amount !== undefined) {
      request.input('amount', this.sql.Decimal(18, 2), payment.amount);
      updates.push('Amount = @amount');
    }
    
    if (payment.chequeNumber !== undefined) {
      request.input('chequeNumber', this.sql.VarChar, payment.chequeNumber);
      updates.push('ChequeNumber = @chequeNumber');
    }
    
    if (payment.chequeDate !== undefined) {
      request.input('chequeDate', this.sql.Date, payment.chequeDate);
      updates.push('ChequeDate = @chequeDate');
    }
    
    if (payment.bankName !== undefined) {
      request.input('bankName', this.sql.NVarChar, payment.bankName);
      updates.push('BankName = @bankName');
    }
    
    if (payment.referenceNumber !== undefined) {
      request.input('referenceNumber', this.sql.VarChar, payment.referenceNumber);
      updates.push('ReferenceNumber = @referenceNumber');
    }
    
    if (payment.notes !== undefined) {
      request.input('notes', this.sql.NVarChar, payment.notes);
      updates.push('Notes = @notes');
    }
    
    if (updates.length > 0) {
      updates.push('UpdatedDate = GETDATE()');
      await request.query(`
        UPDATE Payments 
        SET ${updates.join(', ')}
        WHERE PaymentId = @paymentId
      `);
    }
    
    return await this.findById(paymentId);
  }

  async delete(paymentId) {
    const pool = await this.db();
    
    await pool.request()
      .input('paymentId', this.sql.VarChar, paymentId)
      .query('DELETE FROM Payments WHERE PaymentId = @paymentId');
  }

  async generateNextId() {
    const pool = await this.db();
    const result = await pool.request()
      .query(`
        SELECT MAX(CAST(SUBSTRING(PaymentId, 4, LEN(PaymentId) - 3) AS INT)) as MaxId 
        FROM Payments 
        WHERE PaymentId LIKE 'PAY%'
      `);
    
    const nextId = (result.recordset[0].MaxId || 0) + 1;
    return `PAY${String(nextId).padStart(6, '0')}`;
  }

  mapToEntity(row) {
    return new Payment({
      paymentId: row.PaymentId,
      jobId: row.JobId,
      customerId: row.CustomerId,
      customerName: row.CustomerName,
      invoiceNumber: row.InvoiceNumber,
      billId: row.BillId,
      paymentMethod: row.PaymentMethod,
      paymentDate: row.PaymentDate,
      amount: row.Amount,
      status: row.Status,
      chequeNumber: row.ChequeNumber,
      chequeDate: row.ChequeDate,
      chequeAmount: row.ChequeAmount,
      bankName: row.BankName,
      referenceNumber: row.ReferenceNumber,
      clearedDate: row.ClearedDate,
      bouncedDate: row.BouncedDate,
      notes: row.Notes,
      createdBy: row.CreatedBy,
      createdDate: row.CreatedDate,
      updatedDate: row.UpdatedDate,
      cusdecNumber: row.CUSDECNumber,
      cusdecDate: row.CUSDECDate
    });
  }
}

module.exports = MSSQLPaymentRepository;
