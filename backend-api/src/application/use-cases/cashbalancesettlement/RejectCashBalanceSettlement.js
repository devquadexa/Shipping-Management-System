/**
 * Reject Cash Balance Settlement Use Case
 * Handles rejection of settlement requests by Management
 */
class RejectCashBalanceSettlement {
  constructor(cashBalanceSettlementRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
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
    return await this.cashBalanceSettlementRepository.update(settlementId, {
      status: settlement.status,
      managerId: settlement.managerId,
      managerName: settlement.managerName,
      managerNotes: settlement.managerNotes,
      updatedBy: settlement.updatedBy,
      updatedDate: settlement.updatedDate
    });
  }
}

module.exports = RejectCashBalanceSettlement;