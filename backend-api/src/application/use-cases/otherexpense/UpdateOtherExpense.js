/**
 * Update Other Expense Use Case
 */
class UpdateOtherExpense {
  constructor(otherExpenseRepository) {
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(expenseId, expenseData) {
    const existing = await this.otherExpenseRepository.findById(expenseId);
    if (!existing) {
      throw new Error('Expense not found');
    }

    const updatedExpense = {
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      expenseDate: expenseData.expenseDate,
      paymentMethod: expenseData.paymentMethod || null,
      referenceNumber: expenseData.referenceNumber || null,
      notes: expenseData.notes || null,
      attachmentUrl: expenseData.attachmentUrl || null
    };

    return await this.otherExpenseRepository.update(expenseId, updatedExpense);
  }
}

module.exports = UpdateOtherExpense;
