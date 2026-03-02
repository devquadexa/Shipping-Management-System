/**
 * Bill Repository Interface
 */
class IBillRepository {
  async create(bill) {
    throw new Error('Method not implemented');
  }

  async findById(billId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async findByJob(jobId) {
    throw new Error('Method not implemented');
  }

  async findByCustomer(customerId) {
    throw new Error('Method not implemented');
  }

  async update(billId, bill) {
    throw new Error('Method not implemented');
  }

  async markAsPaid(billId) {
    throw new Error('Method not implemented');
  }

  async delete(billId) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = IBillRepository;
