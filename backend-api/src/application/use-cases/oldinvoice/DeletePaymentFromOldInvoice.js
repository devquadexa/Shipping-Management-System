class DeletePaymentFromOldInvoice {
  constructor(oldInvoiceRepository) {
    this.oldInvoiceRepository = oldInvoiceRepository;
  }

  async execute(paymentId) {
    return await this.oldInvoiceRepository.deletePayment(paymentId);
  }
}

module.exports = DeletePaymentFromOldInvoice;
