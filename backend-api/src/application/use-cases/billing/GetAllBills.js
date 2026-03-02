/**
 * Get All Bills Use Case
 */
class GetAllBills {
  constructor(billRepository) {
    this.billRepository = billRepository;
  }

  async execute(filters = {}) {
    return await this.billRepository.findAll(filters);
  }
}

module.exports = GetAllBills;
