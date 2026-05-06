/**
 * Get Other Expenses Report Use Case
 */
class GetOtherExpensesReport {
  constructor(otherExpenseRepository) {
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(fromDate, toDate, category = null) {
    if (!fromDate || !toDate) {
      throw new Error('From date and to date are required');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const expenses = await this.otherExpenseRepository.findByDateRange(from, to, category);
    const summary = await this.otherExpenseRepository.getSummaryByCategory(from, to);

    return {
      expenses,
      summary,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalCount: expenses.length
    };
  }
}

module.exports = GetOtherExpensesReport;
