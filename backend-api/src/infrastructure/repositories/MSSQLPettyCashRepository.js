/**
 * MSSQL PettyCash Repository Implementation
 * Handles all database operations for PettyCash
 */
const IPettyCashRepository = require('../../domain/repositories/IPettyCashRepository');
const PettyCashEntry = require('../../domain/entities/PettyCashEntry');

class MSSQLPettyCashRepository extends IPettyCashRepository {
  constructor(getConnection, sql) {
    super();
    this.db = getConnection;
    this.sql = sql;
  }

  async createEntry(entry) {
    const pool = await this.db();
    
    await pool.request()
      .input('entryId', this.sql.VarChar, entry.entryId)
      .input('description', this.sql.VarChar, entry.description)
      .input('amount', this.sql.Decimal(10, 2), entry.amount)
      .input('entryType', this.sql.VarChar, entry.entryType)
      .input('jobId', this.sql.VarChar, entry.jobId || null)
      .input('createdBy', this.sql.VarChar, entry.createdBy)
      .input('balanceAfter', this.sql.Decimal(10, 2), entry.balanceAfter)
      .query(`
        INSERT INTO PettyCash (EntryId, Description, Amount, EntryType, JobId, CreatedBy, BalanceAfter, Date)
        VALUES (@entryId, @description, @amount, @entryType, @jobId, @createdBy, @balanceAfter, GETDATE())
      `);
    
    return entry;
  }

  async findById(entryId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('entryId', this.sql.VarChar, entryId)
      .query('SELECT * FROM PettyCash WHERE EntryId = @entryId');
    
    return result.recordset[0] ? this.mapToEntity(result.recordset[0]) : null;
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    let query = 'SELECT * FROM PettyCash';
    const conditions = [];
    
    if (filters.entryType) {
      conditions.push('EntryType = @entryType');
    }
    
    if (filters.createdBy) {
      conditions.push('CreatedBy = @createdBy');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY Date DESC';
    
    const request = pool.request();
    if (filters.entryType) {
      request.input('entryType', this.sql.VarChar, filters.entryType);
    }
    if (filters.createdBy) {
      request.input('createdBy', this.sql.VarChar, filters.createdBy);
    }
    
    const result = await request.query(query);
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByJob(jobId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('SELECT * FROM PettyCash WHERE JobId = @jobId ORDER BY Date DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByUser(userId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query('SELECT * FROM PettyCash WHERE CreatedBy = @userId ORDER BY Date DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async getBalance() {
    const pool = await this.db();
    const result = await pool.request()
      .query('SELECT Balance FROM PettyCashBalance WHERE Id = 1');
    
    return result.recordset[0]?.Balance || 0;
  }

  async updateBalance(amount) {
    const pool = await this.db();
    
    await pool.request()
      .input('amount', this.sql.Decimal(10, 2), amount)
      .query('UPDATE PettyCashBalance SET Balance = @amount, LastUpdated = GETDATE() WHERE Id = 1');
    
    return amount;
  }

  async generateNextId() {
    const pool = await this.db();
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(EntryId, 3, 4) AS INT)) as MaxId FROM PettyCash');
    
    const nextId = (result.recordset[0].MaxId || 0) + 1;
    return `PC${String(nextId).padStart(4, '0')}`;
  }

  mapToEntity(row) {
    return new PettyCashEntry({
      entryId: row.EntryId,
      description: row.Description,
      amount: row.Amount,
      entryType: row.EntryType,
      jobId: row.JobId,
      createdBy: row.CreatedBy,
      date: row.Date,
      balanceAfter: row.BalanceAfter
    });
  }
}

module.exports = MSSQLPettyCashRepository;
