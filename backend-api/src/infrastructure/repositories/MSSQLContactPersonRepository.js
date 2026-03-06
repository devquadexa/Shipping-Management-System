/**
 * MSSQL ContactPerson Repository Implementation
 */
const IContactPersonRepository = require('../../domain/repositories/IContactPersonRepository');
const ContactPerson = require('../../domain/entities/ContactPerson');

class MSSQLContactPersonRepository extends IContactPersonRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
  }

  async create(contactPerson) {
    const pool = await this.db();
    
    await pool.request()
      .input('contactPersonId', this.sql.Int, contactPerson.contactPersonId)
      .input('customerId', this.sql.VarChar, contactPerson.customerId)
      .input('name', this.sql.VarChar, contactPerson.name)
      .input('phone', this.sql.VarChar, contactPerson.phone)
      .input('email', this.sql.VarChar, contactPerson.email)
      .input('designation', this.sql.VarChar, contactPerson.designation)
      .query(`
        INSERT INTO ContactPersons (ContactPersonId, CustomerId, Name, Phone, Email, Designation)
        VALUES (@contactPersonId, @customerId, @name, @phone, @email, @designation)
      `);
    
    return contactPerson;
  }

  async findByCustomerId(customerId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('SELECT * FROM ContactPersons WHERE CustomerId = @customerId ORDER BY ContactPersonId');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async deleteByCustomerId(customerId) {
    const pool = await this.db();
    
    await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('DELETE FROM ContactPersons WHERE CustomerId = @customerId');
    
    return true;
  }

  mapToEntity(row) {
    return new ContactPerson({
      contactPersonId: row.ContactPersonId,
      customerId: row.CustomerId,
      name: row.Name,
      phone: row.Phone,
      email: row.Email,
      designation: row.Designation
    });
  }

  // Format ID with leading zeros (e.g., 1 -> "000001")
  formatId(id) {
    return String(id).padStart(6, '0');
  }
}

module.exports = MSSQLContactPersonRepository;
