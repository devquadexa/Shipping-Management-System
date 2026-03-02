/**
 * Get All Petty Cash Entries Use Case
 */
class GetAllPettyCashEntries {
  constructor(pettyCashRepository) {
    this.pettyCashRepository = pettyCashRepository;
  }

  async execute(filters = {}) {
    const entries = await this.pettyCashRepository.findAll(filters);
    const balance = await this.pettyCashRepository.getBalance();
    
    return { entries, balance };
  }
}

module.exports = GetAllPettyCashEntries;
