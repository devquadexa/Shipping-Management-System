/**
 * MSSQL Password Reset Repository Implementation
 */
const IPasswordResetRepository = require('../../domain/repositories/IPasswordResetRepository');
const PasswordResetRequest = require('../../domain/entities/PasswordResetRequest');

class MSSQLPasswordResetRepository extends IPasswordResetRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
  }

  async create(passwordResetRequest) {
    const pool = await this.db();
    
    await pool.request()
      .input('requestId', this.sql.VarChar, passwordResetRequest.requestId)
      .input('userId', this.sql.VarChar, passwordResetRequest.userId)
      .input('requestedBy', this.sql.VarChar, passwordResetRequest.requestedBy)
      .input('requestDate', this.sql.DateTime, passwordResetRequest.requestDate)
      .input('status', this.sql.VarChar, passwordResetRequest.status)
      .input('notes', this.sql.NVarChar, passwordResetRequest.notes)
      .query(`
        INSERT INTO PasswordResetRequests 
        (requestId, userId, requestedBy, requestDate, status, notes)
        VALUES (@requestId, @userId, @requestedBy, @requestDate, @status, @notes)
      `);
    
    return passwordResetRequest;
  }

  async findById(requestId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('requestId', this.sql.VarChar, requestId)
      .query(`
        SELECT 
          pr.*,
          u1.username as userName,
          u1.fullName as userFullName,
          u2.fullName as requestedByName,
          u3.fullName as resolvedByName
        FROM PasswordResetRequests pr
        INNER JOIN Users u1 ON pr.userId = u1.userId
        INNER JOIN Users u2 ON pr.requestedBy = u2.userId
        LEFT JOIN Users u3 ON pr.resolvedBy = u3.userId
        WHERE pr.requestId = @requestId
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findByUserId(userId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query(`
        SELECT 
          pr.*,
          u1.username as userName,
          u1.fullName as userFullName,
          u2.fullName as requestedByName,
          u3.fullName as resolvedByName
        FROM PasswordResetRequests pr
        INNER JOIN Users u1 ON pr.userId = u1.userId
        INNER JOIN Users u2 ON pr.requestedBy = u2.userId
        LEFT JOIN Users u3 ON pr.resolvedBy = u3.userId
        WHERE pr.userId = @userId
        ORDER BY pr.requestDate DESC
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findPendingRequests() {
    const pool = await this.db();
    
    const result = await pool.request()
      .query(`
        SELECT 
          pr.*,
          u1.username as userName,
          u1.fullName as userFullName,
          u2.fullName as requestedByName,
          u3.fullName as resolvedByName
        FROM PasswordResetRequests pr
        INNER JOIN Users u1 ON pr.userId = u1.userId
        INNER JOIN Users u2 ON pr.requestedBy = u2.userId
        LEFT JOIN Users u3 ON pr.resolvedBy = u3.userId
        WHERE pr.status = 'Pending'
        ORDER BY pr.requestDate DESC
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findAll() {
    const pool = await this.db();
    
    const result = await pool.request()
      .query(`
        SELECT 
          pr.*,
          u1.username as userName,
          u1.fullName as userFullName,
          u2.fullName as requestedByName,
          u3.fullName as resolvedByName
        FROM PasswordResetRequests pr
        INNER JOIN Users u1 ON pr.userId = u1.userId
        INNER JOIN Users u2 ON pr.requestedBy = u2.userId
        LEFT JOIN Users u3 ON pr.resolvedBy = u3.userId
        ORDER BY pr.requestDate DESC
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async updateStatus(requestId, status, resolvedBy, notes = null) {
    const pool = await this.db();
    
    await pool.request()
      .input('requestId', this.sql.VarChar, requestId)
      .input('status', this.sql.VarChar, status)
      .input('resolvedBy', this.sql.VarChar, resolvedBy)
      .input('resolvedDate', this.sql.DateTime, new Date())
      .input('notes', this.sql.NVarChar, notes)
      .query(`
        UPDATE PasswordResetRequests 
        SET 
          status = @status,
          resolvedBy = @resolvedBy,
          resolvedDate = @resolvedDate,
          notes = @notes
        WHERE requestId = @requestId
      `);
  }

  async delete(requestId) {
    const pool = await this.db();
    
    await pool.request()
      .input('requestId', this.sql.VarChar, requestId)
      .query('DELETE FROM PasswordResetRequests WHERE requestId = @requestId');
  }

  mapToEntity(row) {
    return new PasswordResetRequest({
      requestId: row.requestId,
      userId: row.userId,
      userName: row.userName,
      userFullName: row.userFullName,
      requestedBy: row.requestedBy,
      requestedByName: row.requestedByName,
      requestDate: row.requestDate,
      status: row.status,
      resolvedBy: row.resolvedBy,
      resolvedByName: row.resolvedByName,
      resolvedDate: row.resolvedDate,
      notes: row.notes
    });
  }
}

module.exports = MSSQLPasswordResetRepository;
