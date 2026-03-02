/**
 * MSSQL Customer Repository Implementation
 * Implements ICustomerRepository interface
 * Contains all SQL-specific logic
 */
const ICustomerRepository = require('../../domain/repositories/ICustomerRepository');
const Customer = require('../../domain/entities/Customer');

class MSSQLCustomerRepository extends ICustomerRepository {
  constructor(dbConnection, sql, contactPersonRepository, categoryRepository) {
    super();
    this.db = dbConnection;
    this.sql = sql;
    this.contactPersonRepository = contactPersonRepository;
    this.categoryRepository = categoryRepository;
  }

  async create(customer) {
    const pool = await this.db();
    
    // Insert customer
    await pool.request()
      .input('customerId', this.sql.VarChar, customer.customerId)
      .input('name', this.sql.VarChar, customer.name)
      .input('mainPhone', this.sql.VarChar, customer.mainPhone)
      .input('email', this.sql.VarChar, customer.email)
      .input('address', this.sql.VarChar, customer.address)
      .input('officeLocation', this.sql.VarChar, customer.officeLocation || customer.address)
      .input('isSameLocation', this.sql.Bit, customer.isSameLocation)
      .input('website', this.sql.VarChar, customer.website || null)
      .input('registrationDate', this.sql.DateTime, customer.registrationDate)
      .input('isActive', this.sql.Bit, customer.isActive)
      .query(`
        INSERT INTO Customers (CustomerId, Name, MainPhone, Email, Address, OfficeLocation, IsSameLocation, Website, RegistrationDate, IsActive)
        VALUES (@customerId, @name, @mainPhone, @email, @address, @officeLocation, @isSameLocation, @website, @registrationDate, @isActive)
      `);
    
    // Insert contact persons with IDs starting from 1 (will be formatted as 000001, 000002, etc.)
    if (customer.contactPersons && customer.contactPersons.length > 0) {
      for (let i = 0; i < customer.contactPersons.length; i++) {
        const cp = customer.contactPersons[i];
        const ContactPerson = require('../../domain/entities/ContactPerson');
        const contactPerson = new ContactPerson({
          contactPersonId: i + 1, // IDs: 1, 2, 3 (displayed as 000001, 000002, 000003)
          customerId: customer.customerId,
          name: cp.name,
          phone: cp.phone
        });
        await this.contactPersonRepository.create(contactPerson);
      }
    }

    // Assign categories
    if (customer.categories && customer.categories.length > 0) {
      await this.categoryRepository.assignToCustomer(customer.customerId, customer.categories);
    }
    
    return customer;
  }

  async findById(customerId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('SELECT * FROM Customers WHERE CustomerId = @customerId');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const customer = await this.mapToEntity(result.recordset[0]);
    
    // Load contact persons
    customer.contactPersons = await this.contactPersonRepository.findByCustomerId(customerId);
    
    // Load categories
    customer.categories = await this.categoryRepository.findByCustomerId(customerId);
    
    return customer;
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    
    let query = 'SELECT * FROM Customers WHERE IsActive = 1';
    
    if (filters.name) {
      query += ` AND Name LIKE '%${filters.name}%'`;
    }
    
    query += ' ORDER BY CustomerId ASC';
    
    const result = await pool.request().query(query);
    
    const customers = [];
    for (const row of result.recordset) {
      const customer = await this.mapToEntity(row);
      
      // Load contact persons
      customer.contactPersons = await this.contactPersonRepository.findByCustomerId(customer.customerId);
      
      // Load categories
      customer.categories = await this.categoryRepository.findByCustomerId(customer.customerId);
      
      customers.push(customer);
    }
    
    return customers;
  }

  async update(customerId, customer) {
    const pool = await this.db();
    
    await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .input('name', this.sql.VarChar, customer.name)
      .input('mainPhone', this.sql.VarChar, customer.mainPhone)
      .input('email', this.sql.VarChar, customer.email)
      .input('address', this.sql.VarChar, customer.address)
      .input('officeLocation', this.sql.VarChar, customer.officeLocation || customer.address)
      .input('isSameLocation', this.sql.Bit, customer.isSameLocation)
      .input('website', this.sql.VarChar, customer.website || null)
      .input('isActive', this.sql.Bit, customer.isActive !== undefined ? customer.isActive : true)
      .query(`
        UPDATE Customers 
        SET Name = @name, MainPhone = @mainPhone, Email = @email, Address = @address,
            OfficeLocation = @officeLocation, IsSameLocation = @isSameLocation, Website = @website,
            IsActive = @isActive
        WHERE CustomerId = @customerId
      `);
    
    // Update contact persons - delete old and insert new with IDs starting from 1
    await this.contactPersonRepository.deleteByCustomerId(customerId);
    if (customer.contactPersons && customer.contactPersons.length > 0) {
      for (let i = 0; i < customer.contactPersons.length; i++) {
        const cp = customer.contactPersons[i];
        const ContactPerson = require('../../domain/entities/ContactPerson');
        const contactPerson = new ContactPerson({
          contactPersonId: i + 1, // IDs: 1, 2, 3 (displayed as 000001, 000002, 000003)
          customerId: customerId,
          name: cp.name,
          phone: cp.phone
        });
        await this.contactPersonRepository.create(contactPerson);
      }
    }

    // Update categories
    if (customer.categories && customer.categories.length > 0) {
      await this.categoryRepository.assignToCustomer(customerId, customer.categories);
    } else {
      await this.categoryRepository.removeFromCustomer(customerId);
    }
    
    return customer;
  }

  async delete(customerId) {
    const pool = await this.db();
    
    // Soft delete
    await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('UPDATE Customers SET IsActive = 0 WHERE CustomerId = @customerId');
    
    return true;
  }

  async exists(customerId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('SELECT COUNT(*) as count FROM Customers WHERE CustomerId = @customerId');
    
    return result.recordset[0].count > 0;
  }

  async findByEmail(email) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('email', this.sql.VarChar, email)
      .query('SELECT * FROM Customers WHERE Email = @email AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async generateNextId() {
    const pool = await this.db();
    
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(CustomerId, 5, 4) AS INT)) as maxId FROM Customers');
    
    const nextId = (result.recordset[0].maxId || 0) + 1;
    return `CUST${String(nextId).padStart(4, '0')}`;
  }

  // Map database row to domain entity
  mapToEntity(row) {
    return new Customer({
      customerId: row.CustomerId,
      name: row.Name,
      mainPhone: row.MainPhone,
      email: row.Email,
      address: row.Address,
      officeLocation: row.OfficeLocation,
      isSameLocation: row.IsSameLocation,
      website: row.Website,
      registrationDate: row.RegistrationDate,
      isActive: row.IsActive
    });
  }
}

module.exports = MSSQLCustomerRepository;
