/**
 * Job Controller
 * Handles HTTP requests for job operations
 */
class JobController {
  constructor(createJob, getAllJobs, getJobById, updateJobStatus, assignJob, addPayItem) {
    this.createJob = createJob;
    this.getAllJobs = getAllJobs;
    this.getJobById = getJobById;
    this.updateJobStatus = updateJobStatus;
    this.assignJob = assignJob;
    this.addPayItemUseCase = addPayItem;
  }

  async create(req, res) {
    try {
      const jobData = {
        customerId: req.body.customerId,
        blNumber: req.body.blNumber || null,
        cusdecNumber: req.body.cusdecNumber || null,
        openDate: req.body.openDate || null,
        shipmentCategory: req.body.shipmentCategory,
        assignedTo: req.body.assignedTo || null
      };
      
      const job = await this.createJob.execute(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error('Create job error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {};
      
      // Filter by user role
      if (req.user.role === 'User') {
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
      
      // Check access for User role
      if (req.user.role === 'User' && job.assignedTo !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(job);
    } catch (error) {
      console.error('Get job error:', error);
      res.status(404).json({ message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      
      // Check access for User role
      const job = await this.getJobById.execute(req.params.id);
      if (req.user.role === 'User' && job.assignedTo !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await this.updateJobStatus.execute(req.params.id, status);
      const updatedJob = await this.getJobById.execute(req.params.id);
      
      res.json(updatedJob);
    } catch (error) {
      console.error('Update job status error:', error);
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
}

module.exports = JobController;
