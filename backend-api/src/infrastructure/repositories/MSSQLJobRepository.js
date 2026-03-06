/**
 * MSSQL Job Repository Implementation
 */
const IJobRepository = require('../../domain/repositories/IJobRepository');
const Job = require('../../domain/entities/Job');

class MSSQLJobRepository extends IJobRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
  }

  async create(job) {
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, job.jobId)
      .input('customerId', this.sql.VarChar, job.customerId)
      .input('blNumber', this.sql.VarChar, job.blNumber)
      .input('cusdecNumber', this.sql.VarChar, job.cusdecNumber)
      .input('openDate', this.sql.Date, job.openDate)
      .input('shipmentCategory', this.sql.VarChar, job.shipmentCategory)
      .input('exporter', this.sql.VarChar, job.exporter)
      .input('lcNumber', this.sql.VarChar, job.lcNumber)
      .input('containerNumber', this.sql.VarChar, job.containerNumber)
      .input('status', this.sql.VarChar, job.status)
      .input('assignedTo', this.sql.VarChar, job.assignedTo)
      .input('createdDate', this.sql.DateTime, job.createdDate)
      .query(`
        INSERT INTO Jobs (JobId, CustomerId, BLNumber, CUSDECNumber, OpenDate, ShipmentCategory, Exporter, LCNumber, ContainerNumber, Status, AssignedTo, CreatedDate)
        VALUES (@jobId, @customerId, @blNumber, @cusdecNumber, @openDate, @shipmentCategory, @exporter, @lcNumber, @containerNumber, @status, @assignedTo, @createdDate)
      `);
    
    return job;
  }

  async findById(jobId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('SELECT * FROM Jobs WHERE JobId = @jobId');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    
    let query = 'SELECT * FROM Jobs WHERE 1=1';
    
    if (filters.status) {
      query += ` AND Status = '${filters.status}'`;
    }
    
    if (filters.customerId) {
      query += ` AND CustomerId = '${filters.customerId}'`;
    }
    
    if (filters.assignedTo) {
      query += ` AND AssignedTo = '${filters.assignedTo}'`;
    }
    
    query += ' ORDER BY JobId ASC';
    
    const result = await pool.request().query(query);
    
    // Use Promise.all to await all mapToEntity calls
    return await Promise.all(result.recordset.map(row => this.mapToEntity(row)));
  }

  async findByAssignedUser(userId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query('SELECT * FROM Jobs WHERE AssignedTo = @userId ORDER BY CreatedDate DESC');
    
    return await Promise.all(result.recordset.map(row => this.mapToEntity(row)));
  }

  async findByCustomer(customerId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('SELECT * FROM Jobs WHERE CustomerId = @customerId ORDER BY CreatedDate DESC');
    
    return await Promise.all(result.recordset.map(row => this.mapToEntity(row)));
  }

  async update(jobId, job) {
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('blNumber', this.sql.VarChar, job.blNumber)
      .input('cusdecNumber', this.sql.VarChar, job.cusdecNumber)
      .input('openDate', this.sql.Date, job.openDate)
      .input('shipmentCategory', this.sql.VarChar, job.shipmentCategory)
      .input('exporter', this.sql.VarChar, job.exporter)
      .input('lcNumber', this.sql.VarChar, job.lcNumber)
      .input('containerNumber', this.sql.VarChar, job.containerNumber)
      .input('status', this.sql.VarChar, job.status)
      .input('assignedTo', this.sql.VarChar, job.assignedTo)
      .query(`
        UPDATE Jobs 
        SET BLNumber = @blNumber, CUSDECNumber = @cusdecNumber, OpenDate = @openDate,
            ShipmentCategory = @shipmentCategory, Exporter = @exporter, LCNumber = @lcNumber,
            ContainerNumber = @containerNumber, Status = @status, AssignedTo = @assignedTo
        WHERE JobId = @jobId
      `);
    
    return job;
  }

  async updateStatus(jobId, status) {
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('status', this.sql.VarChar, status)
      .query('UPDATE Jobs SET Status = @status WHERE JobId = @jobId');
    
    return true;
  }

  async assignToUser(jobId, userId) {
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('userId', this.sql.VarChar, userId)
      .query('UPDATE Jobs SET AssignedTo = @userId WHERE JobId = @jobId');
    
    return true;
  }

  async delete(jobId) {
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('DELETE FROM Jobs WHERE JobId = @jobId');
    
    return true;
  }

  async generateNextId() {
    const pool = await this.db();
    
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(JobId, 4, 4) AS INT)) as maxId FROM Jobs');
    
    const nextId = (result.recordset[0].maxId || 0) + 1;
    return `JOB${String(nextId).padStart(4, '0')}`;
  }

  async addPayItem(jobId, payItem) {
    const pool = await this.db();
    
    await pool.request()
      .input('payItemId', this.sql.VarChar, payItem.payItemId)
      .input('jobId', this.sql.VarChar, jobId)
      .input('description', this.sql.VarChar, payItem.description)
      .input('actualCost', this.sql.Decimal(10, 2), payItem.amount)
      .input('billingAmount', this.sql.Decimal(10, 2), payItem.billingAmount || payItem.amount)
      .input('addedBy', this.sql.VarChar, payItem.addedBy)
      .query(`
        INSERT INTO PayItems (PayItemId, JobId, Description, ActualCost, BillingAmount, AddedBy, AddedDate)
        VALUES (@payItemId, @jobId, @description, @actualCost, @billingAmount, @addedBy, GETDATE())
      `);
    
    return true;
  }

  async getPayItems(jobId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('SELECT * FROM PayItems WHERE JobId = @jobId ORDER BY AddedDate DESC');
    
    return result.recordset.map(row => ({
      id: row.PayItemId,
      description: row.Description,
      actualCost: row.ActualCost || row.Amount || 0,
      billingAmount: row.BillingAmount || row.Amount || 0,
      amount: row.ActualCost || row.Amount || 0,
      addedBy: row.AddedBy,
      addedDate: row.AddedDate
    }));
  }

  async mapToEntity(row) {
    console.log('mapToEntity called with row:', row);
    
    // Get pay items for this job
    const payItems = await this.getPayItems(row.JobId);
    console.log('Pay items:', payItems);
    
    // Return plain object directly for API responses
    const result = {
      jobId: row.JobId,
      customerId: row.CustomerId,
      blNumber: row.BLNumber,
      cusdecNumber: row.CUSDECNumber,
      openDate: row.OpenDate,
      shipmentCategory: row.ShipmentCategory,
      exporter: row.Exporter,
      lcNumber: row.LCNumber,
      containerNumber: row.ContainerNumber,
      status: row.Status || 'Open',
      assignedTo: row.AssignedTo,
      createdDate: row.CreatedDate,
      completedDate: row.CompletedDate,
      pettyCashStatus: row.pettyCashStatus,
      payItems: payItems || []
    };
    
    console.log('mapToEntity result:', result);
    return result;
  }
}

module.exports = MSSQLJobRepository;
