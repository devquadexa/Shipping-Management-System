/**
 * Cash Balance Settlement Controller
 * Handles HTTP requests for cash balance settlement operations
 */
class CashBalanceSettlementController {
  constructor(container) {
    this.container = container;
  }

  async createSettlement(req, res) {
    try {
      const {
        settlementType,
        amount,
        notes,
        relatedAssignments
      } = req.body;

      const { userId, fullName, username } = req.user;
      const userName = fullName || username || 'Unknown User';

      const createSettlementUseCase = this.container.get('CreateCashBalanceSettlement');
      
      const settlement = await createSettlementUseCase.execute({
        userId,
        userName: userName, // Use the fallback userName
        settlementType,
        amount: parseFloat(amount),
        notes,
        relatedAssignments: relatedAssignments || [],
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Settlement request created successfully',
        data: settlement.toJSON()
      });
    } catch (error) {
      console.error('Error creating settlement:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSettlements(req, res) {
    try {
      const { role: userRole, userId } = req.user;
      const filters = req.query;

      const getSettlementsUseCase = this.container.get('GetCashBalanceSettlements');
      
      const settlements = await getSettlementsUseCase.execute(userRole, userId, filters);

      res.json({
        success: true,
        data: settlements
      });
    } catch (error) {
      console.error('Error fetching settlements:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSettlementById(req, res) {
    try {
      const { settlementId } = req.params;
      const { role: userRole, userId } = req.user;

      const cashBalanceSettlementRepository = this.container.get('CashBalanceSettlementRepository');
      const settlement = await cashBalanceSettlementRepository.findById(settlementId);

      if (!settlement) {
        return res.status(404).json({
          success: false,
          message: 'Settlement not found'
        });
      }

      // Check authorization
      if (userRole === 'Waff Clerk' && settlement.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to settlement'
        });
      }

      res.json({
        success: true,
        data: settlement.toJSON()
      });
    } catch (error) {
      console.error('Error fetching settlement:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async approveSettlement(req, res) {
    try {
      const { settlementId } = req.params;
      const { managerNotes } = req.body;
      const { userId: managerId, fullName: managerName, role } = req.user;

      // Check if user has management role
      if (!['Super Admin', 'Admin', 'Manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only management can approve settlements'
        });
      }

      const approveSettlementUseCase = this.container.get('ApproveCashBalanceSettlement');
      
      const settlement = await approveSettlementUseCase.execute(
        settlementId,
        managerId,
        managerName || req.user.username || 'Unknown Manager',
        managerNotes
      );

      res.json({
        success: true,
        message: 'Settlement approved successfully',
        data: settlement.toJSON()
      });
    } catch (error) {
      console.error('Error approving settlement:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async completeSettlement(req, res) {
    try {
      const { settlementId } = req.params;
      const { managerNotes } = req.body;
      const { userId: managerId, role } = req.user;

      // Check if user has management role
      if (!['Super Admin', 'Admin', 'Manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only management can complete settlements'
        });
      }

      const completeSettlementUseCase = this.container.get('CompleteCashBalanceSettlement');
      
      const settlement = await completeSettlementUseCase.execute(
        settlementId,
        managerId,
        managerNotes
      );

      res.json({
        success: true,
        message: 'Settlement completed successfully',
        data: settlement.toJSON()
      });
    } catch (error) {
      console.error('Error completing settlement:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async rejectSettlement(req, res) {
    try {
      const { settlementId } = req.params;
      const { managerNotes } = req.body;
      const { userId: managerId, fullName: managerName, role } = req.user;

      // Check if user has management role
      if (!['Super Admin', 'Admin', 'Manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only management can reject settlements'
        });
      }

      if (!managerNotes) {
        return res.status(400).json({
          success: false,
          message: 'Manager notes are required when rejecting a settlement'
        });
      }

      const rejectSettlementUseCase = this.container.get('RejectCashBalanceSettlement');
      
      const settlement = await rejectSettlementUseCase.execute(
        settlementId,
        managerId,
        managerName || req.user.username || 'Unknown Manager',
        managerNotes
      );

      res.json({
        success: true,
        message: 'Settlement rejected successfully',
        data: settlement.toJSON()
      });
    } catch (error) {
      console.error('Error rejecting settlement:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPendingSettlements(req, res) {
    try {
      const { role } = req.user;

      // Check if user has management role
      if (!['Super Admin', 'Admin', 'Manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only management can view pending settlements'
        });
      }

      const cashBalanceSettlementRepository = this.container.get('CashBalanceSettlementRepository');
      const settlements = await cashBalanceSettlementRepository.findPendingSettlements();

      res.json({
        success: true,
        data: settlements.map(settlement => settlement.toJSON())
      });
    } catch (error) {
      console.error('Error fetching pending settlements:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getApprovedSettlements(req, res) {
    try {
      const { role } = req.user;

      // Check if user has management role
      if (!['Super Admin', 'Admin', 'Manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only management can view approved settlements'
        });
      }

      const cashBalanceSettlementRepository = this.container.get('CashBalanceSettlementRepository');
      const settlements = await cashBalanceSettlementRepository.findApprovedSettlements();

      res.json({
        success: true,
        data: settlements.map(settlement => settlement.toJSON())
      });
    } catch (error) {
      console.error('Error fetching approved settlements:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRejectedSettlements(req, res) {
    try {
      const { role } = req.user;

      // Check if user has management role
      if (!['Super Admin', 'Admin', 'Manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only management can view rejected settlements'
        });
      }

      const cashBalanceSettlementRepository = this.container.get('CashBalanceSettlementRepository');
      const settlements = await cashBalanceSettlementRepository.findRejectedSettlements();

      res.json({
        success: true,
        data: settlements.map(settlement => settlement.toJSON())
      });
    } catch (error) {
      console.error('Error fetching rejected settlements:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = CashBalanceSettlementController;