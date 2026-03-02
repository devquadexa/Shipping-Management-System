/**
 * Get All Customers Use Case
 */
class GetAllCustomers {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(filters = {}) {
    const customers = await this.customerRepository.findAll(filters);
    return customers;
  }
}

module.exports = GetAllCustomers;
