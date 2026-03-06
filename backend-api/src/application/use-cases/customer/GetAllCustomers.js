/**
 * Get All Customers Use Case
 */
class GetAllCustomers {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(filters = {}) {
    console.log('GetAllCustomers - Executing with filters:', filters);
    const customers = await this.customerRepository.findAll(filters);
    console.log('GetAllCustomers - Found customers:', customers.length);
    return customers;
  }
}

module.exports = GetAllCustomers;
