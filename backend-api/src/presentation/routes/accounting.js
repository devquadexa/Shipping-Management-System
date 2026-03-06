/**
 * Accounting Routes
 * Financial reporting and accounting endpoints
 */
const express = require('express');
const router = express.Router();
const container = require('../../infrastructure/di/container');
const AccountingController = require('../controllers/AccountingController');
const { auth, checkRole } = require('../../middleware/auth');

// Initialize controller
const accountingController = new AccountingController(container);

// Routes - Only Super Admin can access
router.get('/dashboard', 
  auth, 
  checkRole('Super Admin'), 
  (req, res) => accountingController.getDashboard(req, res)
);

module.exports = router;
