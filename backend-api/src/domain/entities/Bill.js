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
    advancePayment = 0.00, // New: Advance payment amount
    grossTotal = 0.00, // New: Total before advance deduction
    netTotal = 0.00, // New: Final amount after advance deduction
    paymentStatus = 'Unpaid',
    createdDate = new Date(),
    billDate = new Date(),
    paidDate = null,
    invoiceNumber = null,
    invoiceDate = null,
    dueDate = null,
    isOverdue = false,
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
    this.advancePayment = parseFloat(advancePayment) || 0.00;
    this.grossTotal = parseFloat(grossTotal) || 0.00;
    this.netTotal = parseFloat(netTotal) || 0.00;
    this.paymentStatus = paymentStatus;
    this.createdDate = createdDate;
    this.billDate = billDate;
    this.paidDate = paidDate;
    this.invoiceNumber = invoiceNumber;
    this.invoiceDate = invoiceDate;
    this.dueDate = dueDate;
    this.isOverdue = isOverdue;
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

  // Advance Payment Methods
  calculateTotalsWithAdvance(advancePayment = 0) {
    this.advancePayment = parseFloat(advancePayment) || 0.00;
    this.grossTotal = this.billingAmount; // Total before advance deduction
    this.netTotal = this.grossTotal - this.advancePayment; // Final amount after advance
    
    // Ensure net total is not negative
    if (this.netTotal < 0) {
      this.netTotal = 0;
    }
    
    // Update the main total field for backward compatibility
    this.total = this.netTotal;
  }

  setAdvancePayment(amount) {
    this.advancePayment = parseFloat(amount) || 0.00;
    this.calculateTotalsWithAdvance(this.advancePayment);
  }

  getFinancialSummary() {
    return {
      actualCost: this.actualCost,
      billingAmount: this.billingAmount,
      grossTotal: this.grossTotal,
      advancePayment: this.advancePayment,
      netTotal: this.netTotal,
      profit: this.profit,
      profitMargin: this.billingAmount > 0 ? ((this.profit / this.billingAmount) * 100).toFixed(2) : 0
    };
  }

  hasAdvancePayment() {
    return this.advancePayment > 0;
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
