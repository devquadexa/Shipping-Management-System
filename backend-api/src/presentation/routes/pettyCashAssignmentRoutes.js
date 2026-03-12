const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../middleware/auth');

module.exports = (container) => {
  const PettyCashAssignmentController = require('../controllers/PettyCashAssignmentController');
  const controller = new PettyCashAssignmentController(container);

  // Create assignment (Admin/Super Admin only)
  router.post('/', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.create(req, res)
  );

  // Get all assignments (Admin/Super Admin only)
  router.get('/', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.getAll(req, res)
  );

  // Get user balances summary (Admin/Super Admin only)
  router.get('/user-balances', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.getUserBalancesSummary(req, res)
  );

  // Get user's own assignments (All authenticated users)
  router.get('/my', 
    auth, 
    (req, res) => controller.getMyAssignments(req, res)
  );

  // Get assignment by job ID
  router.get('/job/:jobId', 
    auth, 
    (req, res) => controller.getByJob(req, res)
  );

  // Get settlement items for an assignment
  router.get('/:id/settlement-items', 
    auth, 
    (req, res) => controller.getSettlementItems(req, res)
  );

  // Settle assignment (User who was assigned)
  router.post('/:id/settle', 
    auth, 
    (req, res) => controller.settle(req, res)
  );

  return router;
};
