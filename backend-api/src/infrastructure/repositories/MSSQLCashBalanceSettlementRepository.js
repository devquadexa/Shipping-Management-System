/**
 * MSSQL Cash Balance Settlement Repository Implementation
 * Handles all database operations for Cash Balance Settlements
 */
const CashBalanceSettlement = require('../../domain/entities/CashBalanceSettlement');

class MSSQLCashBalanceSettlementRepository {
  constructor(getConnection, sql) {
    this.db = getConnection;
    this.sql = sql;
  }

  async create(settlement) {
    const pool = await this.db();
    
    const relatedAssignmentsJson = JSON.stringify(settlement.relatedAssignments || []);
    
    await pool.request()
      .input('settlementId', this.sql.VarChar, settlement.settlementId)
      .input('userId', this.sql.VarChar, settlement.userId)
      .input('userName', this.sql.NVarChar, settlement.userName)
      .input('managerId', this.sql.VarChar, settlement.managerId)
      .input('managerName', this.sql.NVarChar, settlement.managerName)
      .input('settlementType', this.sql.NVarChar, settlement.settlementType)
      .input('amount', this.sql.Decimal(18, 2), settlement.amount)
      .input('status', this.sql.NVarChar, settlement.status)
      .input('requestDate', this.sql.DateTime, settlement.requestDate)
      .input('notes', this.sql.NVarChar, settlement.notes)
      .input('relatedAssignments', this.sql.NVarChar, relatedAssignmentsJson)
      .input('createdBy', this.sql.VarChar, settlement.createdBy)
      .input('createdDate', this.sql.DateTime, settlement.createdDate)
      .query(`
        INSERT INTO CashBalanceSettlements (
          settlementId, userId, userName, managerId, managerName, 
          settlementType, amount, status, requestDate, notes, 
          relatedAssignments, createdBy, createdDate
        )
        VALUES (
          @settlementId, @userId, @userName, @managerId, @managerName,
          @settlementType, @amount, @status, @requestDate, @notes,
          @relatedAssignments, @createdBy, @createdDate
        )
      `);
    
    return settlement;
  }

