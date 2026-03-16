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
    
    console.log('MSSQLJobRepository.create - job:', job);
    
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
      .query(`
        INSERT INTO Jobs (jobId, customerId, blNumber, cusdecNumber, openDate, shipmentCategory, exporter, lcNumber, containerNumber, status)
        VALUES (@jobId, @customerId, @blNumber, @cusdecNumber, @openDate, @shipmentCategory, @exporter, @lcNumber, @containerNumber, @status)
      `);
    
    console.log('MSSQLJobRepository.create - job created successfully');
    return job;
  }

  async findById(jobId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('SELECT * FROM Jobs WHERE jobId = @jobId');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    
    // If filtering by assignedTo (user role), use the findByAssignedUser method
    if (filters.assignedTo) {
      return await this.findByAssignedUser(filters.assignedTo);
    }
    
    let query = 'SELECT * FROM Jobs WHERE 1=1';
    
    if (filters.status) {
      query += ` AND status = '${filters.status}'`;
    }
    
    if (filters.customerId) {
      query += ` AND customerId = '${filters.customerId}'`;
    }
    
    query += ' ORDER BY jobId ASC';
    
    const result = await pool.request().query(query);
    
    // Use Promise.all to await all mapToEntity calls
    return await Promise.all(result.recordset.map(row => this.mapToEntity(row)));
  }

  async findByAssignedUser(userId) {
    const pool = await this.db();
    
    try {
      console.log('findByAssignedUser called with userId:', userId);
      
      // Get jobs assigned to this user from JobAssignments table
      const assignmentResult = await pool.request()
        .input('userId', this.sql.VarChar, userId)
        .query(`
          SELECT DISTINCT j.* 
          FROM Jobs j
          INNER JOIN JobAssignments ja ON j.jobId = ja.jobId
          WHERE ja.userId = @userId
          ORDER BY j.openDate DESC
        `);
      
      console.log('Jobs found for user:', assignmentResult.recordset.length);
      
      return await Promise.all(assignmentResult.recordset.map(row => this.mapToEntity(row)));
    } catch (error) {
      console.error('Error in findByAssignedUser:', error);
      throw error;
    }
  }

  async findByCustomer(customerId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('SELECT * FROM Jobs WHERE CustomerId = @customerId ORDER BY CreatedDate DESC');
    
    return await Promise.all(result.recordset.map(row => this.mapToEntity(row)));
  }

  async update(jobId, job) {
    try {
      console.log('MSSQLJobRepository.update - START');
      console.log('MSSQLJobRepository.update - jobId:', jobId);
      console.log('MSSQLJobRepository.update - job:', JSON.stringify(job, null, 2));
      
      // Validate inputs
      if (!jobId) {
        throw new Error('Job ID is required for update');
      }
      
      if (!job) {
        throw new Error('Job data is required for update');
      }
      
      const pool = await this.db();
      console.log('MSSQLJobRepository.update - got database pool');
      
      // Prepare the update query with proper null handling
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .input('blNumber', this.sql.VarChar, job.blNumber || null)
        .input('cusdecNumber', this.sql.VarChar, job.cusdecNumber || null)
        .input('openDate', this.sql.Date, job.openDate || null)
        .input('shipmentCategory', this.sql.VarChar, job.shipmentCategory)
        .input('exporter', this.sql.VarChar, job.exporter || null)
        .input('lcNumber', this.sql.VarChar, job.lcNumber || null)
        .input('containerNumber', this.sql.VarChar, job.containerNumber || null)
        .input('transporter', this.sql.VarChar, job.transporter || null)
        .input('status', this.sql.VarChar, job.status)
        .query(`
          UPDATE Jobs 
          SET BLNumber = @blNumber, 
              CUSDECNumber = @cusdecNumber, 
              OpenDate = @openDate,
              ShipmentCategory = @shipmentCategory, 
              Exporter = @exporter, 
              LCNumber = @lcNumber,
              ContainerNumber = @containerNumber, 
              Transporter = @transporter, 
              Status = @status
          WHERE JobId = @jobId
        `);
      
      console.log('MSSQLJobRepository.update - query result:', result);
      console.log('MSSQLJobRepository.update - rows affected:', result.rowsAffected);
      
      // Check if any rows were affected
      if (result.rowsAffected[0] === 0) {
        throw new Error(`No job found with ID: ${jobId}`);
      }
      
      console.log('MSSQLJobRepository.update - END');
      
      return job;
    } catch (error) {
      console.error('MSSQLJobRepository.update - ERROR:', error);
      console.error('MSSQLJobRepository.update - ERROR stack:', error.stack);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid column name')) {
        throw new Error('Database schema error: Invalid column in update query');
      } else if (error.message.includes('Cannot insert the value NULL')) {
        throw new Error('Database constraint error: Required field cannot be null');
      } else if (error.message.includes('String or binary data would be truncated')) {
        throw new Error('Database error: Data too long for database field');
      }
      
      throw error;
    }
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
    
    // Use JobAssignments table for user assignment
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('userId', this.sql.VarChar, userId)
      .query(`
        INSERT INTO JobAssignments (jobId, userId)
        VALUES (@jobId, @userId)
      `);
    
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

  async replacePayItems(jobId, payItems, userId) {
    const pool = await this.db();
    const transaction = new this.sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Delete existing pay items for this job
      await transaction.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query('DELETE FROM PayItems WHERE JobId = @jobId');
      
      // Insert new pay items
      for (const item of payItems) {
        const payItemId = `PI${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await transaction.request()
          .input('payItemId', this.sql.VarChar, payItemId)
          .input('jobId', this.sql.VarChar, jobId)
          .input('description', this.sql.VarChar, item.description)
          .input('actualCost', this.sql.Decimal(10, 2), item.amount)
          .input('billingAmount', this.sql.Decimal(10, 2), item.billingAmount)
          .input('addedBy', this.sql.VarChar, userId)
          .query(`
            INSERT INTO PayItems (PayItemId, JobId, Description, ActualCost, BillingAmount, AddedBy, AddedDate)
            VALUES (@payItemId, @jobId, @description, @actualCost, @billingAmount, @addedBy, GETDATE())
          `);
      }
      
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async replacePayItems(jobId, payItems, userId) {
    const pool = await this.db();
    const transaction = new this.sql.Transaction(pool);

    try {
      await transaction.begin();

      // Delete existing pay items for this job
      await transaction.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query('DELETE FROM PayItems WHERE JobId = @jobId');

      // Insert new pay items
      for (const item of payItems) {
        const payItemId = `PI${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await transaction.request()
          .input('payItemId', this.sql.VarChar, payItemId)
          .input('jobId', this.sql.VarChar, jobId)
          .input('description', this.sql.VarChar, item.description)
          .input('actualCost', this.sql.Decimal(10, 2), item.amount)
          .input('billingAmount', this.sql.Decimal(10, 2), item.billingAmount)
          .input('addedBy', this.sql.VarChar, userId)
          .query(`
            INSERT INTO PayItems (PayItemId, JobId, Description, ActualCost, BillingAmount, AddedBy, AddedDate)
            VALUES (@payItemId, @jobId, @description, @actualCost, @billingAmount, @addedBy, GETDATE())
          `);
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


  async getPayItems(jobId) {
    const pool = await this.db();
    
    try {
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query('SELECT * FROM PayItems WHERE jobId = @jobId ORDER BY addedDate DESC');
      
      return result.recordset.map(row => ({
        id: row.payItemId || row.PayItemId,
        description: row.description || row.Description,
        actualCost: row.actualCost || row.ActualCost || row.amount || row.Amount || 0,
        billingAmount: row.billingAmount || row.BillingAmount || row.amount || row.Amount || 0,
        amount: row.actualCost || row.ActualCost || row.amount || row.Amount || 0,
        addedBy: row.addedBy || row.AddedBy,
        addedDate: row.addedDate || row.AddedDate
      }));
    } catch (error) {
      console.log('Error fetching pay items:', error.message);
      return [];
    }
  }

  async mapToEntity(row) {
    console.log('mapToEntity called with row:', row);
    
    // Get pay items for this job
    const payItems = await this.getPayItems(row.jobId || row.JobId);
    console.log('Pay items:', payItems);
    
    // Get office pay items for this job
    let officePayItems = [];
    try {
      const pool = await this.db();
      const officePayItemsResult = await pool.request()
        .input('jobId', this.sql.VarChar, row.jobId || row.JobId)
        .query(`
          SELECT 
            opi.*,
            u.fullName as paidByName
          FROM OfficePayItems opi
          LEFT JOIN Users u ON opi.paidBy = u.userId
          WHERE opi.jobId = @jobId
          ORDER BY opi.paymentDate DESC
        `);
      
      officePayItems = officePayItemsResult.recordset.map(item => ({
        officePayItemId: item.officePayItemId,
        description: item.description,
        actualCost: parseFloat(item.actualCost) || 0,
        billingAmount: item.billingAmount ? parseFloat(item.billingAmount) : null,
        paidBy: item.paidBy,
        paidByName: item.paidByName,
        paymentDate: item.paymentDate,
        notes: item.notes
      }));
    } catch (error) {
      console.log('Could not fetch office pay items:', error.message);
    }
    
    // Get assigned users for this job (new feature)
    let assignedUsers = [];
    try {
      const pool = await this.db();
      
      // Check if JobAssignments table exists first
      const tableCheck = await pool.request()
        .query(`
          SELECT COUNT(*) as tableExists
          FROM sys.tables 
          WHERE name = 'JobAssignments'
        `);
      
      const hasJobAssignments = tableCheck.recordset[0].tableExists > 0;
      
      if (hasJobAssignments) {
        // Try to get from JobAssignments table directly
        const assignmentResult = await pool.request()
          .input('jobId', this.sql.VarChar, row.jobId || row.JobId)
          .query(`
            SELECT ja.userId, u.fullName as userName 
            FROM JobAssignments ja
            INNER JOIN Users u ON ja.userId = u.userId
            WHERE ja.jobId = @jobId
          `);
        
        assignedUsers = assignmentResult.recordset.map(a => ({
          userId: a.userId,
          userName: a.userName
        }));
      }
    } catch (error) {
      console.log('Could not fetch assigned users:', error.message);
    }
    
    // Create and return Job entity instance
    const job = new Job({
      jobId: row.jobId || row.JobId,
      customerId: row.customerId || row.CustomerId,
      blNumber: row.blNumber || row.BLNumber,
      cusdecNumber: row.cusdecNumber || row.CUSDECNumber,
      openDate: row.openDate || row.OpenDate,
      shipmentCategory: row.shipmentCategory || row.ShipmentCategory,
      exporter: row.exporter || row.Exporter,
      lcNumber: row.lcNumber || row.LCNumber,
      containerNumber: row.containerNumber || row.ContainerNumber,
      transporter: row.transporter || row.Transporter,
      status: row.status || row.Status || 'Open',
      assignedTo: null, // Legacy field - no longer stored in Jobs table
      assignedUsers: assignedUsers, // New field with user details
      createdDate: row.createdDate || row.CreatedDate,
      completedDate: row.completedDate || row.CompletedDate,
      pettyCashStatus: row.pettyCashStatus,
      payItems: payItems || [],
      officePayItems: officePayItems || [] // New field for office pay items
    });
    
    console.log('mapToEntity result:', job.toJSON());
    return job;
  }
}

module.exports = MSSQLJobRepository;
