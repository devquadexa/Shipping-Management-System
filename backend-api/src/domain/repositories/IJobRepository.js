/**
 * Job Repository Interface
 */
class IJobRepository {
  async create(job) {
    throw new Error('Method not implemented');
  }

  async findById(jobId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByAssignedUser(userId) {
    throw new Error('Method not implemented');
  }

  async findByCustomer(customerId) {
    throw new Error('Method not implemented');
  }

  async update(jobId, job) {
    throw new Error('Method not implemented');
  }

  async updateStatus(jobId, status) {
    throw new Error('Method not implemented');
  }

  async assignToUser(jobId, userId) {
    throw new Error('Method not implemented');
  }

  async delete(jobId) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = IJobRepository;
