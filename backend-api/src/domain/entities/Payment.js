/**
 * Payment Entity
 * Represents a payment record (cheque or bank transfer)
 */
class Payment {
  constructor({
    paymentId,
    jobId,
    customerId,
    customerName,
    invoiceNumber,
    billId,
    paymentMethod,
    paymentDate,
    amount,
    status = 'Pending',
    chequeNumber,
    chequeDate,
    chequeAmount,
    bankName,
    referenceNumber,
    clearedDate,
    bouncedDate,
    notes,
    createdBy,
    createdDate,
    updatedDate,
    cusdecNumber,
    cusdecDate
  }) {
    this.paymentId = paymentId;
    this.jobId = jobId;
    this.customerId = customerId;
    this.customerName = customerName;
    this.invoiceNumber = invoiceNumber;
    this.billId = billId;
    this.paymentMethod = paymentMethod;
    this.paymentDate = paymentDate || new Date();
    this.amount = amount; // Invoice amount
    this.status = status;
    this.chequeNumber = chequeNumber;
    this.chequeDate = chequeDate;
    this.chequeAmount = chequeAmount; // Total cheque amount
    this.bankName = bankName;
    this.referenceNumber = referenceNumber;
    this.clearedDate = clearedDate;
    this.bouncedDate = bouncedDate;
    this.notes = notes;
    this.createdBy = createdBy;
    this.createdDate = createdDate || new Date();
    this.updatedDate = updatedDate;
    this.cusdecNumber = cusdecNumber;
    this.cusdecDate = cusdecDate;
  }
}

module.exports = Payment;
