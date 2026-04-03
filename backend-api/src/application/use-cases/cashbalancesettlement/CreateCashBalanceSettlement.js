/**
 * Create Cash Balance Settlement Use Case
 * Handles creation of settlement requests by Waff Clerks
 */
const CashBalanceSettlement = require('../../../domain/entities/CashBalanceSettlement');

class CreateCashBalanceSettlement {
  constructor(cashBalanceSettlementRepository, pettyCashAssignmentRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute({
    userId,
    userName,
    settlementType, // 'BALANCE_RETURN' or 'OVERDUE_COLLECTION'
    amount,
    notes,
    relatedAssignments = [],
    createdBy
  }) {
    // Generate settlement ID
    const settlementId = await this.cashBalanceSettlementRepository.generateNextId();

    // Create settlement entity
    const settlement = new CashBalanceSettlement({
      settlementId,
      userId,
      userName,
      settlementType,
      amount,
      notes,
      relatedAssignments,
      createdBy,
      status: 'PENDING'
    });

    // Validate settlement
    const validation = settlement.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Save to database
    const createdSettlement = await this.cashBalanceSettlementRepository.create(settlement);

    // Update related assignment statuses to appropriate "Pending Approval" status
    if (relatedAssignments && relatedAssignments.length > 0) {
      // Determine the pending status based on settlement type
      const pendingStatus = settlementType === 'BALANCE_RETURN' 
        ? 'Pending Approval / Balance' 
        : 'Pending Approval / Over Due';
      
      for (const assignmentId of relatedAssignments) {
        try {
          await this.pettyCashAssignmentRepository.updateStatus(assignmentId, pendingStatus);
        } catch (error) {
          console.error(`Failed to update assignment ${assignmentId} status:`, error);
          // Don't throw - settlement was created successfully, just log the error
        }
      }
    }

    return createdSettlement;
  }
}

module.exports = CreateCashBalanceSettlement;