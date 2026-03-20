class DeleteOldInvoice {
  constructor(oldInvoiceRepository) {
    this.oldInvoiceRepository = oldInvoiceRepository;
  }

  async execute(oldInvoiceId) {
    return await this.oldInvoiceRepository.delete(oldInvoiceId);
  }
}

module.exports = DeleteOldInvoice;
