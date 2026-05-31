/**
 * Cash Withdrawal Repository Interface
 */
class ICashWithdrawalRepository {
  async create(withdrawal) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async findById(withdrawalId) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = ICashWithdrawalRepository;
