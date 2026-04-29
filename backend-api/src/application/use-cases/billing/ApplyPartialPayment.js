/**
 * Apply Partial Payment Use Case
 * Records a partial payment against an invoice.
 * Supports multiple partial payments until fully paid.
 */
class ApplyPartialPayment {
  constructor(billRepository, paymentRepository, customerRepository, jobRepository) {
    this.billRepository = billRepository;
    this.paymentRepository = paymentRepository;
    this.customerRepository = customerRepository;
    this.jobRepository = jobRepository;
  }

  async execute(billId, paymentAmount, paymentDetails = {}) {
    const bill = await this.billRepository.findById(billId);
    if (!bill) throw new Error('Bill not found');

    if (bill.paymentStatus === 'Paid') {
      throw new Error('Invoice is already fully paid');
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const invoiceTotal = parseFloat(bill.netTotal || bill.total || 0);
    const currentPaid = parseFloat(bill.paidAmount) || 0;
    const remaining = invoiceTotal - currentPaid;

    if (amount > remaining + 0.01) { // 0.01 tolerance for floating point
      throw new Error(`Payment amount (LKR ${amount.toFixed(2)}) exceeds remaining balance (LKR ${remaining.toFixed(2)})`);
    }

    // Validate payment method details
    if (paymentDetails.paymentMethod === 'Cheque') {
      if (!paymentDetails.chequeNumber || !paymentDetails.chequeDate || !paymentDetails.chequeAmount) {
        throw new Error('Cheque number, date, and amount are required for cheque payments');
      }
    }
    if (paymentDetails.paymentMethod === 'Bank Transfer') {
      if (!paymentDetails.bankName) {
        throw new Error('Bank name is required for bank transfer payments');
      }
    }

    // Apply partial payment to bill
    const updatedBill = await this.billRepository.applyPartialPayment(billId, amount, paymentDetails);

    // Update job status to "Partially Paid" if not fully paid, or "Payment Collected" if fully paid
    if (this.jobRepository) {
      try {
        const newJobStatus = updatedBill.paymentStatus === 'Paid' ? 'Payment Collected' : 'Partially Paid';
        await this.jobRepository.updateStatus(bill.jobId, newJobStatus);
        console.log(`✓ Job ${bill.jobId} status updated to: ${newJobStatus}`);
      } catch (err) {
        console.error('Error updating job status after partial payment:', err);
        // Non-fatal - payment is already recorded
      }
    }

    // Create payment record for Cheque, Bank Transfer, AND Cash
    if (
      paymentDetails.paymentMethod === 'Cheque' ||
      paymentDetails.paymentMethod === 'Bank Transfer' ||
      paymentDetails.paymentMethod === 'Cash'
    ) {
      try {
        let customerName = '';
        try {
          const customer = await this.customerRepository.findById(bill.customerId);
          customerName = customer?.name || '';
        } catch {}

        const paymentId = await this.paymentRepository.generateNextId();
        const Payment = require('../../../domain/entities/Payment');
        const payment = new Payment({
          paymentId,
          jobId: bill.jobId,
          customerId: bill.customerId,
          customerName,
          invoiceNumber: bill.invoiceNumber || bill.billId,
          billId: bill.billId,
          paymentMethod: paymentDetails.paymentMethod,
          paymentDate: paymentDetails.paidDate ? new Date(paymentDetails.paidDate) : new Date(),
          amount,                                    // This payment's amount
          status: paymentDetails.paymentMethod === 'Cash' ? 'Cleared' : 'Pending',
          chequeNumber: paymentDetails.chequeNumber || null,
          chequeDate: paymentDetails.chequeDate || null,
          chequeAmount: paymentDetails.chequeAmount || null,
          bankName: paymentDetails.bankName || null,
          notes: `Partial payment for invoice ${bill.invoiceNumber || bill.billId}`,
          createdBy: paymentDetails.createdBy
        });
        await this.paymentRepository.create(payment);
      } catch (err) {
        console.error('Error creating payment record for partial payment:', err);
      }
    }

    return updatedBill;
  }
}

module.exports = ApplyPartialPayment;
