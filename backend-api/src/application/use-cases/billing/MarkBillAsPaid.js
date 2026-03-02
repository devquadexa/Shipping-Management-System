/**
 * Mark Bill As Paid Use Case
 */
class MarkBillAsPaid {
  constructor(billRepository) {
    this.billRepository = billRepository;
  }

  async execute(billId) {
    const bill = await this.billRepository.findById(billId);
    
    if (!bill) {
      throw new Error('Bill not found');
    }
    
    // Business logic
    bill.markAsPaid();
    
    // Persist
    return await this.billRepository.markAsPaid(billId);
  }
}

module.exports = MarkBillAsPaid;
