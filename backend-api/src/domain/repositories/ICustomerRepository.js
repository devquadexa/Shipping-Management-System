/**
 * Customer Repository Interface
 * Defines the contract for customer data access
 * Implementation details are in the infrastructure layer
 */
class ICustomerRepository {
  async create(customer) {
    throw new Error('Method not implemented');
  }

  async findById(customerId) {
    throw new Error('Method not implemented');
  }

  async findAll(filters = {}) {
    throw new Error('Method not implemented');
  }

  async update(customerId, customer) {
    throw new Error('Method not implemented');
  }

  async delete(customerId) {
    throw new Error('Method not implemented');
  }

  async exists(customerId) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async generateNextId() {
    throw new Error('Method not implemented');
  }
}

module.exports = ICustomerRepository;
