/**
 * Complete Cash Balance Settlement Use Case
 * Handles completion of approved settlements by Management
 */
class CompleteCashBalanceSettlement {
  constructor(cashBalanceSettlementRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
  }

  async execute(settlementId, managerId, managerNotes = null) {
    // Find the settlement
    const settlement = await this.cashBalanceSettlementRepository.findById(settlementId);
    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Complete the settlement using domain logic
    settlement.complete(managerId, managerNotes);

    // Update in database
    return await this.cashBalanceSettlementRepository.update(settlementId, {
      status: settlement.status,
      managerNotes: settlement.managerNotes,
      completedDate: settlement.completedDate,
      updatedBy: settlement.updatedBy,
      updatedDate: settlement.updatedDate
    });
  }
}

module.exports = CompleteCashBalanceSettlement;