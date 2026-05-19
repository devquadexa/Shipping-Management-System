/**
 * MSSQL Transporter Payment Repository
 * Handles all database operations for transporter payments
 */
class MSSQLTransporterPaymentRepository {
  constructor(getConnection, sql) {
    this.getConnection = getConnection;
    this.sql = sql;
  }

  async create(paymentData) {
    const pool = await this.getConnection();
    const paymentId = `TP${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await pool.request()
        .input('paymentId', this.sql.VarChar, paymentId)
        .input('jobId', this.sql.VarChar, paymentData.jobId)
        .input('transporterId', this.sql.VarChar, paymentData.transporterId)
        .input('amount', this.sql.Decimal(18, 2), paymentData.amount)
        .input('paymentMethod', this.sql.VarChar, paymentData.paymentMethod)
        .input('paymentDate', this.sql.DateTime, paymentData.paymentDate)
        .input('status', this.sql.VarChar, paymentData.status)
        .input('chequeNumber', this.sql.VarChar, paymentData.chequeNumber)
        .input('chequeDate', this.sql.Date, paymentData.chequeDate)
        .input('chequeAmount', this.sql.Decimal(18, 2), paymentData.chequeAmount)
        .input('bankName', this.sql.NVarChar, paymentData.bankName)
        .input('paidBy', this.sql.VarChar, paymentData.paidBy)
        .input('paidByName', this.sql.NVarChar, paymentData.paidByName)
        .input('notes', this.sql.NVarChar, paymentData.notes)
        .query(`
          INSERT INTO TransporterPayments (
            PaymentId, JobId, TransporterId, Amount, PaymentMethod, PaymentDate, Status,
            ChequeNumber, ChequeDate, ChequeAmount, BankName, PaidBy, PaidByName, Notes, CreatedDate
          )
          VALUES (
            @paymentId, @jobId, @transporterId, @amount, @paymentMethod, @paymentDate, @status,
            @chequeNumber, @chequeDate, @chequeAmount, @bankName, @paidBy, @paidByName, @notes, GETDATE()
          )
        `);

      return {
        paymentId,
        ...paymentData,
        createdDate: new Date(),
      };
    } catch (error) {
      console.error('Error creating transporter payment:', error);
      throw error;
    }
  }

  async findByTransporterId(transporterId, filters = {}) {
    const pool = await this.getConnection();

    try {
      let query = `
        SELECT * FROM TransporterPayments
        WHERE TransporterId = @transporterId
      `;

      const request = pool.request()
        .input('transporterId', this.sql.VarChar, transporterId);

      // Add filters
      if (filters.status) {
        query += ` AND Status = @status`;
        request.input('status', this.sql.VarChar, filters.status);
      }

      if (filters.fromDate) {
        query += ` AND PaymentDate >= @fromDate`;
        request.input('fromDate', this.sql.DateTime, new Date(filters.fromDate));
      }

      if (filters.toDate) {
        query += ` AND PaymentDate <= @toDate`;
        request.input('toDate', this.sql.DateTime, new Date(filters.toDate));
      }

      query += ` ORDER BY PaymentDate DESC`;

      const result = await request.query(query);
      return result.recordset || [];
    } catch (error) {
      console.error('Error fetching transporter payments:', error);
      throw error;
    }
  }

  async findByJobId(jobId) {
    const pool = await this.getConnection();

    try {
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query(`
          SELECT * FROM TransporterPayments
          WHERE JobId = @jobId
          ORDER BY PaymentDate DESC
        `);

      return result.recordset || [];
    } catch (error) {
      console.error('Error fetching payments for job:', error);
      throw error;
    }
  }

  async findById(paymentId) {
    const pool = await this.getConnection();

    try {
      const result = await pool.request()
        .input('paymentId', this.sql.VarChar, paymentId)
        .query(`
          SELECT * FROM TransporterPayments
          WHERE PaymentId = @paymentId
        `);

      return result.recordset?.[0] || null;
    } catch (error) {
      console.error('Error fetching transporter payment:', error);
      throw error;
    }
  }

  async updateStatus(paymentId, status) {
    const pool = await this.getConnection();

    try {
      const statusDate = status === 'Cleared' ? new Date() : null;

      const result = await pool.request()
        .input('paymentId', this.sql.VarChar, paymentId)
        .input('status', this.sql.VarChar, status)
        .input('statusDate', this.sql.DateTime, statusDate)
        .query(`
          UPDATE TransporterPayments
          SET Status = @status,
              ClearedDate = CASE WHEN @status = 'Cleared' THEN @statusDate ELSE ClearedDate END,
              UpdatedDate = GETDATE()
          WHERE PaymentId = @paymentId
        `);

      if (result.rowsAffected[0] === 0) {
        throw new Error('Payment not found');
      }

      return await this.findById(paymentId);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  async getOutstandingBalance(transporterId) {
    const pool = await this.getConnection();

    try {
      const result = await pool.request()
        .input('transporterId', this.sql.VarChar, transporterId)
        .query(`
          SELECT 
            SUM(Amount) as totalOutstanding
          FROM TransporterPayments
          WHERE TransporterId = @transporterId
            AND Status IN ('Pending', 'Bounced')
        `);

      return result.recordset?.[0]?.totalOutstanding || 0;
    } catch (error) {
      console.error('Error calculating outstanding balance:', error);
      throw error;
    }
  }
}

module.exports = MSSQLTransporterPaymentRepository;
