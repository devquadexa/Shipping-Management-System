/**
 * Cash Withdrawal Domain Entity
 */
class CashWithdrawal {
  constructor({
    withdrawalId,
    amount,
    bankName,
    withdrawalDate,
    notes,
    transactionType,
    createdBy,
    createdAt
  }) {
    this.withdrawalId = withdrawalId;
    this.amount = amount;
    this.bankName = bankName;
    this.withdrawalDate = withdrawalDate || new Date();
    this.notes = notes || '';
    this.transactionType = transactionType || 'withdrawal';
    this.createdBy = createdBy;
    this.createdAt = createdAt || new Date();
  }

  validate() {
    const errors = [];
    
    if (!this.amount || this.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    if (!this.bankName || this.bankName.trim() === '') {
      errors.push('Bank name is required');
    }
    if (!this.createdBy) {
      errors.push('Creator is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CashWithdrawal;
