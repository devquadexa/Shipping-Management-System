/**
 * Approve Cash Balance Settlement Use Case
 * Handles approval of settlement requests by Management
 */
class ApproveCashBalanceSettlement {
  constructor(cashBalanceSettlementRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
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
    return await this.cashBalanceSettlementRepository.update(settlementId, {
      status: settlement.status,
      managerId: settlement.managerId,
      managerName: settlement.managerName,
      managerNotes: settlement.managerNotes,
      approvedDate: settlement.approvedDate,
      updatedBy: settlement.updatedBy,
      updatedDate: settlement.updatedDate
    });
  }
}

module.exports = ApproveCashBalanceSettlement;