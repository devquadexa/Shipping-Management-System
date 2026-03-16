/**
 * Customer Routes
 * Clean Architecture version
 */
const express = require('express');
const router = express.Router();
const container = require('../../infrastructure/di/container');
const CustomerController = require('../controllers/CustomerController');
const { auth, checkRole } = require('../../middleware/auth');

// Initialize controller with dependencies
const customerController = new CustomerController(container);

// Routes
router.get('/categories/all', 
  auth, 
  (req, res) => customerController.getCategories(req, res)
);

router.post('/', 
  auth, 
  (req, res) => customerController.create(req, res)
);

router.get('/', 
  auth, 
  (req, res) => customerController.getAll(req, res)
);

router.get('/:id', 
  auth, 
  (req, res) => customerController.getById(req, res)
);

router.put('/:id', 
  auth, 
  checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), 
  (req, res) => customerController.update(req, res)
);

router.delete('/:id', 
  auth, 
  checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), 
  (req, res) => customerController.delete(req, res)
);

module.exports = router;
