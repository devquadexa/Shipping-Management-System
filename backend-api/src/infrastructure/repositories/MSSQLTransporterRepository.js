const ITransporterRepository = require('../../domain/repositories/ITransporterRepository');
const Transporter = require('../../domain/entities/Transporter');

class MSSQLTransporterRepository extends ITransporterRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
    this.tableEnsured = false;
  }

  async ensureTableExists() {
    if (this.tableEnsured) {
      return;
    }

    const pool = await this.db();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Transporters')
      BEGIN
        CREATE TABLE Transporters (
          transporterId VARCHAR(50) PRIMARY KEY,
          name NVARCHAR(200) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          email VARCHAR(100),
          registrationDate DATETIME DEFAULT GETDATE(),
          addressNumber NVARCHAR(100),
          addressStreet1 NVARCHAR(200),
          addressStreet2 NVARCHAR(200),
          addressDistrict NVARCHAR(100),
          addressCity NVARCHAR(100),
          addressCountry NVARCHAR(100),
          contactPersonsJson NVARCHAR(MAX),
          contactPerson NVARCHAR(150),
          address NVARCHAR(500),
          vehicleNumber NVARCHAR(100),
          notes NVARCHAR(MAX),
          createdDate DATETIME DEFAULT GETDATE(),
          isActive BIT DEFAULT 1
        )
      END

      IF COL_LENGTH('Transporters', 'registrationDate') IS NULL
        ALTER TABLE Transporters ADD registrationDate DATETIME DEFAULT GETDATE();

      IF COL_LENGTH('Transporters', 'addressNumber') IS NULL
        ALTER TABLE Transporters ADD addressNumber NVARCHAR(100);

      IF COL_LENGTH('Transporters', 'addressStreet1') IS NULL
        ALTER TABLE Transporters ADD addressStreet1 NVARCHAR(200);

      IF COL_LENGTH('Transporters', 'addressStreet2') IS NULL
        ALTER TABLE Transporters ADD addressStreet2 NVARCHAR(200);

      IF COL_LENGTH('Transporters', 'addressDistrict') IS NULL
        ALTER TABLE Transporters ADD addressDistrict NVARCHAR(100);

      IF COL_LENGTH('Transporters', 'addressCity') IS NULL
        ALTER TABLE Transporters ADD addressCity NVARCHAR(100);

      IF COL_LENGTH('Transporters', 'addressCountry') IS NULL
        ALTER TABLE Transporters ADD addressCountry NVARCHAR(100);

      IF COL_LENGTH('Transporters', 'contactPersonsJson') IS NULL
        ALTER TABLE Transporters ADD contactPersonsJson NVARCHAR(MAX);
    `);

    this.tableEnsured = true;
  }

  async create(transporter) {
    await this.ensureTableExists();
    const pool = await this.db();

    await pool.request()
      .input('transporterId', this.sql.VarChar, transporter.transporterId)
      .input('name', this.sql.NVarChar, transporter.name)
      .input('phone', this.sql.VarChar, transporter.mainPhone)
      .input('email', this.sql.VarChar, transporter.email || null)
      .input('registrationDate', this.sql.DateTime, transporter.registrationDate)
      .input('addressNumber', this.sql.NVarChar, transporter.addressNumber)
      .input('addressStreet1', this.sql.NVarChar, transporter.addressStreet1)
      .input('addressStreet2', this.sql.NVarChar, transporter.addressStreet2 || null)
      .input('addressDistrict', this.sql.NVarChar, transporter.addressDistrict)
      .input('addressCity', this.sql.NVarChar, transporter.addressCity)
      .input('addressCountry', this.sql.NVarChar, transporter.addressCountry || 'Sri Lanka')
      .input('contactPersonsJson', this.sql.NVarChar, JSON.stringify(transporter.contactPersons || []))
      .input('contactPerson', this.sql.NVarChar, transporter.contactPerson || transporter.contactPersons?.[0]?.name || null)
      .input('address', this.sql.NVarChar, transporter.getFormattedAddress())
      .input('vehicleNumber', this.sql.NVarChar, transporter.vehicleNumber || null)
      .input('notes', this.sql.NVarChar, transporter.notes || null)
      .input('createdDate', this.sql.DateTime, transporter.createdDate)
      .input('isActive', this.sql.Bit, transporter.isActive)
      .query(`
        INSERT INTO Transporters (
          transporterId, name, phone, email, registrationDate,
          addressNumber, addressStreet1, addressStreet2, addressDistrict, addressCity, addressCountry,
          contactPersonsJson, contactPerson, address,
          vehicleNumber, notes, createdDate, isActive
        )
        VALUES (
          @transporterId, @name, @phone, @email, @registrationDate,
          @addressNumber, @addressStreet1, @addressStreet2, @addressDistrict, @addressCity, @addressCountry,
          @contactPersonsJson, @contactPerson, @address,
          @vehicleNumber, @notes, @createdDate, @isActive
        )
      `);

    return transporter;
  }

  async findById(transporterId) {
    await this.ensureTableExists();
    const pool = await this.db();

    const result = await pool.request()
      .input('transporterId', this.sql.VarChar, transporterId)
      .query('SELECT * FROM Transporters WHERE transporterId = @transporterId');

    if (result.recordset.length === 0) {
      return null;
    }

    return this.mapToEntity(result.recordset[0]);
  }

  async findAll(filters = {}) {
    await this.ensureTableExists();
    const pool = await this.db();

    let query = 'SELECT * FROM Transporters WHERE 1 = 1';

    if (filters.name) {
      query += ` AND name LIKE '%${filters.name}%'`;
    }

    query += ' ORDER BY transporterId ASC';

    const result = await pool.request().query(query);
    return result.recordset.map((row) => this.mapToEntity(row));
  }

  async update(transporterId, transporter) {
    await this.ensureTableExists();
    const pool = await this.db();

    await pool.request()
      .input('transporterId', this.sql.VarChar, transporterId)
      .input('name', this.sql.NVarChar, transporter.name)
      .input('phone', this.sql.VarChar, transporter.mainPhone)
      .input('email', this.sql.VarChar, transporter.email || null)
      .input('registrationDate', this.sql.DateTime, transporter.registrationDate)
      .input('addressNumber', this.sql.NVarChar, transporter.addressNumber)
      .input('addressStreet1', this.sql.NVarChar, transporter.addressStreet1)
      .input('addressStreet2', this.sql.NVarChar, transporter.addressStreet2 || null)
      .input('addressDistrict', this.sql.NVarChar, transporter.addressDistrict)
      .input('addressCity', this.sql.NVarChar, transporter.addressCity)
      .input('addressCountry', this.sql.NVarChar, transporter.addressCountry || 'Sri Lanka')
      .input('contactPersonsJson', this.sql.NVarChar, JSON.stringify(transporter.contactPersons || []))
      .input('contactPerson', this.sql.NVarChar, transporter.contactPerson || transporter.contactPersons?.[0]?.name || null)
      .input('address', this.sql.NVarChar, transporter.getFormattedAddress())
      .input('vehicleNumber', this.sql.NVarChar, transporter.vehicleNumber || null)
      .input('notes', this.sql.NVarChar, transporter.notes || null)
      .input('isActive', this.sql.Bit, transporter.isActive !== undefined ? transporter.isActive : true)
      .query(`
        UPDATE Transporters
        SET name = @name,
            phone = @phone,
            email = @email,
            registrationDate = @registrationDate,
            addressNumber = @addressNumber,
            addressStreet1 = @addressStreet1,
            addressStreet2 = @addressStreet2,
            addressDistrict = @addressDistrict,
            addressCity = @addressCity,
            addressCountry = @addressCountry,
            contactPersonsJson = @contactPersonsJson,
            contactPerson = @contactPerson,
            address = @address,
            vehicleNumber = @vehicleNumber,
            notes = @notes,
            isActive = @isActive
        WHERE transporterId = @transporterId
      `);

    return transporter;
  }

  async delete(transporterId) {
    await this.ensureTableExists();
    const pool = await this.db();

    await pool.request()
      .input('transporterId', this.sql.VarChar, transporterId)
      .query('UPDATE Transporters SET isActive = 0 WHERE transporterId = @transporterId');

    return true;
  }

  async exists(transporterId) {
    await this.ensureTableExists();
    const pool = await this.db();

    const result = await pool.request()
      .input('transporterId', this.sql.VarChar, transporterId)
      .query('SELECT COUNT(*) AS count FROM Transporters WHERE transporterId = @transporterId');

    return result.recordset[0].count > 0;
  }

  async findByEmail(email) {
    await this.ensureTableExists();
    const pool = await this.db();

    const result = await pool.request()
      .input('email', this.sql.VarChar, email)
      .query('SELECT * FROM Transporters WHERE email = @email AND isActive = 1');

    if (result.recordset.length === 0) {
      return null;
    }

    return this.mapToEntity(result.recordset[0]);
  }

  async generateNextId() {
    await this.ensureTableExists();
    const pool = await this.db();

    const result = await pool.request()
      .query("SELECT MAX(CAST(SUBSTRING(transporterId, 4, 10) AS INT)) AS maxId FROM Transporters WHERE transporterId LIKE 'TRN%'");

    const nextId = (result.recordset[0].maxId || 0) + 1;
    return `TRN${String(nextId).padStart(4, '0')}`;
  }

  mapToEntity(row) {
    let contactPersons = [];

    if (row.contactPersonsJson) {
      try {
        contactPersons = JSON.parse(row.contactPersonsJson);
      } catch (error) {
        contactPersons = [];
      }
    }

    return new Transporter({
      transporterId: row.transporterId,
      name: row.name,
      mainPhone: row.phone,
      contactPerson: row.contactPerson,
      email: row.email,
      registrationDate: row.registrationDate,
      addressNumber: row.addressNumber,
      addressStreet1: row.addressStreet1,
      addressStreet2: row.addressStreet2,
      addressDistrict: row.addressDistrict,
      addressCity: row.addressCity,
      addressCountry: row.addressCountry,
      contactPersons,
      address: row.address,
      vehicleNumber: row.vehicleNumber,
      notes: row.notes,
      createdDate: row.createdDate,
      isActive: row.isActive,
    });
  }
}

module.exports = MSSQLTransporterRepository;