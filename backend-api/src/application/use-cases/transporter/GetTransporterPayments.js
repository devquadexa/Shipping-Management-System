/**
 * Get Transporter Payments Use Case
 * Retrieves payment history for a transporter
 */
class GetTransporterPayments {
  constructor(transporterPaymentRepository) {
    this.transporterPaymentRepository = transporterPaymentRepository;
  }

  async execute(transporterId, filters = {}) {
    if (!transporterId) {
      throw new Error('Transporter ID is required');
    }

    const payments = await this.transporterPaymentRepository.findByTransporterId(transporterId, filters);
    return payments;
  }
}

module.exports = GetTransporterPayments;
