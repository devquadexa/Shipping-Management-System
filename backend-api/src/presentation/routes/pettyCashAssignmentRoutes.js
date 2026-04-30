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

  // Get grouped assignments (Admin/Super Admin/Manager)
  router.get('/grouped', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.getGrouped(req, res)
  );

  // Get user's grouped assignments (Waff Clerk)
  router.get('/my-grouped', 
    auth, 
    (req, res) => controller.getMyGrouped(req, res)
  );

  // Get aggregated assignments (Admin/Super Admin/Manager) - ONE row per job+user
  router.get('/aggregated', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.getAggregated(req, res)
  );

  // Get user's aggregated assignments (Waff Clerk) - ONE row per job
  router.get('/my-aggregated', 
    auth, 
    (req, res) => controller.getMyAggregated(req, res)
  );

  // Get assignments with children (parent-child structure)
  router.get('/with-children', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.getWithChildren(req, res)
  );

  // Get user's assignments with children
  router.get('/my-with-children', 
    auth, 
    (req, res) => controller.getMyWithChildren(req, res)
  );

  // Create sub-assignment under a parent
  router.post('/:id/sub-assignment', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.createSubAssignment(req, res)
  );

  // Get sub-assignments for a parent
  router.get('/:id/sub-assignments', 
    auth, 
    (req, res) => controller.getSubAssignments(req, res)
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

  // Get ALL assignments for a job (for Invoicing)
  router.get('/job/:jobId/all', 
    auth, 
    checkRole('Admin', 'Super Admin', 'Manager'), 
    (req, res) => controller.getAllByJob(req, res)
  );

  // Get settlement items for an assignment
  router.get('/:id/settlement-items', 
    auth, 
    (req, res) => controller.getSettlementItems(req, res)
  );
  
  // Update settlement item (Waff Clerk only, before invoice generation)
  router.patch('/:assignmentId/settlement-items/:itemId', 
    auth, 
    checkRole('Waff Clerk'), 
    (req, res) => controller.updateSettlementItem(req, res)
  );
  
  // Delete settlement item (Waff Clerk only, before invoice generation)
  router.delete('/:assignmentId/settlement-items/:itemId', 
    auth, 
    checkRole('Waff Clerk'), 
    (req, res) => controller.deleteSettlementItem(req, res)
  );

  // Settle grouped assignments (settle all assignments in a group at once)
  // MUST be before /:id/settle to avoid Express matching 'group' as :id
  router.post('/group/:groupId/settle', 
    auth, 
    (req, res) => controller.settleGroup(req, res)
  );

  // Settle assignment (User who was assigned)
  router.post('/:id/settle', 
    auth, 
    (req, res) => controller.settle(req, res)
  );

  // Close assignment after invoice generation
  router.patch('/:id/close',
    auth,
    checkRole('Admin', 'Super Admin', 'Manager'),
    (req, res) => controller.closeAssignment(req, res)
  );

  // Recalculate/fix status for a settled assignment (Admin/Super Admin/Manager)
  router.patch('/:id/recalculate-status',
    auth,
    checkRole('Admin', 'Super Admin', 'Manager'),
    (req, res) => controller.recalculateStatus(req, res)
  );

  return router;
};
