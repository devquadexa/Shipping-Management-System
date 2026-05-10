/**
 * Create Other Expense Use Case
 */
const OtherExpense = require('../../../domain/entities/OtherExpense');

class CreateOtherExpense {
  constructor(otherExpenseRepository) {
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(expenseData, userId) {
    const expenseId = await this.otherExpenseRepository.generateNextId();
    
    const expense = new OtherExpense({
      expenseId,
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      expenseDate: expenseData.expenseDate,
      paymentMethod: expenseData.paymentMethod || null,
      referenceNumber: expenseData.referenceNumber || null,
      notes: expenseData.notes || null,
      recordedBy: userId,
      createdDate: new Date(),
      attachmentUrl: expenseData.attachmentUrl || null
    });

    const validation = expense.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.otherExpenseRepository.create(expense);
  }
}

module.exports = CreateOtherExpense;
