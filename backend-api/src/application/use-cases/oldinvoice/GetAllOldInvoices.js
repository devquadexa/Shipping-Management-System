class GetAllOldInvoices {
  constructor(oldInvoiceRepository) {
    this.oldInvoiceRepository = oldInvoiceRepository;
  }

  async execute() {
    return await this.oldInvoiceRepository.findAll();
  }
}

module.exports = GetAllOldInvoices;
