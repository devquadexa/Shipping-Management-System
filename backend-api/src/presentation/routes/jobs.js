/**
 * Job Routes (Clean Architecture)
 */
const express = require('express');
const { auth, checkRole } = require('../../middleware/auth');
const container = require('../../infrastructure/di/container');
const JobController = require('../controllers/JobController');

const router = express.Router();

// Initialize controller with use cases from DI container
const jobController = new JobController(
  container.get('createJob'),
  container.get('getAllJobs'),
  container.get('getJobById'),
  container.get('updateJobStatus'),
  container.get('assignJob'),
  container.get('addPayItem')
);

// Routes
router.post('/', auth, checkRole('Admin', 'Super Admin'), (req, res) => 
  jobController.create(req, res)
);

router.get('/', auth, (req, res) => 
  jobController.getAll(req, res)
);

router.get('/:id', auth, (req, res) => 
  jobController.getById(req, res)
);

router.patch('/:id/status', auth, (req, res) => 
  jobController.updateStatus(req, res)
);

router.patch('/:id/assign', auth, checkRole('Admin', 'Super Admin'), (req, res) => 
  jobController.assign(req, res)
);

router.post('/:id/pay-items', auth, checkRole('Admin', 'Super Admin'), (req, res) => 
  jobController.addPayItem(req, res)
);

module.exports = router;
