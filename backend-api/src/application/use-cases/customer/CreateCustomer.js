/**
 * Create Customer Use Case
 * Contains business logic for creating a customer
 * Independent of database implementation
 */
const Customer = require('../../../domain/entities/Customer');

class CreateCustomer {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(customerData) {
    // Create domain entity
    const customer = new Customer({
      customerId: await this.customerRepository.generateNextId(),
      ...customerData
    });

    // Validate business rules
    const validation = customer.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Persist through repository
    const createdCustomer = await this.customerRepository.create(customer);
    
    return createdCustomer;
  }
}

module.exports = CreateCustomer;
