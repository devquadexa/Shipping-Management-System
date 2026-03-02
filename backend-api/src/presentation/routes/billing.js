/**
 * Billing Routes (Clean Architecture)
 */
const express = require('express');
const { auth, checkRole } = require('../../middleware/auth');
const container = require('../../infrastructure/di/container');
const BillingController = require('../controllers/BillingController');

const router = express.Router();

// Initialize controller with use cases from DI container
const billingController = new BillingController(
  container.get('createBill'),
  container.get('getAllBills'),
  container.get('getBillById'),
  container.get('markBillAsPaid')
);

// Routes
router.post('/', auth, checkRole('Admin', 'Super Admin'), (req, res) => 
  billingController.create(req, res)
);

router.get('/', auth, (req, res) => 
  billingController.getAll(req, res)
);

router.get('/:id', auth, (req, res) => 
  billingController.getById(req, res)
);

router.patch('/:id/pay', auth, checkRole('Admin', 'Super Admin'), (req, res) => 
  billingController.markAsPaid(req, res)
);

router.put('/:id', auth, checkRole('Admin', 'Super Admin'), (req, res) => 
  billingController.markAsPaid(req, res)
);

module.exports = router;
