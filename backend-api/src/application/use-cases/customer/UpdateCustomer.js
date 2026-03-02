/**
 * Update Customer Use Case
 */
const Customer = require('../../../domain/entities/Customer');

class UpdateCustomer {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(customerId, updateData) {
    // Check if customer exists
    const existingCustomer = await this.customerRepository.findById(customerId);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Create updated entity
    const updatedCustomer = new Customer({
      ...existingCustomer,
      ...updateData,
      customerId // Ensure ID doesn't change
    });

    // Validate
    const validation = updatedCustomer.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Update through repository
    const result = await this.customerRepository.update(customerId, updatedCustomer);
    
    return result;
  }
}

module.exports = UpdateCustomer;
