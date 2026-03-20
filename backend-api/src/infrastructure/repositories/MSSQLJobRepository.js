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
    this.schemaEnsured = false;
  }

  async ensureSchema() {
    if (this.schemaEnsured) {
      return;
    }

    const pool = await this.db();

    await pool.request().query(`
      IF COL_LENGTH('Jobs', 'BLNumber') IS NULL
        ALTER TABLE Jobs ADD BLNumber NVARCHAR(100) NULL;

      IF COL_LENGTH('Jobs', 'CUSDECNumber') IS NULL
        ALTER TABLE Jobs ADD CUSDECNumber NVARCHAR(100) NULL;

      IF COL_LENGTH('Jobs', 'LCNumber') IS NULL
        ALTER TABLE Jobs ADD LCNumber NVARCHAR(100) NULL;

      IF COL_LENGTH('Jobs', 'ContainerNumber') IS NULL
        ALTER TABLE Jobs ADD ContainerNumber NVARCHAR(100) NULL;

      IF COL_LENGTH('Jobs', 'Transporter') IS NULL
        ALTER TABLE Jobs ADD Transporter NVARCHAR(200) NULL;

      IF COL_LENGTH('Jobs', 'Exporter') IS NULL
        ALTER TABLE Jobs ADD Exporter NVARCHAR(200) NULL;

      IF COL_LENGTH('Jobs', 'AssignedTo') IS NULL
        ALTER TABLE Jobs ADD AssignedTo VARCHAR(50) NULL;

      IF COL_LENGTH('Jobs', 'CreatedDate') IS NULL
        ALTER TABLE Jobs ADD CreatedDate DATETIME DEFAULT GETDATE();
      
      IF COL_LENGTH('Jobs', 'payItems') IS NULL
        ALTER TABLE Jobs ADD payItems NVARCHAR(MAX) NULL;
      
      IF COL_LENGTH('Jobs', 'shipmentCategory') IS NULL
        ALTER TABLE Jobs ADD shipmentCategory NVARCHAR(100) NULL;
      
      IF COL_LENGTH('Jobs', 'openDate') IS NULL
        ALTER TABLE Jobs ADD openDate DATETIME NULL;
      
      IF COL_LENGTH('Jobs', 'pettyCashStatus') IS NULL
        ALTER TABLE Jobs ADD pettyCashStatus NVARCHAR(50) NULL;
      
      IF COL_LENGTH('Jobs', 'assignedUsers') IS NULL
        ALTER TABLE Jobs ADD assignedUsers NVARCHAR(MAX) NULL;
      
      IF COL_LENGTH('Jobs', 'officePayItems') IS NULL
        ALTER TABLE Jobs ADD officePayItems NVARCHAR(MAX) NULL;
      
      IF COL_LENGTH('Jobs', 'advancePayment') IS NULL
        ALTER TABLE Jobs ADD advancePayment DECIMAL(18,2) DEFAULT 0.00;
      
      IF COL_LENGTH('Jobs', 'advancePaymentDate') IS NULL
        ALTER TABLE Jobs ADD advancePaymentDate DATETIME NULL;

      IF COL_LENGTH('Jobs', 'advancePaymentType') IS NULL AND COL_LENGTH('Jobs', 'AdvancePaymentType') IS NULL
        ALTER TABLE Jobs ADD advancePaymentType NVARCHAR(50) NULL;

      IF COL_LENGTH('Jobs', 'advancePaymentCheckNo') IS NULL AND COL_LENGTH('Jobs', 'AdvancePaymentCheckNo') IS NULL
        ALTER TABLE Jobs ADD advancePaymentCheckNo NVARCHAR(100) NULL;
      
      IF COL_LENGTH('Jobs', 'advancePaymentNotes') IS NULL
        ALTER TABLE Jobs ADD advancePaymentNotes NVARCHAR(MAX) NULL;
      
      IF COL_LENGTH('Jobs', 'advancePaymentRecordedBy') IS NULL
        ALTER TABLE Jobs ADD advancePaymentRecordedBy VARCHAR(50) NULL;
      
      IF COL_LENGTH('Jobs', 'metadata') IS NULL
        ALTER TABLE Jobs ADD metadata NVARCHAR(MAX) NULL;

      IF OBJECT_ID('JobAdvancePayments', 'U') IS NULL
      BEGIN
        CREATE TABLE JobAdvancePayments (
          advancePaymentId INT IDENTITY(1,1) PRIMARY KEY,
          jobId VARCHAR(50) NOT NULL,
          amount DECIMAL(18,2) NOT NULL,
          paymentMadeDate DATETIME NOT NULL,
          paymentType NVARCHAR(50) NULL,
          checkNo NVARCHAR(100) NULL,
          notes NVARCHAR(MAX) NULL,
          recordedBy VARCHAR(50) NULL,
          recordedDate DATETIME NOT NULL DEFAULT GETDATE()
        );
      END
    `);

    this.schemaEnsured = true;
  }

  async create(job) {
    await this.ensureSchema();
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
      .input('transporter', this.sql.VarChar, job.transporter)
      .input('lcNumber', this.sql.VarChar, job.lcNumber)
      .input('containerNumber', this.sql.VarChar, job.containerNumber)
      .input('status', this.sql.VarChar, job.status)
      .input('assignedTo', this.sql.VarChar, job.assignedTo)
      .input('createdDate', this.sql.DateTime, job.createdDate)
      .query(`
        INSERT INTO Jobs (JobId, CustomerId, BLNumber, CUSDECNumber, OpenDate, ShipmentCategory, Exporter, Transporter, LCNumber, ContainerNumber, Status, AssignedTo, CreatedDate)
        VALUES (@jobId, @customerId, @blNumber, @cusdecNumber, @openDate, @shipmentCategory, @exporter, @transporter, @lcNumber, @containerNumber, @status, @assignedTo, @createdDate)
      `);
    
    console.log('MSSQLJobRepository.create - job created successfully');
    return job;
  }

  async findById(jobId) {
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
    const pool = await this.db();
    
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('SELECT * FROM Jobs WHERE CustomerId = @customerId ORDER BY CreatedDate DESC');
    
    return await Promise.all(result.recordset.map(row => this.mapToEntity(row)));
  }

  async update(jobId, job) {
    await this.ensureSchema();
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('blNumber', this.sql.VarChar, job.blNumber)
      .input('cusdecNumber', this.sql.VarChar, job.cusdecNumber)
      .input('openDate', this.sql.Date, job.openDate)
      .input('shipmentCategory', this.sql.VarChar, job.shipmentCategory)
      .input('exporter', this.sql.VarChar, job.exporter)
      .input('transporter', this.sql.VarChar, job.transporter)
      .input('lcNumber', this.sql.VarChar, job.lcNumber)
      .input('containerNumber', this.sql.VarChar, job.containerNumber)
      .input('status', this.sql.VarChar, job.status)
      .input('assignedTo', this.sql.VarChar, job.assignedTo)
      .query(`
        UPDATE Jobs 
        SET BLNumber = @blNumber, CUSDECNumber = @cusdecNumber, OpenDate = @openDate,
            ShipmentCategory = @shipmentCategory, Exporter = @exporter, Transporter = @transporter,
            LCNumber = @lcNumber, ContainerNumber = @containerNumber, Status = @status, AssignedTo = @assignedTo
        WHERE JobId = @jobId
      `);
    
    return job;
  }

  async syncAdvancePaymentAggregate(jobId) {
    const pool = await this.db();

    const aggregateResult = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query(`
        SELECT
          ISNULL(SUM(amount), 0) AS totalAdvancePayment,
          MAX(paymentMadeDate) AS latestPaymentDate
        FROM JobAdvancePayments
        WHERE jobId = @jobId
      `);

    const latestPaymentResult = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query(`
        SELECT TOP 1 paymentType, checkNo, notes, recordedBy
        FROM JobAdvancePayments
        WHERE jobId = @jobId
        ORDER BY paymentMadeDate DESC, advancePaymentId DESC
      `);

    const totalAdvancePayment = parseFloat(aggregateResult.recordset[0].totalAdvancePayment || 0);
    const latestPaymentDate = aggregateResult.recordset[0].latestPaymentDate || null;
    const latestPayment = latestPaymentResult.recordset[0] || {};

    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('advancePayment', this.sql.Decimal(18,2), totalAdvancePayment)
      .input('advancePaymentDate', this.sql.DateTime, latestPaymentDate)
      .input('advancePaymentType', this.sql.VarChar, latestPayment.paymentType || null)
      .input('advancePaymentCheckNo', this.sql.VarChar, latestPayment.checkNo || null)
      .input('advancePaymentNotes', this.sql.VarChar, latestPayment.notes || null)
      .input('advancePaymentRecordedBy', this.sql.VarChar, latestPayment.recordedBy || null)
      .query(`
        UPDATE Jobs
        SET advancePayment = @advancePayment,
            advancePaymentDate = @advancePaymentDate,
            advancePaymentNotes = @advancePaymentNotes,
            advancePaymentRecordedBy = @advancePaymentRecordedBy
        WHERE JobId = @jobId

        IF COL_LENGTH('Jobs', 'advancePaymentType') IS NOT NULL
          UPDATE Jobs SET advancePaymentType = @advancePaymentType WHERE JobId = @jobId

        IF COL_LENGTH('Jobs', 'advancePaymentCheckNo') IS NOT NULL
          UPDATE Jobs SET advancePaymentCheckNo = @advancePaymentCheckNo WHERE JobId = @jobId

        IF COL_LENGTH('Jobs', 'AdvancePaymentType') IS NOT NULL
          UPDATE Jobs SET AdvancePaymentType = @advancePaymentType WHERE JobId = @jobId

        IF COL_LENGTH('Jobs', 'AdvancePaymentCheckNo') IS NOT NULL
          UPDATE Jobs SET AdvancePaymentCheckNo = @advancePaymentCheckNo WHERE JobId = @jobId
      `);

    return {
      totalAdvancePayment,
      latestPaymentDate,
      latestPaymentType: latestPayment.paymentType || null,
      latestCheckNo: latestPayment.checkNo || null,
      latestNotes: latestPayment.notes || null,
      latestRecordedBy: latestPayment.recordedBy || null,
    };
  }

  async addAdvancePayment(jobId, advancePayment, paymentDate, paymentType, checkNo, notes, recordedByUserId) {
    await this.ensureSchema();
    const pool = await this.db();

    const amount = parseFloat(advancePayment) || 0;
    const advanceDate = paymentDate ? new Date(paymentDate) : new Date();
    const finalPaymentType = paymentType || null;
    const finalCheckNo = paymentType === 'check' ? checkNo : null;

    if (amount <= 0) {
      throw new Error('Advance payment amount must be greater than 0');
    }

    // Backward compatibility: if old aggregate exists but no payment rows yet, preserve it as a legacy entry.
    const existingPaymentCountResult = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('SELECT COUNT(*) AS paymentCount FROM JobAdvancePayments WHERE jobId = @jobId');

    const existingPaymentCount = existingPaymentCountResult.recordset[0].paymentCount || 0;

    if (existingPaymentCount === 0) {
      const legacyResult = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query(`
          SELECT
            advancePayment,
            advancePaymentDate,
            advancePaymentType,
            advancePaymentCheckNo,
            advancePaymentNotes,
            advancePaymentRecordedBy
          FROM Jobs
          WHERE JobId = @jobId
        `);

      const legacyPayment = legacyResult.recordset[0];
      const legacyAmount = parseFloat(legacyPayment?.advancePayment || 0);
      if (legacyAmount > 0) {
        await pool.request()
          .input('jobId', this.sql.VarChar, jobId)
          .input('amount', this.sql.Decimal(18,2), legacyAmount)
          .input('paymentMadeDate', this.sql.DateTime, legacyPayment.advancePaymentDate || new Date())
          .input('paymentType', this.sql.VarChar, legacyPayment.advancePaymentType || null)
          .input('checkNo', this.sql.VarChar, legacyPayment.advancePaymentCheckNo || null)
          .input('notes', this.sql.VarChar, legacyPayment.advancePaymentNotes || 'Legacy advance payment')
          .input('recordedBy', this.sql.VarChar, legacyPayment.advancePaymentRecordedBy || null)
          .query(`
            INSERT INTO JobAdvancePayments (
              jobId, amount, paymentMadeDate, paymentType, checkNo, notes, recordedBy
            )
            VALUES (
              @jobId, @amount, @paymentMadeDate, @paymentType, @checkNo, @notes, @recordedBy
            )
          `);
      }
    }

    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('amount', this.sql.Decimal(18,2), amount)
      .input('paymentMadeDate', this.sql.DateTime, advanceDate)
      .input('paymentType', this.sql.VarChar, finalPaymentType)
      .input('checkNo', this.sql.VarChar, finalCheckNo)
      .input('notes', this.sql.VarChar, notes || null)
      .input('recordedBy', this.sql.VarChar, recordedByUserId)
      .query(`
        INSERT INTO JobAdvancePayments (
          jobId, amount, paymentMadeDate, paymentType, checkNo, notes, recordedBy
        )
        VALUES (
          @jobId, @amount, @paymentMadeDate, @paymentType, @checkNo, @notes, @recordedBy
        )
      `);

    await this.syncAdvancePaymentAggregate(jobId);

    const createdPaymentResult = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query(`
        SELECT TOP 1 *
        FROM JobAdvancePayments
        WHERE jobId = @jobId
        ORDER BY advancePaymentId DESC
      `);

    const createdPayment = createdPaymentResult.recordset[0];
    return {
      advancePaymentId: createdPayment.advancePaymentId,
      jobId: createdPayment.jobId,
      amount: parseFloat(createdPayment.amount),
      paymentMadeDate: createdPayment.paymentMadeDate,
      paymentType: createdPayment.paymentType,
      checkNo: createdPayment.checkNo,
      notes: createdPayment.notes,
      recordedBy: createdPayment.recordedBy,
      recordedDate: createdPayment.recordedDate,
    };
  }

  async getAdvancePaymentsByJob(jobId) {
    await this.ensureSchema();
    const pool = await this.db();

    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query(`
        SELECT
          jap.advancePaymentId,
          jap.jobId,
          jap.amount,
          jap.paymentMadeDate,
          jap.paymentType,
          jap.checkNo,
          jap.notes,
          jap.recordedBy,
          jap.recordedDate,
          u.fullName AS recordedByName
        FROM JobAdvancePayments jap
        LEFT JOIN Users u ON jap.recordedBy = u.userId
        WHERE jap.jobId = @jobId
        ORDER BY jap.paymentMadeDate DESC, jap.advancePaymentId DESC
      `);

    return result.recordset.map((row) => ({
      advancePaymentId: row.advancePaymentId,
      jobId: row.jobId,
      amount: parseFloat(row.amount),
      paymentMadeDate: row.paymentMadeDate,
      paymentType: row.paymentType,
      checkNo: row.checkNo,
      notes: row.notes,
      recordedBy: row.recordedBy,
      recordedByName: row.recordedByName,
      recordedDate: row.recordedDate,
    }));
  }

  async updateAdvancePaymentEntry(jobId, paymentId, amount, paymentDate, paymentType, checkNo, notes) {
    await this.ensureSchema();
    const pool = await this.db();

    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      throw new Error('Advance payment amount must be greater than 0');
    }

    const paymentIdInt = parseInt(paymentId, 10);
    if (Number.isNaN(paymentIdInt)) {
      throw new Error('Invalid advance payment record id');
    }

    const normalizedDate = paymentDate ? new Date(paymentDate) : new Date();
    const normalizedType = paymentType || null;
    const normalizedCheckNo = paymentType === 'check' ? (checkNo || null) : null;

    const updateResult = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('paymentId', this.sql.Int, paymentIdInt)
      .input('amount', this.sql.Decimal(18,2), parsedAmount)
      .input('paymentMadeDate', this.sql.DateTime, normalizedDate)
      .input('paymentType', this.sql.VarChar, normalizedType)
      .input('checkNo', this.sql.VarChar, normalizedCheckNo)
      .input('notes', this.sql.VarChar, notes || null)
      .query(`
        UPDATE JobAdvancePayments
        SET amount = @amount,
            paymentMadeDate = @paymentMadeDate,
            paymentType = @paymentType,
            checkNo = @checkNo,
            notes = @notes
        WHERE advancePaymentId = @paymentId AND jobId = @jobId
      `);

    if (!updateResult.rowsAffected || updateResult.rowsAffected[0] === 0) {
      throw new Error('Advance payment record not found for this job');
    }

    await this.syncAdvancePaymentAggregate(jobId);

    const updatedResult = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('paymentId', this.sql.Int, paymentIdInt)
      .query(`
        SELECT
          jap.advancePaymentId,
          jap.jobId,
          jap.amount,
          jap.paymentMadeDate,
          jap.paymentType,
          jap.checkNo,
          jap.notes,
          jap.recordedBy,
          jap.recordedDate,
          u.fullName AS recordedByName
        FROM JobAdvancePayments jap
        LEFT JOIN Users u ON jap.recordedBy = u.userId
        WHERE jap.advancePaymentId = @paymentId AND jap.jobId = @jobId
      `);

    const row = updatedResult.recordset[0];
    return {
      advancePaymentId: row.advancePaymentId,
      jobId: row.jobId,
      amount: parseFloat(row.amount),
      paymentMadeDate: row.paymentMadeDate,
      paymentType: row.paymentType,
      checkNo: row.checkNo,
      notes: row.notes,
      recordedBy: row.recordedBy,
      recordedByName: row.recordedByName,
      recordedDate: row.recordedDate,
    };
  }

  async deleteAdvancePaymentEntry(jobId, paymentId) {
    await this.ensureSchema();
    const pool = await this.db();

    const paymentIdInt = parseInt(paymentId, 10);
    if (Number.isNaN(paymentIdInt)) {
      throw new Error('Invalid advance payment record id');
    }

    const deleteResult = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('paymentId', this.sql.Int, paymentIdInt)
      .query(`
        DELETE FROM JobAdvancePayments
        WHERE advancePaymentId = @paymentId AND jobId = @jobId
      `);

    if (!deleteResult.rowsAffected || deleteResult.rowsAffected[0] === 0) {
      throw new Error('Advance payment record not found for this job');
    }

    await this.syncAdvancePaymentAggregate(jobId);
    return true;
  }

  // Legacy support: old update endpoint now appends a payment entry.
  async updateAdvancePayment(jobId, advancePayment, paymentDate, paymentType, checkNo, notes, recordedByUserId) {
    return this.addAdvancePayment(jobId, advancePayment, paymentDate, paymentType, checkNo, notes, recordedByUserId);
  }

  async updateStatus(jobId, status) {
    await this.ensureSchema();
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('status', this.sql.VarChar, status)
      .query('UPDATE Jobs SET Status = @status WHERE JobId = @jobId');
    
    return true;
  }

  async assignToUser(jobId, userId) {
    await this.ensureSchema();
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
    await this.ensureSchema();
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
    await this.ensureSchema();
    const pool = await this.db();
    
    try {
      console.log('=== REPLACE PAY ITEMS START ===');
      console.log('replacePayItems - jobId:', jobId);
      console.log('replacePayItems - payItems:', payItems);
      console.log('replacePayItems - payItems length:', payItems?.length);
      console.log('replacePayItems - payItems type:', typeof payItems);
      console.log('replacePayItems - userId:', userId);
      
      // Store pay items as JSON in the Jobs table
      const payItemsJson = JSON.stringify(payItems);
      console.log('replacePayItems - JSON to store:', payItemsJson);
      
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .input('payItems', this.sql.NVarChar, payItemsJson)
        .query(`
          UPDATE Jobs 
          SET payItems = @payItems
          WHERE jobId = @jobId
        `);
      
      console.log('replacePayItems - UPDATE result:', result);
      console.log('replacePayItems - Rows affected:', result.rowsAffected);
      console.log('✓ Pay items stored as JSON in Jobs table');
      
      // Verify the data was saved by reading it back
      const verifyResult = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query('SELECT payItems FROM Jobs WHERE jobId = @jobId');
      
      console.log('replacePayItems - Verification query result:', verifyResult.recordset);
      if (verifyResult.recordset.length > 0) {
        console.log('replacePayItems - Stored payItems:', verifyResult.recordset[0].payItems);
      }
      
      // Also try to store in separate PayItems table if it exists (for backward compatibility)
      try {
        const transaction = new this.sql.Transaction(pool);
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
            .input('actualCost', this.sql.Decimal(10, 2), item.amount || item.actualCost || 0)
            .input('billingAmount', this.sql.Decimal(10, 2), item.billingAmount || item.amount || 0)
            .input('addedBy', this.sql.VarChar, userId)
            .query(`
              INSERT INTO PayItems (PayItemId, JobId, Description, ActualCost, BillingAmount, AddedBy, AddedDate)
              VALUES (@payItemId, @jobId, @description, @actualCost, @billingAmount, @addedBy, GETDATE())
            `);
        }
        
        await transaction.commit();
        console.log('✓ Pay items also stored in PayItems table (if exists)');
      } catch (tableError) {
        console.log('⚠ Could not store in PayItems table (table may not exist):', tableError.message);
      }
      
      console.log('=== REPLACE PAY ITEMS END ===');
      return true;
    } catch (error) {
      console.error('❌ Error in replacePayItems:', error);
      throw error;
    }
  }



  async getPayItems(jobId) {
    await this.ensureSchema();
    const pool = await this.db();
    
    try {
      console.log('=== GET PAY ITEMS START ===');
      console.log('getPayItems - jobId:', jobId);
      
      // First try to get from the Jobs table payItems JSON column
      const jobResult = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query('SELECT payItems FROM Jobs WHERE jobId = @jobId');
      
      console.log('getPayItems - Query result:', jobResult.recordset);
      
      if (jobResult.recordset.length > 0) {
        const payItemsData = jobResult.recordset[0].payItems;
        console.log('getPayItems - Raw payItems data from DB:', payItemsData);
        console.log('getPayItems - PayItems data type:', typeof payItemsData);
        console.log('getPayItems - PayItems data length:', payItemsData?.length);
        
        if (payItemsData) {
          try {
            let payItems;
            if (typeof payItemsData === 'string') {
              console.log('getPayItems - Parsing JSON string...');
              payItems = JSON.parse(payItemsData);
            } else {
              console.log('getPayItems - Using data as-is...');
              payItems = payItemsData;
            }
            
            console.log('getPayItems - Processed pay items:', payItems);
            console.log('getPayItems - Is array:', Array.isArray(payItems));
            console.log('getPayItems - Array length:', payItems?.length);
            
            if (Array.isArray(payItems) && payItems.length > 0) {
              console.log('✅ Returning pay items from Jobs table JSON:', payItems);
              console.log('=== GET PAY ITEMS END (SUCCESS) ===');
              return payItems;
            } else {
              console.log('⚠ Pay items array is empty or invalid');
            }
          } catch (parseError) {
            console.log('❌ Error parsing payItems JSON:', parseError.message);
            console.log('Raw data that failed to parse:', payItemsData);
          }
        } else {
          console.log('⚠ PayItems data is null/undefined');
        }
      } else {
        console.log('❌ No job found with jobId:', jobId);
      }
      
      // Fallback: try to get from separate PayItems table (if it exists)
      console.log('getPayItems - Trying PayItems table fallback...');
      try {
        const result = await pool.request()
          .input('jobId', this.sql.VarChar, jobId)
          .query('SELECT * FROM PayItems WHERE jobId = @jobId ORDER BY addedDate DESC');
        
        console.log('getPayItems - PayItems table result:', result.recordset);
        
        const payItems = result.recordset.map(row => ({
          id: row.payItemId || row.PayItemId,
          description: row.description || row.Description,
          actualCost: row.actualCost || row.ActualCost || row.amount || row.Amount || 0,
          billingAmount: row.billingAmount || row.BillingAmount || row.amount || row.Amount || 0,
          amount: row.actualCost || row.ActualCost || row.amount || row.Amount || 0,
          addedBy: row.addedBy || row.AddedBy,
          addedDate: row.addedDate || row.AddedDate
        }));
        
        if (payItems.length > 0) {
          console.log('✅ Returning pay items from PayItems table:', payItems);
          console.log('=== GET PAY ITEMS END (FALLBACK SUCCESS) ===');
          return payItems;
        } else {
          console.log('⚠ No pay items found in PayItems table');
        }
      } catch (tableError) {
        console.log('❌ PayItems table does not exist or error accessing it:', tableError.message);
      }
      
      console.log('❌ No pay items found for job:', jobId);
      console.log('=== GET PAY ITEMS END (NO DATA) ===');
      return [];
    } catch (error) {
      console.log('❌ Error fetching pay items:', error.message);
      console.log('=== GET PAY ITEMS END (ERROR) ===');
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
    
    // Parse JSON fields from database
    let assignedUsersFromJson = [];
    let officePayItemsFromJson = [];
    let metadataFromJson = {};
    
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
            WHERE ja.jobId = @jobId AND ja.isActive = 1
            ORDER BY ja.assignedDate DESC
          `);
        
        assignedUsers = assignmentResult.recordset.map(a => ({
          userId: a.userId,
          userName: a.userName
        }));
      }
    } catch (error) {
      console.log('Could not parse assignedUsers JSON:', error.message);
    }
    
    try {
      if (row.officePayItems && typeof row.officePayItems === 'string') {
        officePayItemsFromJson = JSON.parse(row.officePayItems);
      } else if (Array.isArray(row.officePayItems)) {
        officePayItemsFromJson = row.officePayItems;
      }
    } catch (error) {
      console.log('Could not parse officePayItems JSON:', error.message);
    }
    
    try {
      if (row.metadata && typeof row.metadata === 'string') {
        metadataFromJson = JSON.parse(row.metadata);
      } else if (typeof row.metadata === 'object' && row.metadata !== null) {
        metadataFromJson = row.metadata;
      }
    } catch (error) {
      console.log('Could not parse metadata JSON:', error.message);
    }
    
    // Get assigned users for this job (new feature) - prefer JSON data, fallback to table
    let assignedUsers = assignedUsersFromJson;
    if (assignedUsers.length === 0) {
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
    }
    
    // Merge office pay items from JSON and table (prefer table data)
    const finalOfficePayItems = officePayItems.length > 0 ? officePayItems : officePayItemsFromJson;
    
    // Create and return Job entity instance
    const job = new Job({
      jobId: row.JobId,
      customerId: row.CustomerId,
      blNumber: row.BLNumber,
      cusdecNumber: row.CUSDECNumber,
      openDate: row.openDate || row.OpenDate,
      shipmentCategory: row.shipmentCategory || row.ShipmentCategory,
      exporter: row.Exporter,
      transporter: row.Transporter,
      lcNumber: row.LCNumber,
      containerNumber: row.ContainerNumber,
      status: row.Status || 'Open',
      assignedTo: row.AssignedTo, // Legacy field
      assignedUsers: assignedUsers, // New field with user details
      createdDate: row.createdDate || row.CreatedDate,
      completedDate: row.completedDate || row.CompletedDate,
      pettyCashStatus: row.pettyCashStatus,
      advancePayment: row.advancePayment ?? row.AdvancePayment ?? 0.00,
      advancePaymentDate: row.advancePaymentDate || row.AdvancePaymentDate,
      advancePaymentType: row.advancePaymentType || row.AdvancePaymentType,
      advancePaymentCheckNo: row.advancePaymentCheckNo || row.AdvancePaymentCheckNo,
      advancePaymentNotes: row.advancePaymentNotes || row.AdvancePaymentNotes,
      advancePaymentRecordedBy: row.advancePaymentRecordedBy || row.AdvancePaymentRecordedBy,
      payItems: payItems || [],
      officePayItems: finalOfficePayItems || [], // New field for office pay items
      metadata: metadataFromJson
    });
    
    console.log('mapToEntity result:', job.toJSON());
    return job;
  }
}

module.exports = MSSQLJobRepository;
