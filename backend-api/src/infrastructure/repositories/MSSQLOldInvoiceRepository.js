const IOldInvoiceRepository = require('../../domain/repositories/IOldInvoiceRepository');
const OldInvoice = require('../../domain/entities/OldInvoice');

class MSSQLOldInvoiceRepository extends IOldInvoiceRepository {
  constructor(getConnection, sql) {
    super();
    this.getConnection = getConnection;
    this.sql = sql;
  }

  async create(invoiceData) {
    try {
      const pool = await this.getConnection();
      
      const result = await pool.request()
        .input('customerId', this.sql.VarChar, invoiceData.customerId)
        .input('cusdecNumber', this.sql.NVarChar, invoiceData.cusdecNumber || null)
        .input('cusdecDate', this.sql.Date, invoiceData.cusdecDate || null)
        .input('invoiceDate', this.sql.Date, invoiceData.invoiceDate)
        .input('invoiceNumber', this.sql.NVarChar, invoiceData.invoiceNumber)
        .input('totalAmount', this.sql.Decimal(18, 2), invoiceData.totalAmount)
        .input('amountReceived', this.sql.Decimal(18, 2), invoiceData.amountReceived || 0)
        .input('balance', this.sql.Decimal(18, 2), invoiceData.balance)
        .input('status', this.sql.NVarChar, invoiceData.status || 'Pending')
        .input('settleDate', this.sql.Date, invoiceData.settleDate || null)
        .input('daysAfterInvoice', this.sql.Int, invoiceData.daysAfterInvoice || null)
        .input('createdBy', this.sql.VarChar, invoiceData.createdBy)
        .query(`
          INSERT INTO OldInvoices (
            customerId, cusdecNumber, cusdecDate, invoiceDate, invoiceNumber,
            totalAmount, amountReceived, balance, status, settleDate, 
            daysAfterInvoice, createdBy
          )
          OUTPUT INSERTED.*
          VALUES (
            @customerId, @cusdecNumber, @cusdecDate, @invoiceDate, @invoiceNumber,
            @totalAmount, @amountReceived, @balance, @status, @settleDate,
            @daysAfterInvoice, @createdBy
          )
        `);
      
      return await this.findById(result.recordset[0].oldInvoiceId);
    } catch (error) {
      console.error('Error creating old invoice:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            oi.*,
            c.name as customerName
          FROM OldInvoices oi
          LEFT JOIN Customers c ON oi.customerId = c.customerId
          ORDER BY oi.invoiceDate DESC, oi.createdAt DESC
        `);
      
      const invoices = await Promise.all(result.recordset.map(async (invoice) => {
        const payments = await this.getPayments(invoice.oldInvoiceId);
        return new OldInvoice({ ...invoice, payments });
      }));
      
      return invoices;
    } catch (error) {
      console.error('Error fetching all old invoices:', error);
      throw error;
    }
  }

  async findById(oldInvoiceId) {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
        .query(`
          SELECT 
            oi.*,
            c.name as customerName
          FROM OldInvoices oi
          LEFT JOIN Customers c ON oi.customerId = c.customerId
          WHERE oi.oldInvoiceId = @oldInvoiceId
        `);
      
      if (result.recordset.length === 0) return null;
      
      const invoice = result.recordset[0];
      const payments = await this.getPayments(oldInvoiceId);
      
      return new OldInvoice({ ...invoice, payments });
    } catch (error) {
      console.error('Error fetching old invoice by id:', error);
      throw error;
    }
  }

  async update(oldInvoiceId, invoiceData) {
    try {
      const pool = await this.getConnection();
      
      await pool.request()
        .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
        .input('customerId', this.sql.VarChar, invoiceData.customerId)
        .input('cusdecNumber', this.sql.NVarChar, invoiceData.cusdecNumber || null)
        .input('cusdecDate', this.sql.Date, invoiceData.cusdecDate || null)
        .input('invoiceDate', this.sql.Date, invoiceData.invoiceDate)
        .input('invoiceNumber', this.sql.NVarChar, invoiceData.invoiceNumber)
        .input('totalAmount', this.sql.Decimal(18, 2), invoiceData.totalAmount)
        .input('amountReceived', this.sql.Decimal(18, 2), invoiceData.amountReceived)
        .input('balance', this.sql.Decimal(18, 2), invoiceData.balance)
        .input('status', this.sql.NVarChar, invoiceData.status)
        .input('settleDate', this.sql.Date, invoiceData.settleDate || null)
        .input('daysAfterInvoice', this.sql.Int, invoiceData.daysAfterInvoice || null)
        .query(`
          UPDATE OldInvoices
          SET 
            customerId = @customerId,
            cusdecNumber = @cusdecNumber,
            cusdecDate = @cusdecDate,
            invoiceDate = @invoiceDate,
            invoiceNumber = @invoiceNumber,
            totalAmount = @totalAmount,
            amountReceived = @amountReceived,
            balance = @balance,
            status = @status,
            settleDate = @settleDate,
            daysAfterInvoice = @daysAfterInvoice,
            updatedAt = GETDATE()
          WHERE oldInvoiceId = @oldInvoiceId
        `);
      
      return await this.findById(oldInvoiceId);
    } catch (error) {
      console.error('Error updating old invoice:', error);
      throw error;
    }
  }

  async delete(oldInvoiceId) {
    try {
      const pool = await this.getConnection();
      await pool.request()
        .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
        .query('DELETE FROM OldInvoices WHERE oldInvoiceId = @oldInvoiceId');
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting old invoice:', error);
      throw error;
    }
  }

  async addPayment(oldInvoiceId, paymentData) {
    try {
      const pool = await this.getConnection();
      const transaction = new this.sql.Transaction(pool);
      
      await transaction.begin();
      
      try {
        // Insert payment
        await transaction.request()
          .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
          .input('paymentAmount', this.sql.Decimal(18, 2), paymentData.paymentAmount)
          .input('paymentMethod', this.sql.NVarChar, paymentData.paymentMethod)
          .input('receivedDate', this.sql.Date, paymentData.receivedDate)
          .input('notes', this.sql.NVarChar, paymentData.notes || null)
          .input('chequeNumber', this.sql.NVarChar, paymentData.chequeNumber || null)
          .input('chequeDate', this.sql.Date, paymentData.chequeDate || null)
          .input('chequeAmount', this.sql.Decimal(18, 2), paymentData.chequeAmount || null)
          .input('bankName', this.sql.NVarChar, paymentData.bankName || null)
          .input('createdBy', this.sql.VarChar, paymentData.createdBy)
          .query(`
            INSERT INTO OldInvoicePayments (
              oldInvoiceId, paymentAmount, paymentMethod, receivedDate, notes, 
              chequeNumber, chequeDate, chequeAmount, bankName, createdBy
            )
            VALUES (
              @oldInvoiceId, @paymentAmount, @paymentMethod, @receivedDate, @notes,
              @chequeNumber, @chequeDate, @chequeAmount, @bankName, @createdBy
            )
          `);
        
        // Update invoice totals
        const totalsResult = await transaction.request()
          .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
          .query(`
            SELECT 
              oi.totalAmount,
              ISNULL(SUM(oip.paymentAmount), 0) as totalReceived
            FROM OldInvoices oi
            LEFT JOIN OldInvoicePayments oip ON oi.oldInvoiceId = oip.oldInvoiceId
            WHERE oi.oldInvoiceId = @oldInvoiceId
            GROUP BY oi.totalAmount
          `);
        
        const { totalAmount, totalReceived } = totalsResult.recordset[0];
        const balance = totalAmount - totalReceived;
        const status = balance <= 0 ? 'Fully Settled' : (totalReceived > 0 ? 'Partially Paid' : 'Pending');
        
        // Auto-set settle date and calculate days when fully settled
        let settleDate = null;
        let daysAfterInvoice = null;
        
        if (status === 'Fully Settled') {
          // Get the latest payment date as settle date
          const latestPaymentResult = await transaction.request()
            .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
            .query(`
              SELECT TOP 1 receivedDate 
              FROM OldInvoicePayments 
              WHERE oldInvoiceId = @oldInvoiceId 
              ORDER BY receivedDate DESC
            `);
          
          if (latestPaymentResult.recordset.length > 0) {
            settleDate = latestPaymentResult.recordset[0].receivedDate;
            
            // Get invoice date to calculate days
            const invoiceResult = await transaction.request()
              .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
              .query('SELECT invoiceDate FROM OldInvoices WHERE oldInvoiceId = @oldInvoiceId');
            
            if (invoiceResult.recordset.length > 0) {
              const invoiceDate = new Date(invoiceResult.recordset[0].invoiceDate);
              const settleDateObj = new Date(settleDate);
              daysAfterInvoice = Math.floor((settleDateObj - invoiceDate) / (1000 * 60 * 60 * 24));
            }
          }
        }
        
        await transaction.request()
          .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
          .input('amountReceived', this.sql.Decimal(18, 2), totalReceived)
          .input('balance', this.sql.Decimal(18, 2), balance)
          .input('status', this.sql.NVarChar, status)
          .input('settleDate', this.sql.Date, settleDate)
          .input('daysAfterInvoice', this.sql.Int, daysAfterInvoice)
          .query(`
            UPDATE OldInvoices
            SET 
              amountReceived = @amountReceived,
              balance = @balance,
              status = @status,
              settleDate = @settleDate,
              daysAfterInvoice = @daysAfterInvoice,
              updatedAt = GETDATE()
            WHERE oldInvoiceId = @oldInvoiceId
          `);
        
        await transaction.commit();
        return await this.findById(oldInvoiceId);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  }

  async getPayments(oldInvoiceId) {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
        .query(`
          SELECT *
          FROM OldInvoicePayments
          WHERE oldInvoiceId = @oldInvoiceId
          ORDER BY receivedDate DESC, createdAt DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async deletePayment(paymentId) {
    try {
      const pool = await this.getConnection();
      const transaction = new this.sql.Transaction(pool);
      
      await transaction.begin();
      
      try {
        // Get oldInvoiceId before deleting
        const paymentResult = await transaction.request()
          .input('paymentId', this.sql.Int, paymentId)
          .query('SELECT oldInvoiceId FROM OldInvoicePayments WHERE paymentId = @paymentId');
        
        if (paymentResult.recordset.length === 0) {
          throw new Error('Payment not found');
        }
        
        const oldInvoiceId = paymentResult.recordset[0].oldInvoiceId;
        
        // Delete payment
        await transaction.request()
          .input('paymentId', this.sql.Int, paymentId)
          .query('DELETE FROM OldInvoicePayments WHERE paymentId = @paymentId');
        
        // Recalculate totals
        const totalsResult = await transaction.request()
          .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
          .query(`
            SELECT 
              oi.totalAmount,
              ISNULL(SUM(oip.paymentAmount), 0) as totalReceived
            FROM OldInvoices oi
            LEFT JOIN OldInvoicePayments oip ON oi.oldInvoiceId = oip.oldInvoiceId
            WHERE oi.oldInvoiceId = @oldInvoiceId
            GROUP BY oi.totalAmount
          `);
        
        const { totalAmount, totalReceived } = totalsResult.recordset[0];
        const balance = totalAmount - totalReceived;
        const status = balance <= 0 ? 'Fully Settled' : (totalReceived > 0 ? 'Partially Paid' : 'Pending');
        
        // Clear settle date and days when no longer fully settled
        let settleDate = null;
        let daysAfterInvoice = null;
        
        if (status === 'Fully Settled') {
          // Get the latest payment date as settle date
          const latestPaymentResult = await transaction.request()
            .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
            .query(`
              SELECT TOP 1 receivedDate 
              FROM OldInvoicePayments 
              WHERE oldInvoiceId = @oldInvoiceId 
              ORDER BY receivedDate DESC
            `);
          
          if (latestPaymentResult.recordset.length > 0) {
            settleDate = latestPaymentResult.recordset[0].receivedDate;
            
            // Get invoice date to calculate days
            const invoiceResult = await transaction.request()
              .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
              .query('SELECT invoiceDate FROM OldInvoices WHERE oldInvoiceId = @oldInvoiceId');
            
            if (invoiceResult.recordset.length > 0) {
              const invoiceDate = new Date(invoiceResult.recordset[0].invoiceDate);
              const settleDateObj = new Date(settleDate);
              daysAfterInvoice = Math.floor((settleDateObj - invoiceDate) / (1000 * 60 * 60 * 24));
            }
          }
        }
        
        await transaction.request()
          .input('oldInvoiceId', this.sql.Int, oldInvoiceId)
          .input('amountReceived', this.sql.Decimal(18, 2), totalReceived)
          .input('balance', this.sql.Decimal(18, 2), balance)
          .input('status', this.sql.NVarChar, status)
          .input('settleDate', this.sql.Date, settleDate)
          .input('daysAfterInvoice', this.sql.Int, daysAfterInvoice)
          .query(`
            UPDATE OldInvoices
            SET 
              amountReceived = @amountReceived,
              balance = @balance,
              status = @status,
              settleDate = @settleDate,
              daysAfterInvoice = @daysAfterInvoice,
              updatedAt = GETDATE()
            WHERE oldInvoiceId = @oldInvoiceId
          `);
        
        await transaction.commit();
        return await this.findById(oldInvoiceId);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
}

module.exports = MSSQLOldInvoiceRepository;
