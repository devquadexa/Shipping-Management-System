/**
 * Bill Domain Entity
 * Represents an invoice/bill
 */
class Bill {
  constructor({
    billId,
    jobId,
    customerId,
    amount,
    tax = 0,
    total = 0,
    actualCost = 0,
    billingAmount = 0,
    profit = 0,
    paymentStatus = 'Unpaid',
    createdDate = new Date(),
    billDate = new Date(),
    paidDate = null,
    invoiceNumber = null,
    items = [],
    metadata = {}
  }) {
    this.billId = billId;
    this.jobId = jobId;
    this.customerId = customerId;
    this.amount = amount;
    this.tax = tax;
    this.total = total;
    this.actualCost = actualCost;
    this.billingAmount = billingAmount;
    this.profit = profit;
    this.paymentStatus = paymentStatus;
    this.createdDate = createdDate;
    this.billDate = billDate;
    this.paidDate = paidDate;
    this.invoiceNumber = invoiceNumber;
    this.items = items;
    this.metadata = metadata;
  }

  validate() {
    const errors = [];
    
    if (!this.jobId) errors.push('Job ID is required');
    if (!this.customerId) errors.push('Customer ID is required');
    if (this.billingAmount < 0) errors.push('Valid billing amount is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  calculateTax(taxRate = 0) {
    // Tax calculation removed - total is same as billing amount
    this.tax = 0;
    this.total = this.billingAmount;
  }

  calculateProfit() {
    this.profit = this.billingAmount - this.actualCost;
  }

  markAsPaid() {
    if (this.paymentStatus === 'Paid') {
      throw new Error('Bill is already paid');
    }
    this.paymentStatus = 'Paid';
    this.paidDate = new Date();
  }

  markAsUnpaid() {
    this.paymentStatus = 'Unpaid';
    this.paidDate = null;
  }

  isPaid() {
    return this.paymentStatus === 'Paid';
  }

  addItem(description, amount) {
    this.items.push({ description, amount });
  }
}

module.exports = Bill;
