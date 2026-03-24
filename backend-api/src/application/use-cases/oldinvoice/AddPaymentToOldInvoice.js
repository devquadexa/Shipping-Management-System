class AddPaymentToOldInvoice {
  constructor(oldInvoiceRepository) {
    this.oldInvoiceRepository = oldInvoiceRepository;
  }

  async execute(oldInvoiceId, paymentData) {
    return await this.oldInvoiceRepository.addPayment(oldInvoiceId, paymentData);
  }
}

module.exports = AddPaymentToOldInvoice;
