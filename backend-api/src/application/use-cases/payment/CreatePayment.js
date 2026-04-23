/**
 * Create Payment Use Case
 * Creates a new payment record
 */
const Payment = require('../../../domain/entities/Payment');

class CreatePayment {
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
  }

  async execute(paymentData) {
    // Generate payment ID
    const paymentId = await this.paymentRepository.generateNextId();
    
    // Create payment entity
    const payment = new Payment({
      paymentId,
      ...paymentData,
      status: 'Pending' // Default status
    });
    
    // Save to repository
    return await this.paymentRepository.create(payment);
  }
}

module.exports = CreatePayment;
