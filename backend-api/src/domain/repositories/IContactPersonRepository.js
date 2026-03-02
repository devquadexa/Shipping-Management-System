/**
 * Contact Person Repository Interface
 * Defines contract for contact person data access
 */
class IContactPersonRepository {
  async create(contactPerson) {
    throw new Error('Method not implemented');
  }

  async findByCustomerId(customerId) {
    throw new Error('Method not implemented');
  }

  async deleteByCustomerId(customerId) {
    throw new Error('Method not implemented');
  }
}

module.exports = IContactPersonRepository;
