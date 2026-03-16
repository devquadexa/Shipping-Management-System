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
  container.get('addPayItem'),
  container.get('assignMultipleUsersToJob'),
  container.get('replacePayItems'),
  container.get('updateJob')
);

// Routes
router.post('/', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => 
  jobController.create(req, res)
);

router.put('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => 
  jobController.update(req, res)
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

router.put('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => {
  console.log('PUT /:id route hit - jobId:', req.params.id);
  console.log('PUT /:id route hit - user:', req.user);
  console.log('PUT /:id route hit - body:', req.body);
  jobController.update(req, res);
});

router.patch('/:id/assign', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => 
  jobController.assign(req, res)
);

router.post('/:id/pay-items', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => 
  jobController.addPayItem(req, res)
);

router.put('/:id/pay-items', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => 
  jobController.replacePayItems(req, res)
);

module.exports = router;
