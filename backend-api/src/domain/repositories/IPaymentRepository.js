/**
 * Payment Repository Interface
 * Defines the contract for payment data operations
 */
class IPaymentRepository {
  async create(payment) {
    throw new Error('Method not implemented');
  }

  async findById(paymentId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByJob(jobId) {
    throw new Error('Method not implemented');
  }

  async findByCustomer(customerId) {
    throw new Error('Method not implemented');
  }

  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  async findByPaymentMethod(paymentMethod) {
    throw new Error('Method not implemented');
  }

  async updateStatus(paymentId, status, statusDate) {
    throw new Error('Method not implemented');
  }

  async update(paymentId, payment) {
    throw new Error('Method not implemented');
  }

  async delete(paymentId) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = IPaymentRepository;