  async findById(settlementId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('settlementId', this.sql.VarChar, settlementId)
      .query('SELECT * FROM CashBalanceSettlements WHERE settlementId = @settlementId');
    
    return result.recordset[0] ? this.mapToEntity(result.recordset[0]) : null;
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    let query = 'SELECT * FROM CashBalanceSettlements WHERE 1=1';
    const request = pool.request();
    
    if (filters.userId) {
      query += ' AND userId = @userId';
      request.input('userId', this.sql.VarChar, filters.userId);
    }
    
    if (filters.managerId) {
      query += ' AND managerId = @managerId';
      request.input('managerId', this.sql.VarChar, filters.managerId);
    }
    
    if (filters.status) {
      query += ' AND status = @status';
      request.input('status', this.sql.NVarChar, filters.status);
    }
    
    if (filters.settlementType) {
      query += ' AND settlementType = @settlementType';
      request.input('settlementType', this.sql.NVarChar, filters.settlementType);
    }
    
    query += ' ORDER BY requestDate DESC';
    
    const result = await request.query(query);
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByUser(userId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query('SELECT * FROM CashBalanceSettlements WHERE userId = @userId ORDER BY requestDate DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByManager(managerId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('managerId', this.sql.VarChar, managerId)
      .query('SELECT * FROM CashBalanceSettlements WHERE managerId = @managerId ORDER BY requestDate DESC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findPendingSettlements() {
    const pool = await this.db();
    const result = await pool.request()
      .query("SELECT * FROM CashBalanceSettlements WHERE status = 'PENDING' ORDER BY requestDate ASC");
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findApprovedSettlements() {
    const pool = await this.db();
    const result = await pool.request()
      .query("SELECT * FROM CashBalanceSettlements WHERE status = 'APPROVED' ORDER BY approvedDate ASC");
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findRejectedSettlements() {
    const pool = await this.db();
    const result = await pool.request()
      .query("SELECT * FROM CashBalanceSettlements WHERE status = 'REJECTED' ORDER BY updatedDate DESC");
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async update(settlementId, settlement) {
    const pool = await this.db();
    
    const request = pool.request()
      .input('settlementId', this.sql.VarChar, settlementId);
    
    const updates = [];
    
    if (settlement.managerId !== undefined) {
      request.input('managerId', this.sql.VarChar, settlement.managerId);
      updates.push('managerId = @managerId');
    }
    
    if (settlement.managerName !== undefined) {
      request.input('managerName', this.sql.NVarChar, settlement.managerName);
      updates.push('managerName = @managerName');
    }
    
    if (settlement.status !== undefined) {
      request.input('status', this.sql.NVarChar, settlement.status);
      updates.push('status = @status');
    }
    
    if (settlement.approvedDate !== undefined) {
      request.input('approvedDate', this.sql.DateTime, settlement.approvedDate);
      updates.push('approvedDate = @approvedDate');
    }
    
    if (settlement.completedDate !== undefined) {
      request.input('completedDate', this.sql.DateTime, settlement.completedDate);
      updates.push('completedDate = @completedDate');
    }
    
    if (settlement.managerNotes !== undefined) {
      request.input('managerNotes', this.sql.NVarChar, settlement.managerNotes);
      updates.push('managerNotes = @managerNotes');
    }
    
    if (settlement.updatedBy !== undefined) {
      request.input('updatedBy', this.sql.VarChar, settlement.updatedBy);
      updates.push('updatedBy = @updatedBy');
    }
    
    if (settlement.updatedDate !== undefined) {
      request.input('updatedDate', this.sql.DateTime, settlement.updatedDate);
      updates.push('updatedDate = @updatedDate');
    }
    
    if (updates.length > 0) {
      await request.query(`
        UPDATE CashBalanceSettlements 
        SET ${updates.join(', ')}
        WHERE settlementId = @settlementId
      `);
    }
    
    return await this.findById(settlementId);
  }

  async delete(settlementId) {
    const pool = await this.db();
    
    await pool.request()
      .input('settlementId', this.sql.VarChar, settlementId)
      .query('DELETE FROM CashBalanceSettlements WHERE settlementId = @settlementId');
  }

  async generateNextId() {
    const pool = await this.db();
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(settlementId, 4, 6) AS INT)) as MaxId FROM CashBalanceSettlements WHERE settlementId LIKE \'CBS%\'');
    
    const nextId = (result.recordset[0].MaxId || 0) + 1;
    return `CBS${String(nextId).padStart(6, '0')}`;
  }

  async getSettlementsSummary() {
    const pool = await this.db();
    const result = await pool.request()
      .query(`
        SELECT 
          status,
          settlementType,
          COUNT(*) as count,
          SUM(amount) as totalAmount
        FROM CashBalanceSettlements 
        GROUP BY status, settlementType
        ORDER BY status, settlementType
      `);
    
    return result.recordset;
  }

  async getUserSettlementsSummary(userId) {
    const pool = await this.db();
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query(`
        SELECT 
          status,
          settlementType,
          COUNT(*) as count,
          SUM(amount) as totalAmount
        FROM CashBalanceSettlements 
        WHERE userId = @userId
        GROUP BY status, settlementType
        ORDER BY status, settlementType
      `);
    
    return result.recordset;
  }

  mapToEntity(row) {
    let relatedAssignments = [];
    if (row.relatedAssignments) {
      try {
        relatedAssignments = JSON.parse(row.relatedAssignments);
      } catch (e) {
        console.log('Error parsing relatedAssignments JSON:', e.message);
      }
    }

    return new CashBalanceSettlement({
      settlementId: row.settlementId,
      userId: row.userId,
      userName: row.userName,
      managerId: row.managerId,
      managerName: row.managerName,
      settlementType: row.settlementType,
      amount: row.amount,
      status: row.status,
      requestDate: row.requestDate,
      approvedDate: row.approvedDate,
      completedDate: row.completedDate,
      notes: row.notes,
      managerNotes: row.managerNotes,
      relatedAssignments: relatedAssignments,
      createdBy: row.createdBy,
      createdDate: row.createdDate,
      updatedBy: row.updatedBy,
      updatedDate: row.updatedDate
    });
  }
}

module.exports = MSSQLCashBalanceSettlementRepository;