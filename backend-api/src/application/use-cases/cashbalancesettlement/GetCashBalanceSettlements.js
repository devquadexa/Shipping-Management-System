/**
 * Get Cash Balance Settlements Use Case
 * Retrieves settlements based on user role and filters
 */
class GetCashBalanceSettlements {
  constructor(cashBalanceSettlementRepository) {
    this.cashBalanceSettlementRepository = cashBalanceSettlementRepository;
  }

  async execute(userRole, userId, filters = {}) {
    let settlements = [];

    if (userRole === 'Waff Clerk') {
      // Waff Clerks can only see their own settlements
      settlements = await this.cashBalanceSettlementRepository.findByUser(userId);
    } else if (['Super Admin', 'Admin', 'Manager'].includes(userRole)) {
      // Management can see all settlements or filter by specific criteria
      if (filters.userId) {
        settlements = await this.cashBalanceSettlementRepository.findByUser(filters.userId);
      } else if (filters.managerId) {
        settlements = await this.cashBalanceSettlementRepository.findByManager(filters.managerId);
      } else {
        settlements = await this.cashBalanceSettlementRepository.findAll(filters);
      }
    } else {
      throw new Error('Unauthorized access to settlements');
    }

    return settlements.map(settlement => settlement.toJSON());
  }
}

module.exports = GetCashBalanceSettlements;