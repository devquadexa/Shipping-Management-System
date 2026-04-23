/**
 * Update Payment Status Use Case
 * Updates the status of a payment (Pending -> Cleared/Bounced)
 */
class UpdatePaymentStatus {
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
  }

  async execute(paymentId, status) {
    // Validate status
    const validStatuses = ['Pending', 'Cleared', 'Bounced'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Check if payment exists
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    // Update status
    return await this.paymentRepository.updateStatus(paymentId, status, new Date());
  }
}

module.exports = UpdatePaymentStatus;
