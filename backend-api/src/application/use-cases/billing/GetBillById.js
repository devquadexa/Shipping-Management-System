/**
 * Get Bill By ID Use Case
 */
class GetBillById {
  constructor(billRepository) {
    this.billRepository = billRepository;
  }

  async execute(billId) {
    const bill = await this.billRepository.findById(billId);
    
    if (!bill) {
      throw new Error('Bill not found');
    }
    
    return bill;
  }
}

module.exports = GetBillById;
