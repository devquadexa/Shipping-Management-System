const sql = require('mssql');
const IPayItemTemplateRepository = require('../../domain/repositories/IPayItemTemplateRepository');

class MSSQLPayItemTemplateRepository extends IPayItemTemplateRepository {
  constructor(getConnection, sqlModule) {
    super();
    this.getConnection = getConnection;
    this.sql = sqlModule;
  }

  async getByCategory(shipmentCategory) {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .input('shipmentCategory', this.sql.NVarChar, shipmentCategory)
        .query(`
          SELECT templateId, shipmentCategory, itemName, itemOrder, isActive, createdDate
          FROM PayItemTemplates
          WHERE shipmentCategory = @shipmentCategory AND isActive = 1
          ORDER BY itemOrder ASC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching pay item templates by category:', error);
      throw error;
    }
  }

  async getAll() {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .query(`
          SELECT templateId, shipmentCategory, itemName, itemOrder, isActive, createdDate
          FROM PayItemTemplates
          WHERE isActive = 1
          ORDER BY shipmentCategory, itemOrder ASC
        `);
      
      // Group by category
      const grouped = {};
      result.recordset.forEach(item => {
        if (!grouped[item.shipmentCategory]) {
          grouped[item.shipmentCategory] = [];
        }
        grouped[item.shipmentCategory].push(item);
      });
      
      return grouped;
    } catch (error) {
      console.error('Error fetching all pay item templates:', error);
      throw error;
    }
  }

  async create(templateData) {
    try {
      const pool = await this.getConnection();
      
      // Get max order for this category
      const maxOrderResult = await pool.request()
        .input('shipmentCategory', this.sql.NVarChar, templateData.shipmentCategory)
        .query(`
          SELECT ISNULL(MAX(itemOrder), 0) as maxOrder
          FROM PayItemTemplates
          WHERE shipmentCategory = @shipmentCategory
        `);
      
      const nextOrder = maxOrderResult.recordset[0].maxOrder + 1;
      
      const result = await pool.request()
        .input('shipmentCategory', this.sql.NVarChar, templateData.shipmentCategory)
        .input('itemName', this.sql.NVarChar, templateData.itemName)
        .input('itemOrder', this.sql.Int, nextOrder)
        .query(`
          INSERT INTO PayItemTemplates (shipmentCategory, itemName, itemOrder)
          OUTPUT INSERTED.*
          VALUES (@shipmentCategory, @itemName, @itemOrder)
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating pay item template:', error);
      throw error;
    }
  }

  async update(templateId, templateData) {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .input('templateId', this.sql.Int, templateId)
        .input('itemName', this.sql.NVarChar, templateData.itemName)
        .query(`
          UPDATE PayItemTemplates
          SET itemName = @itemName
          OUTPUT INSERTED.*
          WHERE templateId = @templateId
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error updating pay item template:', error);
      throw error;
    }
  }

  async delete(templateId) {
    try {
      const pool = await this.getConnection();
      await pool.request()
        .input('templateId', this.sql.Int, templateId)
        .query(`
          UPDATE PayItemTemplates
          SET isActive = 0
          WHERE templateId = @templateId
        `);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting pay item template:', error);
      throw error;
    }
  }

  async reorder(shipmentCategory, items) {
    try {
      const pool = await this.getConnection();
      const transaction = new this.sql.Transaction(pool);
      
      await transaction.begin();
      
      try {
        for (let i = 0; i < items.length; i++) {
          await transaction.request()
            .input('templateId', this.sql.Int, items[i].templateId)
            .input('itemOrder', this.sql.Int, i + 1)
            .query(`
              UPDATE PayItemTemplates
              SET itemOrder = @itemOrder
              WHERE templateId = @templateId
            `);
        }
        
        await transaction.commit();
        return { success: true };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error reordering pay item templates:', error);
      throw error;
    }
  }
}

module.exports = MSSQLPayItemTemplateRepository;
