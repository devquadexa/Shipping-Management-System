/**
 * Get All Other Expenses Use Case
 */
class GetAllOtherExpenses {
  constructor(otherExpenseRepository) {
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(filters = {}) {
    return await this.otherExpenseRepository.findAll(filters);
  }
}

module.exports = GetAllOtherExpenses;
