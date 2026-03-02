/**
 * Category Repository Interface
 * Defines contract for category data access
 */
class ICategoryRepository {
  async findAll() {
    throw new Error('Method not implemented');
  }

  async findById(categoryId) {
    throw new Error('Method not implemented');
  }

  async findByCustomerId(customerId) {
    throw new Error('Method not implemented');
  }

  async assignToCustomer(customerId, categoryIds) {
    throw new Error('Method not implemented');
  }

  async removeFromCustomer(customerId) {
    throw new Error('Method not implemented');
  }
}

module.exports = ICategoryRepository;
