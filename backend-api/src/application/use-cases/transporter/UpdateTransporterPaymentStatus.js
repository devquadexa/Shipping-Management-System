/**
 * Update Transporter Payment Status Use Case
 * Updates the status of a transporter payment (Pending, Cleared, Bounced)
 */
class UpdateTransporterPaymentStatus {
  constructor(transporterPaymentRepository) {
    this.transporterPaymentRepository = transporterPaymentRepository;
  }

  async execute(paymentId, status) {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    const validStatuses = ['Pending', 'Cleared', 'Bounced'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const payment = await this.transporterPaymentRepository.updateStatus(paymentId, status);
    return payment;
  }
}

module.exports = UpdateTransporterPaymentStatus;
