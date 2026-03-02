/**
 * PettyCash Repository Interface
 */
class IPettyCashRepository {
  async createEntry(entry) {
    throw new Error('Method not implemented');
  }

  async findById(entryId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByJob(jobId) {
    throw new Error('Method not implemented');
  }

  async findByUser(userId) {
    throw new Error('Method not implemented');
  }

  async getBalance() {
    throw new Error('Method not implemented');
  }

  async updateBalance(amount) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = IPettyCashRepository;
