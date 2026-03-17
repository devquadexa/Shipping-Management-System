/**
 * Office Pay Items Routes
 */
const express = require('express');
const { auth, checkRole } = require('../../middleware/auth');
const container = require('../../infrastructure/di/container');
const OfficePayItemController = require('../controllers/OfficePayItemController');

const router = express.Router();

// Initialize controller with use cases from DI container
const officePayItemController = new OfficePayItemController(
  container.get('createOfficePayItem'),
  container.get('getOfficePayItemsByJob'),
  container.get('updateOfficePayItem'),
  container.get('deleteOfficePayItem')
);

// Routes - Only Admin, Super Admin, Manager, and Office Executive can manage office pay items
router.post('/', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => 
  officePayItemController.create(req, res)
);

router.get('/job/:jobId', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => 
  officePayItemController.getByJobId(req, res)
);

router.put('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => 
  officePayItemController.update(req, res)
);

router.delete('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => 
  officePayItemController.delete(req, res)
);

module.exports = router;