/**
 * MSSQL Other Expense Repository Implementation
 */
const IOtherExpenseRepository = require('../../domain/repositories/IOtherExpenseRepository');
const OtherExpense = require('../../domain/entities/OtherExpense');

class MSSQLOtherExpenseRepository extends IOtherExpenseRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
    this.schemaEnsured = false;
  }

  async ensureSchema() {
    if (this.schemaEnsured) {
      return;
    }

    const pool = await this.db();

    await pool.request().query(`
      IF OBJECT_ID('OtherExpenses', 'U') IS NULL
      BEGIN
        CREATE TABLE OtherExpenses (
          expenseId VARCHAR(50) PRIMARY KEY,
          category NVARCHAR(100) NOT NULL,
          description NVARCHAR(500) NOT NULL,
          amount DECIMAL(18,2) NOT NULL,
          expenseDate DATE NOT NULL,
          paymentMethod NVARCHAR(50) NULL,
          referenceNumber NVARCHAR(100) NULL,
          notes NVARCHAR(MAX) NULL,
          recordedBy VARCHAR(50) NOT NULL,
          createdDate DATETIME NOT NULL DEFAULT GETDATE(),
          attachmentUrl NVARCHAR(500) NULL,
          FOREIGN KEY (recordedBy) REFERENCES Users(userId)
        );
        
        CREATE INDEX IX_OtherExpenses_ExpenseDate ON OtherExpenses(expenseDate);
        CREATE INDEX IX_OtherExpenses_Category ON OtherExpenses(category);
        CREATE INDEX IX_OtherExpenses_RecordedBy ON OtherExpenses(recordedBy);
      END
    `);

    this.schemaEnsured = true;
  }

  async create(expense) {
    await this.ensureSchema();
    const pool = await this.db();
    
    await pool.request()
      .input('expenseId', this.sql.VarChar, expense.expenseId)
      .input('category', this.sql.NVarChar, expense.category)
      .input('description', this.sql.NVarChar, expense.description)
      .input('amount', this.sql.Decimal(18, 2), expense.amount)
      .input('expenseDate', this.sql.Date, expense.expenseDate)
      .input('paymentMethod', this.sql.NVarChar, expense.paymentMethod)
      .input('referenceNumber', this.sql.NVarChar, expense.referenceNumber)
      .input('notes', this.sql.NVarChar, expense.notes)
      .input('recordedBy', this.sql.VarChar, expense.recordedBy)
      .input('createdDate', this.sql.DateTime, expense.createdDate)
      .input('attachmentUrl', this.sql.NVarChar, expense.attachmentUrl)
      .query(`
        INSERT INTO OtherExpenses (
          expenseId, category, description, amount, expenseDate,
          paymentMethod, referenceNumber, notes, recordedBy, createdDate, attachmentUrl
        )
        VALUES (
          @expenseId, @category, @description, @amount, @expenseDate,
          @paymentMethod, @referenceNumber, @notes, @recordedBy, @createdDate, @attachmentUrl
        )
      `);
    
    return expense;
  }

  async findById(expenseId) {
    await this.ensureSchema();
    const pool = await this.db();
    
    const result = await pool.request()
      .input('expenseId', this.sql.VarChar, expenseId)
      .query(`
        SELECT 
          oe.*,
          u.fullName as recordedByName
        FROM OtherExpenses oe
        LEFT JOIN Users u ON oe.recordedBy = u.userId
        WHERE oe.expenseId = @expenseId
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findAll(filters = {}) {
    await this.ensureSchema();
    const pool = await this.db();
    
    let query = `
      SELECT 
        oe.*,
        u.fullName as recordedByName
      FROM OtherExpenses oe
      LEFT JOIN Users u ON oe.recordedBy = u.userId
      WHERE 1=1
    `;
    
    if (filters.category) {
      query += ` AND oe.category = '${filters.category}'`;
    }
    
    if (filters.fromDate && filters.toDate) {
      query += ` AND oe.expenseDate BETWEEN '${filters.fromDate}' AND '${filters.toDate}'`;
    }
    
    query += ' ORDER BY oe.expenseDate DESC, oe.createdDate DESC';
    
    const result = await pool.request().query(query);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByDateRange(fromDate, toDate, category = null) {
    await this.ensureSchema();
    const pool = await this.db();
    
    const request = pool.request()
      .input('fromDate', this.sql.Date, fromDate)
      .input('toDate', this.sql.Date, toDate);
    
    let query = `
      SELECT 
        oe.*,
        u.fullName as recordedByName
      FROM OtherExpenses oe
      LEFT JOIN Users u ON oe.recordedBy = u.userId
      WHERE oe.expenseDate BETWEEN @fromDate AND @toDate
    `;
    
    if (category) {
      request.input('category', this.sql.NVarChar, category);
      query += ' AND oe.category = @category';
    }
    
    query += ' ORDER BY oe.expenseDate DESC, oe.createdDate DESC';
    
    const result = await request.query(query);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async update(expenseId, expense) {
    await this.ensureSchema();
    const pool = await this.db();
    
    await pool.request()
      .input('expenseId', this.sql.VarChar, expenseId)
      .input('category', this.sql.NVarChar, expense.category)
      .input('description', this.sql.NVarChar, expense.description)
      .input('amount', this.sql.Decimal(18, 2), expense.amount)
      .input('expenseDate', this.sql.Date, expense.expenseDate)
      .input('paymentMethod', this.sql.NVarChar, expense.paymentMethod)
      .input('referenceNumber', this.sql.NVarChar, expense.referenceNumber)
      .input('notes', this.sql.NVarChar, expense.notes)
      .input('attachmentUrl', this.sql.NVarChar, expense.attachmentUrl)
      .query(`
        UPDATE OtherExpenses 
        SET 
          category = @category,
          description = @description,
          amount = @amount,
          expenseDate = @expenseDate,
          paymentMethod = @paymentMethod,
          referenceNumber = @referenceNumber,
          notes = @notes,
          attachmentUrl = @attachmentUrl
        WHERE expenseId = @expenseId
      `);
    
    return await this.findById(expenseId);
  }

  async delete(expenseId) {
    await this.ensureSchema();
    const pool = await this.db();
    
    await pool.request()
      .input('expenseId', this.sql.VarChar, expenseId)
      .query('DELETE FROM OtherExpenses WHERE expenseId = @expenseId');
    
    return true;
  }

  async generateNextId() {
    await this.ensureSchema();
    const pool = await this.db();
    
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(expenseId, 4, 10) AS INT)) as maxId FROM OtherExpenses');
    
    const nextId = (result.recordset[0].maxId || 0) + 1;
    return `EXP${String(nextId).padStart(5, '0')}`;
  }

  async getCategories() {
    await this.ensureSchema();
    const pool = await this.db();
    
    const result = await pool.request()
      .query(`
        SELECT DISTINCT category
        FROM OtherExpenses
        ORDER BY category
      `);
    
    return result.recordset.map(row => row.category);
  }

  async getSummaryByCategory(fromDate, toDate) {
    await this.ensureSchema();
    const pool = await this.db();
    
    const result = await pool.request()
      .input('fromDate', this.sql.Date, fromDate)
      .input('toDate', this.sql.Date, toDate)
      .query(`
        SELECT 
          category,
          COUNT(*) as count,
          SUM(amount) as totalAmount
        FROM OtherExpenses
        WHERE expenseDate BETWEEN @fromDate AND @toDate
        GROUP BY category
        ORDER BY totalAmount DESC
      `);
    
    return result.recordset.map(row => ({
      category: row.category,
      count: row.count,
      totalAmount: parseFloat(row.totalAmount) || 0
    }));
  }

  mapToEntity(row) {
    return new OtherExpense({
      expenseId: row.expenseId,
      category: row.category,
      description: row.description,
      amount: parseFloat(row.amount) || 0,
      expenseDate: row.expenseDate,
      paymentMethod: row.paymentMethod,
      referenceNumber: row.referenceNumber,
      notes: row.notes,
      recordedBy: row.recordedBy,
      recordedByName: row.recordedByName,
      createdDate: row.createdDate,
      attachmentUrl: row.attachmentUrl
    });
  }
}

module.exports = MSSQLOtherExpenseRepository;
