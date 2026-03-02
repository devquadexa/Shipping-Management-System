const express = require('express');
const { auth, checkRole } = require('../middleware/auth');
const { getConnection, sql } = require('../config/database');
const router = express.Router();

router.post('/', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { customerId, description, origin, destination, weight, shippingCost, assignedTo } = req.body;
    const pool = await getConnection();
    
    // Get next job ID
    const maxId = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(JobId, 4, 4) AS INT)) as MaxId FROM Jobs');
    
    const nextId = (maxId.recordset[0].MaxId || 0) + 1;
    const jobId = `JOB${String(nextId).padStart(4, '0')}`;
    
    // Insert job
    await pool.request()
      .input('jobId', sql.VarChar, jobId)
      .input('customerId', sql.VarChar, customerId)
      .input('description', sql.VarChar, description)
      .input('origin', sql.VarChar, origin)
      .input('destination', sql.VarChar, destination)
      .input('weight', sql.Decimal(10, 2), weight)
      .input('shippingCost', sql.Decimal(10, 2), shippingCost)
      .input('assignedTo', sql.VarChar, assignedTo || null)
      .input('createdBy', sql.VarChar, req.user.userId)
      .query(`INSERT INTO Jobs (JobId, CustomerId, Description, Origin, Destination, Weight, ShippingCost, AssignedTo, Status, CreatedDate, CreatedBy)
              VALUES (@jobId, @customerId, @description, @origin, @destination, @weight, @shippingCost, @assignedTo, 'Open', GETDATE(), @createdBy)`);
    
    const result = await pool.request()
      .input('jobId', sql.VarChar, jobId)
      .query('SELECT * FROM Jobs WHERE JobId = @jobId');
    
    const job = result.recordset[0];
    
    // Get pay items for this job
    const payItems = await pool.request()
      .input('jobId', sql.VarChar, jobId)
      .query('SELECT * FROM PayItems WHERE JobId = @jobId');
    
    res.status(201).json({
      jobId: job.JobId,
      customerId: job.CustomerId,
      description: job.Description,
      origin: job.Origin,
      destination: job.Destination,
      weight: job.Weight,
      shippingCost: job.ShippingCost,
      assignedTo: job.AssignedTo,
      status: job.Status,
      createdDate: job.CreatedDate,
      createdBy: job.CreatedBy,
      completedDate: job.CompletedDate,
      payItems: payItems.recordset.map(p => ({
        id: p.PayItemId,
        description: p.Description,
        amount: p.Amount,
        addedBy: p.AddedBy,
        addedDate: p.AddedDate
      }))
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    let query = 'SELECT * FROM Jobs';
    
    // Filter by user role
    if (req.user.role === 'User') {
      query += ' WHERE AssignedTo = @userId';
    }
    
    query += ' ORDER BY CreatedDate DESC';
    
    const request = pool.request();
    if (req.user.role === 'User') {
      request.input('userId', sql.VarChar, req.user.userId);
    }
    
    const result = await request.query(query);
    
    // Get pay items for all jobs
    const jobs = await Promise.all(result.recordset.map(async (job) => {
      const payItems = await pool.request()
        .input('jobId', sql.VarChar, job.JobId)
        .query('SELECT * FROM PayItems WHERE JobId = @jobId');
      
      return {
        jobId: job.JobId,
        customerId: job.CustomerId,
        description: job.Description,
        origin: job.Origin,
        destination: job.Destination,
        weight: job.Weight,
        shippingCost: job.ShippingCost,
        assignedTo: job.AssignedTo,
        status: job.Status,
        createdDate: job.CreatedDate,
        createdBy: job.CreatedBy,
        completedDate: job.CompletedDate,
        payItems: payItems.recordset.map(p => ({
          id: p.PayItemId,
          description: p.Description,
          amount: p.Amount,
          addedBy: p.AddedBy,
          addedDate: p.AddedDate
        }))
      };
    }));
    
    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Jobs WHERE JobId = @jobId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const job = result.recordset[0];
    
    // Check access for User role
    if (req.user.role === 'User' && job.AssignedTo !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get pay items
    const payItems = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM PayItems WHERE JobId = @jobId');
    
    res.json({
      jobId: job.JobId,
      customerId: job.CustomerId,
      description: job.Description,
      origin: job.Origin,
      destination: job.Destination,
      weight: job.Weight,
      shippingCost: job.ShippingCost,
      assignedTo: job.AssignedTo,
      status: job.Status,
      createdDate: job.CreatedDate,
      createdBy: job.CreatedBy,
      completedDate: job.CompletedDate,
      payItems: payItems.recordset.map(p => ({
        id: p.PayItemId,
        description: p.Description,
        amount: p.Amount,
        addedBy: p.AddedBy,
        addedDate: p.AddedDate
      }))
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const pool = await getConnection();
    
    // Check if job exists and user has access
    const jobCheck = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Jobs WHERE JobId = @jobId');
    
    if (jobCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const job = jobCheck.recordset[0];
    
    if (req.user.role === 'User' && job.AssignedTo !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update status
    const completedDate = status === 'Completed' ? 'GETDATE()' : 'NULL';
    await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .input('status', sql.VarChar, status)
      .query(`UPDATE Jobs SET Status = @status, CompletedDate = ${completedDate} WHERE JobId = @jobId`);
    
    const result = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Jobs WHERE JobId = @jobId');
    
    const updatedJob = result.recordset[0];
    
    // Get pay items
    const payItems = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM PayItems WHERE JobId = @jobId');
    
    res.json({
      jobId: updatedJob.JobId,
      customerId: updatedJob.CustomerId,
      description: updatedJob.Description,
      origin: updatedJob.Origin,
      destination: updatedJob.Destination,
      weight: updatedJob.Weight,
      shippingCost: updatedJob.ShippingCost,
      assignedTo: updatedJob.AssignedTo,
      status: updatedJob.Status,
      createdDate: updatedJob.CreatedDate,
      createdBy: updatedJob.CreatedBy,
      completedDate: updatedJob.CompletedDate,
      payItems: payItems.recordset.map(p => ({
        id: p.PayItemId,
        description: p.Description,
        amount: p.Amount,
        addedBy: p.AddedBy,
        addedDate: p.AddedDate
      }))
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/assign', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const pool = await getConnection();
    
    await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .input('assignedTo', sql.VarChar, assignedTo)
      .query('UPDATE Jobs SET AssignedTo = @assignedTo WHERE JobId = @jobId');
    
    const result = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Jobs WHERE JobId = @jobId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const job = result.recordset[0];
    
    // Get pay items
    const payItems = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM PayItems WHERE JobId = @jobId');
    
    res.json({
      jobId: job.JobId,
      customerId: job.CustomerId,
      description: job.Description,
      origin: job.Origin,
      destination: job.Destination,
      weight: job.Weight,
      shippingCost: job.ShippingCost,
      assignedTo: job.AssignedTo,
      status: job.Status,
      createdDate: job.CreatedDate,
      createdBy: job.CreatedBy,
      completedDate: job.CompletedDate,
      payItems: payItems.recordset.map(p => ({
        id: p.PayItemId,
        description: p.Description,
        amount: p.Amount,
        addedBy: p.AddedBy,
        addedDate: p.AddedDate
      }))
    });
  } catch (error) {
    console.error('Assign job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/pay-items', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { description, amount } = req.body;
    const pool = await getConnection();
    
    // Check if job exists
    const jobCheck = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT JobId FROM Jobs WHERE JobId = @jobId');
    
    if (jobCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const payItemId = `PI${Date.now()}`;
    
    await pool.request()
      .input('payItemId', sql.VarChar, payItemId)
      .input('jobId', sql.VarChar, req.params.id)
      .input('description', sql.VarChar, description)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('addedBy', sql.VarChar, req.user.userId)
      .query(`INSERT INTO PayItems (PayItemId, JobId, Description, Amount, AddedBy, AddedDate)
              VALUES (@payItemId, @jobId, @description, @amount, @addedBy, GETDATE())`);
    
    // Get updated job with pay items
    const result = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Jobs WHERE JobId = @jobId');
    
    const job = result.recordset[0];
    
    const payItems = await pool.request()
      .input('jobId', sql.VarChar, req.params.id)
      .query('SELECT * FROM PayItems WHERE JobId = @jobId');
    
    res.json({
      jobId: job.JobId,
      customerId: job.CustomerId,
      description: job.Description,
      origin: job.Origin,
      destination: job.Destination,
      weight: job.Weight,
      shippingCost: job.ShippingCost,
      assignedTo: job.AssignedTo,
      status: job.Status,
      createdDate: job.CreatedDate,
      createdBy: job.CreatedBy,
      completedDate: job.CompletedDate,
      payItems: payItems.recordset.map(p => ({
        id: p.PayItemId,
        description: p.Description,
        amount: p.Amount,
        addedBy: p.AddedBy,
        addedDate: p.AddedDate
      }))
    });
  } catch (error) {
    console.error('Add pay item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
