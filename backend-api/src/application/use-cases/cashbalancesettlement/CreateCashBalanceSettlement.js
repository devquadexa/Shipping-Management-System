/**
 * Create Cash Balance Settlement Use Case
 * Handles creation of settlement requests by Waff Clerks
 */
const CashBalanceSettlement = require('../../../domain/entities/CashBalanceSettlement');

class CreateCashBalanceSettlement {
  constructor(cashBalanceSettlementRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
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
    return await this.cashBalanceSettlementRepository.create(settlement);
  }
}

module.exports = CreateCashBalanceSettlement;