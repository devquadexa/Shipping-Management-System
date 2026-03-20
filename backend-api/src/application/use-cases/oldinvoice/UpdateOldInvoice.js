class UpdateOldInvoice {
  constructor(oldInvoiceRepository) {
    this.oldInvoiceRepository = oldInvoiceRepository;
  }

  async execute(oldInvoiceId, invoiceData) {
    // Calculate balance
    const balance = invoiceData.totalAmount - (invoiceData.amountReceived || 0);
    
    // Determine status
    let status = 'Pending';
    if (balance <= 0) {
      status = 'Fully Settled';
    } else if (invoiceData.amountReceived > 0) {
      status = 'Partially Paid';
    }
    
    // Calculate days after invoice if settled
    let daysAfterInvoice = null;
    if (status === 'Fully Settled' && invoiceData.settleDate && invoiceData.invoiceDate) {
      const invoiceDate = new Date(invoiceData.invoiceDate);
      const settleDate = new Date(invoiceData.settleDate);
      daysAfterInvoice = Math.floor((settleDate - invoiceDate) / (1000 * 60 * 60 * 24));
    }
    
    return await this.oldInvoiceRepository.update(oldInvoiceId, {
      ...invoiceData,
      balance,
      status,
      daysAfterInvoice
    });
  }
}

module.exports = UpdateOldInvoice;
