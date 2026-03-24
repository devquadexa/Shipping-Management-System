/**
 * Mark Bill As Paid Use Case
 */
class MarkBillAsPaid {
  constructor(billRepository) {
    this.billRepository = billRepository;
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
    
    // Persist
    return await this.billRepository.markAsPaid(billId, paymentDetails);
  }
}

module.exports = MarkBillAsPaid;
