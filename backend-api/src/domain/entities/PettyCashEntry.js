/**
 * PettyCash Entry Domain Entity
 */
class PettyCashEntry {
  constructor({
    entryId,
    description,
    amount,
    entryType, // 'Income' or 'Expense'
    jobId = null,
    createdBy,
    date = new Date(),
    balanceAfter = 0,
    metadata = {}
  }) {
    this.entryId = entryId;
    this.description = description;
    this.amount = amount;
    this.entryType = entryType;
    this.jobId = jobId;
    this.createdBy = createdBy;
    this.date = date;
    this.balanceAfter = balanceAfter;
    this.metadata = metadata;
  }

  validate() {
    const errors = [];
    
    if (!this.description) errors.push('Description is required');
    if (!this.amount || this.amount <= 0) errors.push('Valid amount is required');
    if (!['Income', 'Expense'].includes(this.entryType)) {
      errors.push('Entry type must be Income or Expense');
    }
    if (!this.createdBy) errors.push('Creator is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isIncome() {
    return this.entryType === 'Income';
  }

  isExpense() {
    return this.entryType === 'Expense';
  }

  getImpactOnBalance() {
    return this.isIncome() ? this.amount : -this.amount;
  }
}

module.exports = PettyCashEntry;
