/**
 * Delete Other Expense Use Case
 */
class DeleteOtherExpense {
  constructor(otherExpenseRepository) {
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(expenseId) {
    const existing = await this.otherExpenseRepository.findById(expenseId);
    if (!existing) {
      throw new Error('Expense not found');
    }

    return await this.otherExpenseRepository.delete(expenseId);
  }
}

module.exports = DeleteOtherExpense;
