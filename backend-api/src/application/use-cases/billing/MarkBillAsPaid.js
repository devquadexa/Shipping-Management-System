/**
 * Mark Bill As Paid Use Case
 */
class MarkBillAsPaid {
  constructor(billRepository, paymentRepository, jobRepository) {
    this.billRepository = billRepository;
    this.paymentRepository = paymentRepository;
    this.jobRepository = jobRepository;
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
    
    // Create payment record if payment method is Cheque or Bank Transfer
    if (paymentDetails.paymentMethod === 'Cheque' || paymentDetails.paymentMethod === 'Bank Transfer') {
      try {
        // Get job details for customer info
        const job = await this.jobRepository.findById(bill.jobId);
        
        // Generate payment ID
        const paymentId = await this.paymentRepository.generateNextId();
        
        // Create payment record
        const Payment = require('../../../domain/entities/Payment');
        const payment = new Payment({
          paymentId,
          jobId: bill.jobId,
          customerId: bill.customerId,
          customerName: job?.customerName || '',
          invoiceNumber: bill.invoiceNumber,
          billId: bill.billId,
          paymentMethod: paymentDetails.paymentMethod,
          paymentDate: new Date(),
          amount: paymentDetails.paymentMethod === 'Cheque' 
            ? paymentDetails.chequeAmount 
            : (bill.netTotal || bill.total),
          status: 'Pending', // Default to Pending, can be updated later
          chequeNumber: paymentDetails.chequeNumber,
          chequeDate: paymentDetails.chequeDate,
          bankName: paymentDetails.bankName,
          referenceNumber: paymentDetails.referenceNumber,
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
