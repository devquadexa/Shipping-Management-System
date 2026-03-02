/**
 * Get Petty Cash Balance Use Case
 */
class GetPettyCashBalance {
  constructor(pettyCashRepository) {
    this.pettyCashRepository = pettyCashRepository;
  }

  async execute() {
    return await this.pettyCashRepository.getBalance();
  }
}

module.exports = GetPettyCashBalance;
