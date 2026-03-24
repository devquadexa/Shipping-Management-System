class IOldInvoiceRepository {
  async create(invoiceData) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async findById(oldInvoiceId) {
    throw new Error('Method not implemented');
  }

  async update(oldInvoiceId, invoiceData) {
    throw new Error('Method not implemented');
  }

  async delete(oldInvoiceId) {
    throw new Error('Method not implemented');
  }

  async addPayment(oldInvoiceId, paymentData) {
    throw new Error('Method not implemented');
  }

  async getPayments(oldInvoiceId) {
    throw new Error('Method not implemented');
  }

  async deletePayment(paymentId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IOldInvoiceRepository;
