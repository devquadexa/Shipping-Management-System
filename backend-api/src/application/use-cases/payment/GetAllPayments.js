/**
 * Get All Payments Use Case
 * Retrieves all payments with optional filters
 */
class GetAllPayments {
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
  }

  async execute(filters = {}) {
    return await this.paymentRepository.findAll(filters);
  }
}

module.exports = GetAllPayments;
