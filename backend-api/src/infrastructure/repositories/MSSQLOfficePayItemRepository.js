/**
 * MSSQL Office Pay Item Repository Implementation
 */
const IOfficePayItemRepository = require('../../domain/repositories/IOfficePayItemRepository');
const OfficePayItem = require('../../domain/entities/OfficePayItem');

class MSSQLOfficePayItemRepository extends IOfficePayItemRepository {
  constructor(getConnection, sql) {
    super();
    this.db = getConnection;
    this.sql = sql;
  }

  async create(officePayItem) {
    try {
      console.log('MSSQLOfficePayItemRepository.create - START');
      console.log('Creating office pay item:', officePayItem);
      
      const pool = await this.db();
      
      await pool.request()
        .input('officePayItemId', this.sql.VarChar, officePayItem.officePayItemId)
        .input('jobId', this.sql.VarChar, officePayItem.jobId)
        .input('description', this.sql.NVarChar, officePayItem.description)
        .input('actualCost', this.sql.Decimal(18, 2), officePayItem.actualCost)
        .input('paidBy', this.sql.VarChar, officePayItem.paidBy)
        .query(`
          INSERT INTO OfficePayItems (
            officePayItemId, jobId, description, actualCost, 
            paidBy, paymentDate, createdDate, updatedDate
          )
          VALUES (
            @officePayItemId, @jobId, @description, @actualCost,
            @paidBy, GETDATE(), GETDATE(), GETDATE()
          )
        `);
      
      console.log('MSSQLOfficePayItemRepository.create - SUCCESS');
      return officePayItem;
    } catch (error) {
      console.error('MSSQLOfficePayItemRepository.create - ERROR:', error);
      throw error;
    }
  }

  async findById(officePayItemId) {
    try {
      const pool = await this.db();
      
      const result = await pool.request()
        .input('officePayItemId', this.sql.VarChar, officePayItemId)
        .query(`
          SELECT 
            opi.*,
            u.fullName as paidByName
          FROM OfficePayItems opi
          LEFT JOIN Users u ON opi.paidBy = u.userId
          WHERE opi.officePayItemId = @officePayItemId
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return new OfficePayItem(result.recordset[0]);
    } catch (error) {
      console.error('MSSQLOfficePayItemRepository.findById - ERROR:', error);
      throw error;
    }
  }

  async findByJobId(jobId) {
    try {
      console.log('MSSQLOfficePayItemRepository.findByJobId - jobId:', jobId);
      
      const pool = await this.db();
      
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query(`
          SELECT 
            opi.*,
            u.fullName as paidByName
          FROM OfficePayItems opi
          LEFT JOIN Users u ON opi.paidBy = u.userId
          WHERE opi.jobId = @jobId
          ORDER BY opi.paymentDate DESC
        `);
      
      console.log('MSSQLOfficePayItemRepository.findByJobId - found items:', result.recordset.length);
      
      return result.recordset.map(row => new OfficePayItem(row));
    } catch (error) {
      console.error('MSSQLOfficePayItemRepository.findByJobId - ERROR:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      const pool = await this.db();
      
      const result = await pool.request()
        .query(`
          SELECT 
            opi.*,
            u.fullName as paidByName,
            j.customerId,
            c.name as customerName
          FROM OfficePayItems opi
          LEFT JOIN Users u ON opi.paidBy = u.userId
          LEFT JOIN Jobs j ON opi.jobId = j.jobId
          LEFT JOIN Customers c ON j.customerId = c.customerId
          ORDER BY opi.paymentDate DESC
        `);
      
      return result.recordset.map(row => new OfficePayItem(row));
    } catch (error) {
      console.error('MSSQLOfficePayItemRepository.findAll - ERROR:', error);
      throw error;
    }
  }

  async update(officePayItemId, updateData) {
    try {
      console.log('MSSQLOfficePayItemRepository.update - START');
      console.log('Updating office pay item:', officePayItemId, updateData);
      
      const pool = await this.db();
      
      // Build dynamic update query
      const updateFields = [];
      const request = pool.request().input('officePayItemId', this.sql.VarChar, officePayItemId);
      
      if (updateData.description !== undefined) {
        updateFields.push('description = @description');
        request.input('description', this.sql.NVarChar, updateData.description);
      }
      
      if (updateData.actualCost !== undefined) {
        updateFields.push('actualCost = @actualCost');
        request.input('actualCost', this.sql.Decimal(18, 2), updateData.actualCost);
      }
      
      updateFields.push('updatedDate = GETDATE()');
      
      const query = `
        UPDATE OfficePayItems 
        SET ${updateFields.join(', ')}
        WHERE officePayItemId = @officePayItemId
      `;
      
      await request.query(query);
      
      console.log('MSSQLOfficePayItemRepository.update - SUCCESS');
      return await this.findById(officePayItemId);
    } catch (error) {
      console.error('MSSQLOfficePayItemRepository.update - ERROR:', error);
      throw error;
    }
  }

  async delete(officePayItemId) {
    try {
      const pool = await this.db();
      
      await pool.request()
        .input('officePayItemId', this.sql.VarChar, officePayItemId)
        .query('DELETE FROM OfficePayItems WHERE officePayItemId = @officePayItemId');
      
      return true;
    } catch (error) {
      console.error('MSSQLOfficePayItemRepository.delete - ERROR:', error);
      throw error;
    }
  }

  async generateNextId() {
    try {
      const pool = await this.db();
      
      const result = await pool.request()
        .query(`
          SELECT MAX(CAST(SUBSTRING(officePayItemId, 4, LEN(officePayItemId) - 3) AS INT)) as maxId 
          FROM OfficePayItems 
          WHERE officePayItemId LIKE 'OPI%'
        `);
      
      const nextId = (result.recordset[0].maxId || 0) + 1;
      return `OPI${String(nextId).padStart(6, '0')}`;
    } catch (error) {
      console.error('MSSQLOfficePayItemRepository.generateNextId - ERROR:', error);
      throw error;
    }
  }
}

module.exports = MSSQLOfficePayItemRepository;