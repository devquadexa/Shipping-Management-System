/**
 * Office Pay Item Entity
 * Represents payments made by office staff (Admin/Manager) at the beginning of jobs
 */
class OfficePayItem {
  constructor(data) {
    this.officePayItemId = data.officePayItemId;
    this.jobId = data.jobId;
    this.description = data.description;
    this.actualCost = parseFloat(data.actualCost) || 0;
    this.paidBy = data.paidBy;
    this.paidByName = data.paidByName; // User's full name
    this.paymentDate = data.paymentDate;
    this.createdDate = data.createdDate;
    this.updatedDate = data.updatedDate;
  }

  validate() {
    const errors = [];

    if (!this.officePayItemId) {
      errors.push('Office Pay Item ID is required');
    }

    if (!this.jobId) {
      errors.push('Job ID is required');
    }

    if (!this.description || this.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!this.actualCost || this.actualCost <= 0) {
      errors.push('Actual cost must be greater than 0');
    }

    if (!this.paidBy) {
      errors.push('Paid by user is required');
    }

    if (this.billingAmount !== null && this.billingAmount < 0) {
      errors.push('Billing amount cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      officePayItemId: this.officePayItemId,
      jobId: this.jobId,
      description: this.description,
      actualCost: this.actualCost,
      paidBy: this.paidBy,
      paidByName: this.paidByName,
      paymentDate: this.paymentDate,
      createdDate: this.createdDate,
      updatedDate: this.updatedDate
    };
  }
}

module.exports = OfficePayItem;