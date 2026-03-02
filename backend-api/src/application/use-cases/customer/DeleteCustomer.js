/**
 * Delete Customer Use Case
 */
class DeleteCustomer {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(customerId) {
    // Check if customer exists
    const exists = await this.customerRepository.exists(customerId);
    if (!exists) {
      throw new Error('Customer not found');
    }

    // Business rule: Could add checks here
    // e.g., prevent deletion if customer has active jobs

    await this.customerRepository.delete(customerId);
    
    return { success: true, message: 'Customer deleted successfully' };
  }
}

module.exports = DeleteCustomer;
