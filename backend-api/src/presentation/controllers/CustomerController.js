/**
 * Customer Controller
 * Handles HTTP requests and delegates to use cases
 * Part of the presentation layer
 */
class CustomerController {
  constructor(container) {
    this.createCustomer = container.get('createCustomer');
    this.getAllCustomers = container.get('getAllCustomers');
    this.updateCustomer = container.get('updateCustomer');
    this.deleteCustomer = container.get('deleteCustomer');
    this.customerRepository = container.get('customerRepository');
    this.categoryRepository = container.get('categoryRepository');
  }

  async create(req, res) {
    try {
      console.log('📝 Creating customer with data:', req.body);
      const customer = await this.createCustomer.execute(req.body);
      console.log('✅ Customer created successfully:', customer.customerId);
      res.status(201).json(customer);
    } catch (error) {
      console.error('❌ Create customer error:', error.message);
      console.error('   Stack:', error.stack);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const customers = await this.getAllCustomers.execute(req.query);
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getById(req, res) {
    try {
      const customer = await this.customerRepository.findById(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async update(req, res) {
    try {
      console.log('📝 Updating customer:', req.params.id);
      console.log('   Update data:', req.body);
      console.log('   IsActive value:', req.body.isActive);
      const customer = await this.updateCustomer.execute(req.params.id, req.body);
      console.log('✅ Customer updated successfully');
      res.json(customer);
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await this.deleteCustomer.execute(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await this.categoryRepository.findAll();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = CustomerController;
