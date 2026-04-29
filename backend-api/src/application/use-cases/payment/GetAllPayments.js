/**
 * Get All Payments Use Case
 * Retrieves all payments with optional filters
 */
class GetAllPayments {
  constructor(paymentRepository, customerRepository, billRepository) {
    this.paymentRepository = paymentRepository;
    this.customerRepository = customerRepository;
    this.billRepository = billRepository;
  }

  async execute(filters = {}) {
    const payments = await this.paymentRepository.findAll(filters);
    
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        // Enrich customer name if missing
        if (!payment.customerName && payment.customerId) {
          try {
            const customer = await this.customerRepository.findById(payment.customerId);
            payment.customerName = customer?.name || '';
          } catch (error) {
            console.warn(`Could not fetch customer name for ${payment.customerId}:`, error.message);
          }
        }

        // Enrich invoiceNumber — use billId as fallback if invoiceNumber is null
        if (!payment.invoiceNumber && payment.billId) {
          try {
            const bill = await this.billRepository.findById(payment.billId);
            payment.invoiceNumber = bill?.invoiceNumber || bill?.billId || payment.billId;
          } catch (error) {
            payment.invoiceNumber = payment.billId;
          }
        }

        return payment;
      })
    );
    
    return enrichedPayments;
  }
}

module.exports = GetAllPayments;
