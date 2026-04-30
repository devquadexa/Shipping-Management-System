/**
 * Mark Bill As Paid Use Case
 */
class MarkBillAsPaid {
  constructor(billRepository, paymentRepository, jobRepository, customerRepository) {
    this.billRepository = billRepository;
    this.paymentRepository = paymentRepository;
    this.jobRepository = jobRepository;
    this.customerRepository = customerRepository;
  }

  async execute(billId, paymentDetails = {}) {
    const bill = await this.billRepository.findById(billId);
    
    if (!bill) {
      throw new Error('Bill not found');
    }
    
    // Validate payment details based on payment method
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
    
    // Business logic
    bill.markAsPaid(paymentDetails);
    
    // Persist bill update
    const updatedBill = await this.billRepository.markAsPaid(billId, paymentDetails);
    
    // Update job status to "Payment Collected"
    if (this.jobRepository) {
      try {
        await this.jobRepository.updateStatus(bill.jobId, 'Payment Collected');
        console.log(`✓ Job ${bill.jobId} status updated to: Payment Collected`);
      } catch (err) {
        console.error('Error updating job status after full payment:', err);
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
        // Get customer name
        let customerName = '';
        try {
          const customer = await this.customerRepository.findById(bill.customerId);
          customerName = customer?.name || '';
        } catch (error) {
          console.warn('Could not fetch customer name:', error.message);
        }
        
        // Generate payment ID
        const paymentId = await this.paymentRepository.generateNextId();
        
        // Create payment record
        const Payment = require('../../../domain/entities/Payment');
        const payment = new Payment({
          paymentId,
          jobId: bill.jobId,
          customerId: bill.customerId,
          customerName: customerName,
          invoiceNumber: bill.invoiceNumber || bill.billId,
          billId: bill.billId,
          paymentMethod: paymentDetails.paymentMethod,
          paymentDate: paymentDetails.paidDate ? new Date(paymentDetails.paidDate) : new Date(),
          amount: bill.netTotal || bill.total || bill.billingAmount, // Invoice amount
          status: paymentDetails.paymentMethod === 'Cash' ? 'Cleared' : 'Pending',
          chequeNumber: paymentDetails.chequeNumber || null,
          chequeDate: paymentDetails.chequeDate || null,
          chequeAmount: paymentDetails.chequeAmount || null,
          bankName: paymentDetails.bankName || null,
          referenceNumber: paymentDetails.referenceNumber || null,
          notes: `Payment for invoice ${bill.invoiceNumber}`,
          createdBy: paymentDetails.createdBy
        });
        
        await this.paymentRepository.create(payment);
        console.log(`✓ Payment record created: ${paymentId} for bill ${billId}`);
      } catch (error) {
        console.error('Error creating payment record:', error);
        // Don't fail the bill update if payment record creation fails
        // The bill is already marked as paid
      }
    }
    
    return updatedBill;
  }
}

module.exports = MarkBillAsPaid;
