/**
 * MSSQL Category Repository Implementation
 */
const ICategoryRepository = require('../../domain/repositories/ICategoryRepository');
const Category = require('../../domain/entities/Category');

class MSSQLCategoryRepository extends ICategoryRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
  }

  async findAll() {
    const pool = await this.db();
    
    const result = await pool.request()
      .query('SELECT * FROM Categories ORDER BY CategoryName');
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findById(categoryId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('categoryId', this.sql.Int, categoryId)
      .query('SELECT * FROM Categories WHERE CategoryId = @categoryId');
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findByCustomerId(customerId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query(`
        SELECT c.* 
        FROM Categories c
        INNER JOIN CustomerCategories cc ON c.CategoryId = cc.CategoryId
        WHERE cc.CustomerId = @customerId
        ORDER BY c.CategoryName
      `);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async assignToCustomer(customerId, categoryIds) {
    const pool = await this.db();
    
    // First remove existing categories
    await this.removeFromCustomer(customerId);
    
    // Then insert new categories
    for (const categoryId of categoryIds) {
      await pool.request()
        .input('customerId', this.sql.VarChar, customerId)
        .input('categoryId', this.sql.Int, categoryId)
        .query(`
          INSERT INTO CustomerCategories (CustomerId, CategoryId)
          VALUES (@customerId, @categoryId)
        `);
    }
    
    return true;
  }

  async removeFromCustomer(customerId) {
    const pool = await this.db();
    
    await pool.request()
      .input('customerId', this.sql.VarChar, customerId)
      .query('DELETE FROM CustomerCategories WHERE CustomerId = @customerId');
    
    return true;
  }

  mapToEntity(row) {
    return new Category({
      categoryId: row.CategoryId,
      categoryName: row.CategoryName
    });
  }

  // Format ID with leading zeros (e.g., 1 -> "000001")
  formatId(id) {
    return String(id).padStart(6, '0');
  }
}

module.exports = MSSQLCategoryRepository;
