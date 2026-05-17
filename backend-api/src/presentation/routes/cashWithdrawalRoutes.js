/**
 * Cash Withdrawal Routes
 */
const express = require('express');
const { auth, checkRole } = require('../../middleware/auth');
const container = require('../../infrastructure/di/container');
const CashWithdrawalController = require('../controllers/CashWithdrawalController');

const router = express.Router();

// Initialize controller with use cases from DI container
const cashWithdrawalController = new CashWithdrawalController(
  container.get('createCashWithdrawal'),
  container.get('getAllCashWithdrawals')
);

// Routes (Admin/Super Admin only)
router.post('/', 
  auth, 
  checkRole('Admin', 'Super Admin'), 
  (req, res) => cashWithdrawalController.create(req, res)
);

router.get('/', 
  auth, 
  checkRole('Admin', 'Super Admin', 'Manager'), 
  (req, res) => cashWithdrawalController.getAll(req, res)
);

module.exports = router;
