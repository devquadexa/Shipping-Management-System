/**
 * Reject Cash Balance Settlement Use Case
 * Handles rejection of settlement requests by Management
 */
class RejectCashBalanceSettlement {
  constructor(cashBalanceSettlementRepository, pettyCashAssignmentRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(settlementId, managerId, managerName, managerNotes) {
    // Find the settlement
    const settlement = await this.cashBalanceSettlementRepository.findById(settlementId);
    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Reject the settlement using domain logic
    settlement.reject(managerId, managerName, managerNotes);

    // Update in database
    const rejectedSettlement = await this.cashBalanceSettlementRepository.update(settlementId, {
      status: settlement.status,
      managerId: settlement.managerId,
      managerName: settlement.managerName,
      managerNotes: settlement.managerNotes,
      updatedBy: settlement.updatedBy,
      updatedDate: settlement.updatedDate
    });

    // Revert related assignment statuses back to "Settled" so Waff Clerk can try again
    if (settlement.relatedAssignments && settlement.relatedAssignments.length > 0) {
      for (const assignmentId of settlement.relatedAssignments) {
        try {
          await this.pettyCashAssignmentRepository.updateStatus(assignmentId, 'Settled');
        } catch (error) {
          console.error(`Failed to update assignment ${assignmentId} status:`, error);
          // Don't throw - settlement was rejected successfully, just log the error
        }
      }
    }

    return rejectedSettlement;
  }
}

module.exports = RejectCashBalanceSettlement;