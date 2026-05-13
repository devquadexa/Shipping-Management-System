/**
 * Password Reset Repository Interface
 */
class IPasswordResetRepository {
  async create(passwordResetRequest) {
    throw new Error('Method not implemented');
  }

  async findById(requestId) {
    throw new Error('Method not implemented');
  }

  async findByUserId(userId) {
    throw new Error('Method not implemented');
  }

  async findPendingRequests() {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async updateStatus(requestId, status, resolvedBy, notes = null) {
    throw new Error('Method not implemented');
  }

  async delete(requestId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IPasswordResetRepository;
