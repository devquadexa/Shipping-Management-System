/**
 * Cash Balance Settlement Routes
 * Defines API endpoints for cash balance settlement operations
 */
const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../middleware/auth');

module.exports = (container) => {
  const cashBalanceSettlementController = container.get('CashBalanceSettlementController');

  // Create a new settlement request (Waff Clerk only)
  router.post('/', 
    auth, 
    checkRole('Waff Clerk'), 
    (req, res) => cashBalanceSettlementController.createSettlement(req, res)
  );

  // Get settlements (role-based access)
  router.get('/', 
    auth, 
    (req, res) => cashBalanceSettlementController.getSettlements(req, res)
  );

  // Get pending settlements (Management only)
  router.get('/pending', 
    auth, 
    checkRole('Super Admin', 'Admin', 'Manager'), 
    (req, res) => cashBalanceSettlementController.getPendingSettlements(req, res)
  );

  // Get approved settlements (Management only)
  router.get('/approved', 
    auth, 
    checkRole('Super Admin', 'Admin', 'Manager'), 
    (req, res) => cashBalanceSettlementController.getApprovedSettlements(req, res)
  );

  // Get specific settlement by ID
  router.get('/:settlementId', 
    auth, 
    (req, res) => cashBalanceSettlementController.getSettlementById(req, res)
  );

  // Approve a settlement (Management only)
  router.put('/:settlementId/approve', 
    auth, 
    checkRole('Super Admin', 'Admin', 'Manager'), 
    (req, res) => cashBalanceSettlementController.approveSettlement(req, res)
  );

  // Complete a settlement (Management only)
  router.put('/:settlementId/complete', 
    auth, 
    checkRole('Super Admin', 'Admin', 'Manager'), 
    (req, res) => cashBalanceSettlementController.completeSettlement(req, res)
  );

  // Reject a settlement (Management only)
  router.put('/:settlementId/reject', 
    auth, 
    checkRole('Super Admin', 'Admin', 'Manager'), 
    (req, res) => cashBalanceSettlementController.rejectSettlement(req, res)
  );

  return router;
};