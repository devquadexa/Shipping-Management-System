/**
 * Get All Cash Withdrawals Use Case
 */
class GetAllCashWithdrawals {
  constructor(cashWithdrawalRepository) {
    this.cashWithdrawalRepository = cashWithdrawalRepository;
  }

  async execute() {
    return await this.cashWithdrawalRepository.findAll();
  }
}

module.exports = GetAllCashWithdrawals;
