/**
 * MSSQL User Repository Implementation
 */
const IUserRepository = require('../../domain/repositories/IUserRepository');
const User = require('../../domain/entities/User');

class MSSQLUserRepository extends IUserRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
  }

  async create(user) {
    const pool = await this.db();
    
    await pool.request()
      .input('userId', this.sql.VarChar, user.userId)
      .input('username', this.sql.VarChar, user.username)
      .input('password', this.sql.VarChar, user.password)
      .input('fullName', this.sql.VarChar, user.fullName)
      .input('role', this.sql.VarChar, user.role)
      .input('email', this.sql.VarChar, user.email)
      .input('createdDate', this.sql.DateTime, user.createdDate)
      .input('isActive', this.sql.Bit, user.isActive)
      .query(`
        INSERT INTO Users (UserId, Username, Password, FullName, Role, Email, CreatedDate, IsActive)
        VALUES (@userId, @username, @password, @fullName, @role, @email, @createdDate, @isActive)
      `);
    
    return user;
  }

  async findById(userId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query('SELECT * FROM Users WHERE UserId = @userId AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findByUsername(username) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('username', this.sql.VarChar, username)
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findAll(filters = {}) {
    const pool = await this.db();
    
    const result = await pool.request()
      .query('SELECT * FROM Users WHERE IsActive = 1 ORDER BY UserId ASC');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async update(userId, user) {
    const pool = await this.db();
    
    await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .input('fullName', this.sql.VarChar, user.fullName)
      .input('role', this.sql.VarChar, user.role)
      .input('email', this.sql.VarChar, user.email)
      .query(`
        UPDATE Users 
        SET FullName = @fullName, Role = @role, Email = @email
        WHERE UserId = @userId
      `);
    
    return user;
  }

  async delete(userId) {
    const pool = await this.db();
    
    await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query('UPDATE Users SET IsActive = 0 WHERE UserId = @userId');
    
    return true;
  }

  async authenticate(username, password) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('username', this.sql.VarChar, username)
      .input('password', this.sql.VarChar, password)
      .query('SELECT * FROM Users WHERE Username = @username AND Password = @password AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async generateNextId() {
    const pool = await this.db();
    
    const result = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(UserId, 5, 4) AS INT)) as maxId FROM Users');
    
    const nextId = (result.recordset[0].maxId || 0) + 1;
    return `USER${String(nextId).padStart(4, '0')}`;
  }

  mapToEntity(row) {
    return new User({
      userId: row.UserId,
      username: row.Username,
      password: row.Password,
      fullName: row.FullName,
      role: row.Role,
      email: row.Email,
      createdDate: row.CreatedDate,
      isActive: row.IsActive
    });
  }
}

module.exports = MSSQLUserRepository;
