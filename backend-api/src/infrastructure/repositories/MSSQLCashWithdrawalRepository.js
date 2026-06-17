/**
 * MSSQL Cash Withdrawal Repository Implementation
 */
const ICashWithdrawalRepository = require('../../domain/repositories/ICashWithdrawalRepository');
const CashWithdrawal = require('../../domain/entities/CashWithdrawal');

class MSSQLCashWithdrawalRepository extends ICashWithdrawalRepository {
  constructor(getConnection, sql) {
    super();
    this.db = getConnection;
    this.sql = sql;
  }

  async create(withdrawal) {
    const pool = await this.db();
    
    // Ensure table exists with transactionType column
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CashWithdrawals')
      BEGIN
        CREATE TABLE CashWithdrawals (
          withdrawalId NVARCHAR(50) PRIMARY KEY,
          amount DECIMAL(18, 2) NOT NULL,
          bankName NVARCHAR(200) NOT NULL,
          withdrawalDate DATETIME NOT NULL,
          notes NVARCHAR(500),
          transactionType NVARCHAR(50) DEFAULT 'withdrawal',
          createdBy NVARCHAR(50) NOT NULL,
          createdAt DATETIME DEFAULT GETDATE()
        )
      END
      ELSE IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CashWithdrawals') AND name = 'transactionType')
      BEGIN
        ALTER TABLE CashWithdrawals ADD transactionType NVARCHAR(50) DEFAULT 'withdrawal'
      END
    `);
    
    await pool.request()
      .input('withdrawalId', this.sql.VarChar, withdrawal.withdrawalId)
      .input('amount', this.sql.Decimal(18, 2), withdrawal.amount)
      .input('bankName', this.sql.NVarChar, withdrawal.bankName)
      .input('withdrawalDate', this.sql.DateTime, withdrawal.withdrawalDate)
      .input('notes', this.sql.NVarChar, withdrawal.notes || null)
      .input('transactionType', this.sql.NVarChar, withdrawal.transactionType || 'withdrawal')
      .input('createdBy', this.sql.VarChar, withdrawal.createdBy)
      .query(`
        INSERT INTO CashWithdrawals (withdrawalId, amount, bankName, withdrawalDate, notes, transactionType, createdBy)
        VALUES (@withdrawalId, @amount, @bankName, @withdrawalDate, @notes, @transactionType, @createdBy)
      `);
    
    return withdrawal;
  }

  async findAll() {
    const pool = await this.db();
    
    // Ensure table exists with transactionType column
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CashWithdrawals')
      BEGIN
        CREATE TABLE CashWithdrawals (
          withdrawalId NVARCHAR(50) PRIMARY KEY,
          amount DECIMAL(18, 2) NOT NULL,
          bankName NVARCHAR(200) NOT NULL,
          withdrawalDate DATETIME NOT NULL,
          notes NVARCHAR(500),
          transactionType NVARCHAR(50) DEFAULT 'withdrawal',
          createdBy NVARCHAR(50) NOT NULL,
          createdAt DATETIME DEFAULT GETDATE()
        )
      END
      ELSE IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CashWithdrawals') AND name = 'transactionType')
      BEGIN
        ALTER TABLE CashWithdrawals ADD transactionType NVARCHAR(50) DEFAULT 'withdrawal'
      END
    `);
    
    const result = await pool.request()
      .query(`
        SELECT 
          cw.*,
          u.fullName as createdByName
        FROM CashWithdrawals cw
        LEFT JOIN Users u ON cw.createdBy = u.userId
        ORDER BY cw.withdrawalDate DESC, cw.createdAt DESC
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findById(withdrawalId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('withdrawalId', this.sql.VarChar, withdrawalId)
      .query('SELECT * FROM CashWithdrawals WHERE withdrawalId = @withdrawalId');
    
    return result.recordset[0] ? this.mapToEntity(result.recordset[0]) : null;
  }

  async findByDateRange(fromDate, toDate) {
    const pool = await this.db();
    
    // Ensure table exists with transactionType column
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CashWithdrawals')
      BEGIN
        CREATE TABLE CashWithdrawals (
          withdrawalId NVARCHAR(50) PRIMARY KEY,
          amount DECIMAL(18, 2) NOT NULL,
          bankName NVARCHAR(200) NOT NULL,
          withdrawalDate DATETIME NOT NULL,
          notes NVARCHAR(500),
          transactionType NVARCHAR(50) DEFAULT 'withdrawal',
          createdBy NVARCHAR(50) NOT NULL,
          createdAt DATETIME DEFAULT GETDATE()
        )
      END
      ELSE IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CashWithdrawals') AND name = 'transactionType')
      BEGIN
        ALTER TABLE CashWithdrawals ADD transactionType NVARCHAR(50) DEFAULT 'withdrawal'
      END
    `);
    
    const result = await pool.request()
      .input('fromDate', this.sql.Date, fromDate)
      .input('toDate', this.sql.Date, toDate)
      .query(`
        SELECT 
          cw.*,
          u.fullName as createdByName
        FROM CashWithdrawals cw
        LEFT JOIN Users u ON cw.createdBy = u.userId
        WHERE CAST(cw.withdrawalDate AS DATE) BETWEEN @fromDate AND @toDate
        ORDER BY cw.withdrawalDate DESC, cw.createdAt DESC
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async generateNextId() {
    const pool = await this.db();
    
    // Ensure table exists with transactionType column
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CashWithdrawals')
      BEGIN
        CREATE TABLE CashWithdrawals (
          withdrawalId NVARCHAR(50) PRIMARY KEY,
          amount DECIMAL(18, 2) NOT NULL,
          bankName NVARCHAR(200) NOT NULL,
          withdrawalDate DATETIME NOT NULL,
          notes NVARCHAR(500),
          transactionType NVARCHAR(50) DEFAULT 'withdrawal',
          createdBy NVARCHAR(50) NOT NULL,
          createdAt DATETIME DEFAULT GETDATE()
        )
      END
      ELSE IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CashWithdrawals') AND name = 'transactionType')
      BEGIN
        ALTER TABLE CashWithdrawals ADD transactionType NVARCHAR(50) DEFAULT 'withdrawal'
      END
    `);
    
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(withdrawalId, 3, 10) AS INT)) as MaxId FROM CashWithdrawals');
    
    const nextId = (result.recordset[0].MaxId || 0) + 1;
    return `CW${String(nextId).padStart(6, '0')}`;
  }

  mapToEntity(row) {
    return new CashWithdrawal({
      withdrawalId: row.withdrawalId,
      amount: row.amount,
      bankName: row.bankName,
      withdrawalDate: row.withdrawalDate,
      notes: row.notes,
      transactionType: row.transactionType || 'withdrawal',
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      createdByName: row.createdByName
    });
  }
}

module.exports = MSSQLCashWithdrawalRepository;
