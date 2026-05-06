/**
 * Other Expense Repository Interface
 * Defines the contract for other expense data operations
 */
class IOtherExpenseRepository {
  async create(expense) {
    throw new Error('Method not implemented');
  }

  async findById(expenseId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByDateRange(fromDate, toDate, category = null) {
    throw new Error('Method not implemented');
  }

  async update(expenseId, expense) {
    throw new Error('Method not implemented');
  }

  async delete(expenseId) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }

  async getCategories() {
    throw new Error('Method not implemented');
  }

  async getSummaryByCategory(fromDate, toDate) {
    throw new Error('Method not implemented');
  }
}

module.exports = IOtherExpenseRepository;
