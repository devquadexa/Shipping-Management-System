/**
 * Approve Cash Balance Settlement Use Case
 * Handles approval of settlement requests by Management
 */
class ApproveCashBalanceSettlement {
  constructor(cashBalanceSettlementRepository, pettyCashAssignmentRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(settlementId, managerId, managerName, managerNotes = null) {
    // Find the settlement
    const settlement = await this.cashBalanceSettlementRepository.findById(settlementId);
    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Approve the settlement using domain logic
    settlement.approve(managerId, managerName, managerNotes);

    // Update in database
    const approvedSettlement = await this.cashBalanceSettlementRepository.update(settlementId, {
      status: settlement.status,
      managerId: settlement.managerId,
      managerName: settlement.managerName,
      managerNotes: settlement.managerNotes,
      approvedDate: settlement.approvedDate,
      updatedBy: settlement.updatedBy,
      updatedDate: settlement.updatedDate
    });

    // Update related assignment statuses based on settlement type
    // BALANCE_RETURN → "Balance Returned" (clerk returned excess cash to management)
    // OVERDUE_COLLECTION → "Overdue Collected" (management paid the overdue to clerk)
    if (settlement.relatedAssignments && settlement.relatedAssignments.length > 0) {
      const finalStatus = settlement.settlementType === 'BALANCE_RETURN'
        ? 'Balance Returned'
        : 'Overdue Collected';

      for (const assignmentId of settlement.relatedAssignments) {
        try {
          await this.pettyCashAssignmentRepository.updateStatus(assignmentId, finalStatus);
        } catch (error) {
          console.error(`Failed to update assignment ${assignmentId} status:`, error);
        }
      }
    }

    return approvedSettlement;
  }
}

module.exports = ApproveCashBalanceSettlement;