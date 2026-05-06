/**
 * Other Expense Domain Entity
 * Represents office expenses like food, utility bills, wifi, phone cards, etc.
 */
class OtherExpense {
  constructor({
    expenseId,
    category,
    description,
    amount,
    expenseDate,
    paymentMethod = null,
    referenceNumber = null,
    notes = null,
    recordedBy,
    recordedByName = null,
    createdDate = new Date(),
    attachmentUrl = null
  }) {
    this.expenseId = expenseId;
    this.category = category;
    this.description = description;
    this.amount = parseFloat(amount) || 0;
    this.expenseDate = expenseDate;
    this.paymentMethod = paymentMethod;
    this.referenceNumber = referenceNumber;
    this.notes = notes;
    this.recordedBy = recordedBy;
    this.recordedByName = recordedByName;
    this.createdDate = createdDate;
    this.attachmentUrl = attachmentUrl;
  }

  // Business logic
  validate() {
    const errors = [];
    
    if (!this.category) errors.push('Category is required');
    if (!this.description) errors.push('Description is required');
    if (!this.amount || this.amount <= 0) errors.push('Amount must be greater than 0');
    if (!this.expenseDate) errors.push('Expense date is required');
    if (!this.recordedBy) errors.push('Recorded by user is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Serialize to JSON for API responses
  toJSON() {
    return {
      expenseId: this.expenseId,
      category: this.category,
      description: this.description,
      amount: this.amount,
      expenseDate: this.expenseDate,
      paymentMethod: this.paymentMethod,
      referenceNumber: this.referenceNumber,
      notes: this.notes,
      recordedBy: this.recordedBy,
      recordedByName: this.recordedByName,
      createdDate: this.createdDate,
      attachmentUrl: this.attachmentUrl
    };
  }
}

module.exports = OtherExpense;
