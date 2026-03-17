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
      .input('addressNumber', this.sql.VarChar, customer.addressNumber)
      .input('addressStreet1', this.sql.VarChar, customer.addressStreet1)
      .input('addressStreet2', this.sql.VarChar, customer.addressStreet2)
      .input('addressDistrict', this.sql.VarChar, customer.addressDistrict)
      .input('addressCity', this.sql.VarChar, customer.addressCity)
      .input('addressCountry', this.sql.VarChar, customer.addressCountry || 'Sri Lanka')
      .input('officeAddressNumber', this.sql.VarChar, customer.officeAddressNumber)
      .input('officeAddressStreet1', this.sql.VarChar, customer.officeAddressStreet1)
      .input('officeAddressStreet2', this.sql.VarChar, customer.officeAddressStreet2)
      .input('officeAddressDistrict', this.sql.VarChar, customer.officeAddressDistrict)
      .input('officeAddressCity', this.sql.VarChar, customer.officeAddressCity)
      .input('officeAddressCountry', this.sql.VarChar, customer.officeAddressCountry || 'Sri Lanka')
      .input('isOfficeAddressSame', this.sql.Bit, customer.isOfficeAddressSame)
      .input('website', this.sql.VarChar, customer.website || null)
      .input('registrationDate', this.sql.DateTime, customer.registrationDate)
      .input('creditPeriodDays', this.sql.Int, customer.creditPeriodDays || 30)
      .input('isActive', this.sql.Bit, customer.isActive)
      .query(`
        INSERT INTO Customers (
          CustomerId, Name, MainPhone, Email, 
          addressNumber, addressStreet1, addressStreet2, addressDistrict, addressCity, addressCountry,
          officeAddressNumber, officeAddressStreet1, officeAddressStreet2, officeAddressDistrict, officeAddressCity, officeAddressCountry,
          isOfficeAddressSame, Website, RegistrationDate, creditPeriodDays, IsActive
        )
        VALUES (
          @customerId, @name, @mainPhone, @email,
          @addressNumber, @addressStreet1, @addressStreet2, @addressDistrict, @addressCity, @addressCountry,
          @officeAddressNumber, @officeAddressStreet1, @officeAddressStreet2, @officeAddressDistrict, @officeAddressCity, @officeAddressCountry,
          @isOfficeAddressSame, @website, @registrationDate, @creditPeriodDays, @isActive
        )
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
          phone: cp.phone,
          email: cp.email || null,
          designation: cp.designation || null
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
      .query(`
        SELECT * FROM Customers WHERE CustomerId = @customerId
      `);
    
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
    
    let query = `SELECT * FROM Customers WHERE IsActive = 1`;
    
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
      .input('addressNumber', this.sql.VarChar, customer.addressNumber)
      .input('addressStreet1', this.sql.VarChar, customer.addressStreet1)
      .input('addressStreet2', this.sql.VarChar, customer.addressStreet2)
      .input('addressDistrict', this.sql.VarChar, customer.addressDistrict)
      .input('addressCity', this.sql.VarChar, customer.addressCity)
      .input('addressCountry', this.sql.VarChar, customer.addressCountry || 'Sri Lanka')
      .input('officeAddressNumber', this.sql.VarChar, customer.officeAddressNumber)
      .input('officeAddressStreet1', this.sql.VarChar, customer.officeAddressStreet1)
      .input('officeAddressStreet2', this.sql.VarChar, customer.officeAddressStreet2)
      .input('officeAddressDistrict', this.sql.VarChar, customer.officeAddressDistrict)
      .input('officeAddressCity', this.sql.VarChar, customer.officeAddressCity)
      .input('officeAddressCountry', this.sql.VarChar, customer.officeAddressCountry || 'Sri Lanka')
      .input('isOfficeAddressSame', this.sql.Bit, customer.isOfficeAddressSame)
      .input('website', this.sql.VarChar, customer.website || null)
      .input('creditPeriodDays', this.sql.Int, customer.creditPeriodDays || 30)
      .input('isActive', this.sql.Bit, customer.isActive !== undefined ? customer.isActive : true)
      .query(`
        UPDATE Customers 
        SET Name = @name, MainPhone = @mainPhone, Email = @email,
            addressNumber = @addressNumber, addressStreet1 = @addressStreet1, addressStreet2 = @addressStreet2, 
            addressDistrict = @addressDistrict, addressCity = @addressCity, addressCountry = @addressCountry,
            officeAddressNumber = @officeAddressNumber, officeAddressStreet1 = @officeAddressStreet1, 
            officeAddressStreet2 = @officeAddressStreet2, officeAddressDistrict = @officeAddressDistrict, 
            officeAddressCity = @officeAddressCity, officeAddressCountry = @officeAddressCountry, 
            isOfficeAddressSame = @isOfficeAddressSame,
            Website = @website, creditPeriodDays = @creditPeriodDays, IsActive = @isActive
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
          phone: cp.phone,
          email: cp.email || null,
          designation: cp.designation || null
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
      addressNumber: row.addressNumber,
      addressStreet1: row.addressStreet1,
      addressStreet2: row.addressStreet2,
      addressDistrict: row.addressDistrict,
      addressCity: row.addressCity,
      addressCountry: row.addressCountry || 'Sri Lanka',
      officeAddressNumber: row.officeAddressNumber,
      officeAddressStreet1: row.officeAddressStreet1,
      officeAddressStreet2: row.officeAddressStreet2,
      officeAddressDistrict: row.officeAddressDistrict,
      officeAddressCity: row.officeAddressCity,
      officeAddressCountry: row.officeAddressCountry || 'Sri Lanka',
      isOfficeAddressSame: row.isOfficeAddressSame,
      website: row.Website,
      registrationDate: row.RegistrationDate,
      creditPeriodDays: row.creditPeriodDays || 30,
      isActive: row.IsActive
    });
  }
}

module.exports = MSSQLCustomerRepository;
