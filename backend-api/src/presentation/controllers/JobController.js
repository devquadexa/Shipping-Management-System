/**
 * Job Controller
 * Handles HTTP requests for job operations
 */
class JobController {
  constructor(createJob, getAllJobs, getJobById, updateJobStatus, assignJob, addPayItem, assignMultipleUsersToJob, replacePayItems, updateJob) {
    this.createJob = createJob;
    this.getAllJobs = getAllJobs;
    this.getJobById = getJobById;
    this.updateJobStatus = updateJobStatus;
    this.assignJob = assignJob;
    this.addPayItemUseCase = addPayItem;
    this.assignMultipleUsersToJob = assignMultipleUsersToJob;
    this.replacePayItemsUseCase = replacePayItems;
    this.updateJobUseCase = updateJob;
    this.updateJob = updateJob;
  }

  async create(req, res) {
    try {
      console.log('=== CREATE JOB START ===');
      console.log('create - req.body:', req.body);
      console.log('create - req.user:', req.user);
      
      const jobData = {
        customerId: req.body.customerId,
        blNumber: req.body.blNumber || null,
        cusdecNumber: req.body.cusdecNumber || null,
        cusdecDate: req.body.cusdecDate || null,
        openDate: req.body.openDate || null,
        shipmentCategory: req.body.shipmentCategory,
        chassisNumber: req.body.chassisNumber || null,
        exporter: req.body.exporter || null,
        transporter: req.body.transporter || null,
        lcNumber: req.body.lcNumber || null,
        containerNumber: req.body.containerNumber || null,
        assignedTo: req.body.assignedTo || null
      };
      
      console.log('create - jobData:', jobData);
      
      // Validate required fields
      if (!jobData.customerId) {
        console.log('create - Missing customerId');
        return res.status(400).json({ message: 'Customer ID is required' });
      }
      if (!jobData.shipmentCategory) {
        console.log('create - Missing shipmentCategory');
        return res.status(400).json({ message: 'Shipment Category is required' });
      }
      
      // Create the job first
      const job = await this.createJob.execute(jobData);
      console.log('create - job created:', job);
      
      // NOTE: Removed automatic addition of a default advance payment pay item.
      // Advance payments should be recorded explicitly via the advance payment
      // endpoints or added by the client when appropriate.
      
      // Handle multiple user assignments if provided
      if (req.body.assignedUsers && Array.isArray(req.body.assignedUsers) && req.body.assignedUsers.length > 0) {
        try {
          console.log('create - assigning users:', req.body.assignedUsers);
          await this.assignMultipleUsersToJob.execute(
            job.jobId, 
            req.body.assignedUsers, 
            req.user.userId
          );
          
          // Get updated job with assignments
          const updatedJob = await this.getJobById.execute(job.jobId);
          console.log('create - job with assignments:', updatedJob);
          console.log('=== CREATE JOB END ===');
          return res.status(201).json(updatedJob);
        } catch (assignmentError) {
          console.error('Error assigning users to job:', assignmentError);
          console.log('=== CREATE JOB END (with assignment error) ===');
          return res.status(201).json({
            ...job,
            message: 'Job created successfully (Note: Job created but user assignment failed)!'
          });
        }
      }
      
      console.log('=== CREATE JOB END ===');
      res.status(201).json(job);
    } catch (error) {
      console.error('Create job error:', error);
      console.error('Error stack:', error.stack);
      console.log('=== CREATE JOB END (with error) ===');
      res.status(400).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const jobId = req.params.id;
      const jobData = {
        blNumber: req.body.blNumber || null,
        cusdecNumber: req.body.cusdecNumber || null,
        openDate: req.body.openDate || null,
        shipmentCategory: req.body.shipmentCategory,
        chassisNumber: req.body.chassisNumber || null,
        exporter: req.body.exporter || null,
        transporter: req.body.transporter || null,
        lcNumber: req.body.lcNumber || null,
        containerNumber: req.body.containerNumber || null,
        status: req.body.status || 'Open',
        assignedTo: req.body.assignedTo || null
      };
      
      const job = await this.updateJob.execute(jobId, jobData);
      res.json(job);
    } catch (error) {
      console.error('Update job error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {};
      
      // Filter by user role - Waff Clerk only sees their assigned jobs
      if (req.user.role === 'Waff Clerk') {
        filters.assignedTo = req.user.userId;
      }
      
      const jobs = await this.getAllJobs.execute(filters);
      console.log('Jobs from use case:', jobs);
      console.log('First job:', JSON.stringify(jobs[0]));
      res.json(jobs);
    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const job = await this.getJobById.execute(req.params.id);
      
      // Check access for Waff Clerk role - verify they're assigned to this job
      if (req.user.role === 'Waff Clerk') {
        const isAssigned = job.assignedUsers && job.assignedUsers.some(user => user.userId === req.user.userId);
        if (!isAssigned) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      res.json(job);
    } catch (error) {
      console.error('Get job error:', error);
      res.status(404).json({ message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      console.log('JobController.updateStatus - params:', req.params);
      console.log('JobController.updateStatus - body:', req.body);
      console.log('JobController.updateStatus - user:', req.user);
      
      const { status } = req.body;
      
      if (!status) {
        console.log('JobController.updateStatus - No status provided');
        return res.status(400).json({ message: 'Status is required' });
      }
      
      // Check access for Waff Clerk role
      const job = await this.getJobById.execute(req.params.id);
      console.log('JobController.updateStatus - found job:', job);
      
      if (req.user.role === 'Waff Clerk') {
        const isAssigned = job.assignedUsers && job.assignedUsers.some(user => user.userId === req.user.userId);
        if (!isAssigned) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      await this.updateJobStatus.execute(req.params.id, status);
      const updatedJob = await this.getJobById.execute(req.params.id);
      
      console.log('JobController.updateStatus - updated job:', updatedJob);
      res.json(updatedJob);
    } catch (error) {
      console.error('Update job status error:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({ message: error.message });
    }
  }

  async assign(req, res) {
    try {
      const { assignedTo } = req.body;
      
      await this.assignJob.execute(req.params.id, assignedTo);
      const job = await this.getJobById.execute(req.params.id);
      
      res.json(job);
    } catch (error) {
      console.error('Assign job error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async addPayItem(req, res) {
    try {
      console.log('Received pay item data:', req.body);
      
      const payItemData = {
        description: req.body.description,
        amount: req.body.amount,
        billingAmount: req.body.billingAmount
      };
      
      console.log('Processed pay item data:', payItemData);
      
      const job = await this.addPayItemUseCase.execute(req.params.id, payItemData, req.user.userId);
      res.json(job);
    } catch (error) {
      console.error('Add pay item error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async replacePayItems(req, res) {
    try {
      console.log('Received pay items data:', req.body);
      
      const payItemsData = req.body.payItems.map(item => {
        // Handle different data structures for backward compatibility
        const description = item.description || item.name || '';
        const amount = parseFloat(item.amount || item.actualCost || 0);
        const billingAmount = parseFloat(item.billingAmount || item.amount || item.actualCost || 0);
        
        return {
          ...item,
          description: description,
          amount: amount,
          actualCost: amount,
          billingAmount: billingAmount,
          paidBy: item.paidBy || 'Office',
          paidByName: item.paidByName || item.paidBy || 'Office',
          source: item.source || 'Custom',
          addedDate: item.addedDate || new Date(),
          paymentStatus: item.paymentStatus || (item.isPaid ? 'Paid' : item.paymentStatus),
          isPaid: item.isPaid === true,
          paidAmount: item.paidAmount !== undefined ? parseFloat(item.paidAmount || 0) : undefined,
          paidAt: item.paidAt || null
        };
      });
      
      console.log('Processed pay items data:', payItemsData);
      
      const job = await this.replacePayItemsUseCase.execute(req.params.id, payItemsData, req.user.userId);
      res.json(job);
    } catch (error) {
      console.error('Replace pay items error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  validateAdvancePaymentPayload(reqBody) {
    const { advancePayment, paymentMadeDate, paymentType, checkNo } = reqBody;
    const amount = parseFloat(advancePayment);

    if (isNaN(amount) || amount <= 0) {
      return { error: 'Valid advance payment amount is required (must be greater than 0)' };
    }

    const validPaymentTypes = ['cash', 'check', 'bank transfer'];
    if (!paymentType || !validPaymentTypes.includes(paymentType)) {
      return { error: 'Payment type is required (cash, check, or bank transfer)' };
    }

    if (!paymentMadeDate) {
      return { error: 'Payment made date is required' };
    }

    if (paymentType === 'check' && (!checkNo || !String(checkNo).trim())) {
      return { error: 'Check number is required for check payments' };
    }

    return { amount };
  }

  async getAdvancePayments(req, res) {
    try {
      const { jobId } = req.params;
      const container = require('../../infrastructure/di/container');
      const jobRepository = container.get('jobRepository');

      const payments = await jobRepository.getAdvancePaymentsByJob(jobId);
      res.json({ success: true, data: payments });
    } catch (error) {
      console.error('Error fetching advance payments:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async addAdvancePayment(req, res) {
    try {
      const { jobId } = req.params;
      const { paymentMadeDate, paymentType, checkNo, notes } = req.body;
      const userId = req.user.userId;

      console.log('Add advance payment request:', { jobId, ...req.body, userId });

      const validation = this.validateAdvancePaymentPayload(req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }

      const container = require('../../infrastructure/di/container');
      const jobRepository = container.get('jobRepository');

      const createdPayment = await jobRepository.addAdvancePayment(
        jobId,
        validation.amount,
        paymentMadeDate,
        paymentType,
        checkNo,
        notes,
        userId
      );

      const updatedJob = await this.getJobById.execute(jobId);
      const payments = await jobRepository.getAdvancePaymentsByJob(jobId);

      res.json({
        message: 'Advance payment added successfully',
        payment: createdPayment,
        payments,
        job: updatedJob
      });
    } catch (error) {
      console.error('Error adding advance payment:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async updateAdvancePaymentEntry(req, res) {
    try {
      const { jobId, paymentId } = req.params;
      const { paymentMadeDate, paymentType, checkNo, notes } = req.body;

      const validation = this.validateAdvancePaymentPayload(req.body);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }

      const container = require('../../infrastructure/di/container');
      const jobRepository = container.get('jobRepository');

      const updatedPayment = await jobRepository.updateAdvancePaymentEntry(
        jobId,
        paymentId,
        validation.amount,
        paymentMadeDate,
        paymentType,
        checkNo,
        notes
      );

      const updatedJob = await this.getJobById.execute(jobId);
      const payments = await jobRepository.getAdvancePaymentsByJob(jobId);

      res.json({
        message: 'Advance payment updated successfully',
        payment: updatedPayment,
        payments,
        job: updatedJob
      });
    } catch (error) {
      console.error('Error updating advance payment entry:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  }

  async deleteAdvancePaymentEntry(req, res) {
    try {
      const { jobId, paymentId } = req.params;

      const container = require('../../infrastructure/di/container');
      const jobRepository = container.get('jobRepository');

      await jobRepository.deleteAdvancePaymentEntry(jobId, paymentId);

      const updatedJob = await this.getJobById.execute(jobId);
      const payments = await jobRepository.getAdvancePaymentsByJob(jobId);

      res.json({
        message: 'Advance payment deleted successfully',
        payments,
        job: updatedJob
      });
    } catch (error) {
      console.error('Error deleting advance payment entry:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  }

  // Legacy endpoint support: treat update as adding a new payment entry.
  async updateAdvancePayment(req, res) {
    return this.addAdvancePayment(req, res);
  }

  async update(req, res) {
    try {
      console.log('JobController.update - START');
      console.log('JobController.update - params:', req.params);
      console.log('JobController.update - body:', JSON.stringify(req.body, null, 2));
      console.log('JobController.update - user:', req.user);
      
      // Validate job ID
      if (!req.params.id) {
        console.log('JobController.update - Missing job ID');
        return res.status(400).json({ message: 'Job ID is required' });
      }
      
      // Validate request body
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log('JobController.update - Empty request body');
        return res.status(400).json({ message: 'Update data is required' });
      }
      
      const jobData = {
        blNumber: req.body.blNumber,
        cusdecNumber: req.body.cusdecNumber,
        cusdecDate: req.body.cusdecDate,
        openDate: req.body.openDate,
        shipmentCategory: req.body.shipmentCategory,
        chassisNumber: req.body.chassisNumber,
        lcNumber: req.body.lcNumber,
        containerNumber: req.body.containerNumber,
        transporter: req.body.transporter,
        exporter: req.body.exporter,
        status: req.body.status
      };
      
      console.log('JobController.update - processed jobData:', JSON.stringify(jobData, null, 2));
      
      const job = await this.updateJobUseCase.execute(req.params.id, jobData);
      console.log('JobController.update - updated job:', JSON.stringify(job, null, 2));
      console.log('JobController.update - END');
      res.json(job);
    } catch (error) {
      console.error('JobController.update - ERROR:', error);
      console.error('JobController.update - ERROR stack:', error.stack);
      
      // Provide specific error messages based on error type
      let statusCode = 400;
      let message = error.message;
      
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('Database')) {
        statusCode = 500;
        message = 'Database error occurred while updating job';
      } else if (error.message.includes('Invalid date')) {
        statusCode = 400;
        message = 'Invalid date format provided';
      } else if (error.message.includes('required')) {
        statusCode = 400;
      }
      
      res.status(statusCode).json({ 
        message: message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = JobController;
