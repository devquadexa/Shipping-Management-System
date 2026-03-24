class OldInvoice {
  constructor(data) {
    this.oldInvoiceId = data.oldInvoiceId;
    this.customerId = data.customerId;
    this.customerName = data.customerName;
    this.cusdecNumber = data.cusdecNumber;
    this.cusdecDate = data.cusdecDate;
    this.invoiceDate = data.invoiceDate;
    this.invoiceNumber = data.invoiceNumber;
    this.totalAmount = parseFloat(data.totalAmount) || 0;
    this.amountReceived = parseFloat(data.amountReceived) || 0;
    this.balance = parseFloat(data.balance) || 0;
    this.status = data.status || 'Pending';
    this.settleDate = data.settleDate;
    this.daysAfterInvoice = data.daysAfterInvoice;
    this.createdAt = data.createdAt;
    this.createdBy = data.createdBy;
    this.updatedAt = data.updatedAt;
    this.payments = data.payments || [];
  }
}

module.exports = OldInvoice;
