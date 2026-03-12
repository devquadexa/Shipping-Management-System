const IPettyCashAssignmentRepository = require('../../domain/repositories/IPettyCashAssignmentRepository');
const PettyCashAssignment = require('../../domain/entities/PettyCashAssignment');

class MSSQLPettyCashAssignmentRepository extends IPettyCashAssignmentRepository {
  constructor(getConnection, sql) {
    super();
    this.getConnection = getConnection;
    this.sql = sql;
  }

  async create(assignmentData) {
    try {
      const pool = await this.getConnection();
      
      // Insert assignment
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, assignmentData.jobId)
        .input('assignedTo', this.sql.VarChar, assignmentData.assignedTo)
        .input('assignedBy', this.sql.VarChar, assignmentData.assignedBy)
        .input('assignedAmount', this.sql.Decimal(18, 2), assignmentData.assignedAmount)
        .input('notes', this.sql.NVarChar, assignmentData.notes || null)
        .query(`
          INSERT INTO PettyCashAssignments (jobId, assignedTo, assignedBy, assignedAmount, notes)
          OUTPUT INSERTED.*
          VALUES (@jobId, @assignedTo, @assignedBy, @assignedAmount, @notes)
        `);
      
      // Update job status
      await pool.request()
        .input('jobId', this.sql.VarChar, assignmentData.jobId)
        .query(`
          UPDATE Jobs 
          SET pettyCashStatus = 'Assigned'
          WHERE jobId = @jobId
        `);
      
      return new PettyCashAssignment(result.recordset[0]);
    } catch (error) {
      console.error('Error creating petty cash assignment:', error);
      throw error;
    }
  }

  async getAll() {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            pca.*,
            j.shipmentCategory,
            j.customerId,
            assignedToUser.fullName as assignedToName,
            assignedByUser.fullName as assignedByName
          FROM PettyCashAssignments pca
          LEFT JOIN Jobs j ON pca.jobId = j.jobId
          LEFT JOIN Users assignedToUser ON pca.assignedTo = assignedToUser.userId
          LEFT JOIN Users assignedByUser ON pca.assignedBy = assignedByUser.userId
          ORDER BY pca.assignedDate DESC
        `);
      
      // Get settlement items for each assignment
      const assignments = await Promise.all(result.recordset.map(async (assignment) => {
        const items = await this.getSettlementItems(assignment.assignmentId);
        return new PettyCashAssignment({ ...assignment, settlementItems: items });
      }));
      
      return assignments;
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }
  }

  // Alias for consistency with other repositories
  async findAll() {
    return this.getAll();
  }

  async getByUser(userId) {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .input('userId', this.sql.VarChar, userId)
        .query(`
          SELECT 
            pca.*,
            j.shipmentCategory,
            j.customerId,
            assignedByUser.fullName as assignedByName
          FROM PettyCashAssignments pca
          LEFT JOIN Jobs j ON pca.jobId = j.jobId
          LEFT JOIN Users assignedByUser ON pca.assignedBy = assignedByUser.userId
          WHERE pca.assignedTo = @userId
          ORDER BY pca.assignedDate DESC
        `);
      
      const assignments = await Promise.all(result.recordset.map(async (assignment) => {
        const items = await this.getSettlementItems(assignment.assignmentId);
        return new PettyCashAssignment({ ...assignment, settlementItems: items });
      }));
      
      return assignments;
    } catch (error) {
      console.error('Error fetching assignments by user:', error);
      throw error;
    }
  }

  async getByJob(jobId) {
    try {
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - jobId:', jobId);
      const pool = await this.getConnection();
      const queryResult = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query(`
          SELECT 
            pca.*,
            j.shipmentCategory,
            assignedToUser.fullName as assignedToName,
            assignedByUser.fullName as assignedByName
          FROM PettyCashAssignments pca
          LEFT JOIN Jobs j ON pca.jobId = j.jobId
          LEFT JOIN Users assignedToUser ON pca.assignedTo = assignedToUser.userId
          LEFT JOIN Users assignedByUser ON pca.assignedBy = assignedByUser.userId
          WHERE pca.jobId = @jobId
          ORDER BY pca.assignedDate DESC
        `);
      
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - result count:', queryResult.recordset.length);
      
      if (queryResult.recordset.length === 0) {
        console.log('MSSQLPettyCashAssignmentRepository.getByJob - No assignment found');
        return null;
      }
      
      const assignment = queryResult.recordset[0];
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - assignment:', assignment);
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - assignmentId:', assignment.assignmentId);
      
      const items = await this.getSettlementItems(assignment.assignmentId);
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - settlement items:', items);
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - settlement items count:', items.length);
      
      const finalResult = new PettyCashAssignment({ ...assignment, settlementItems: items });
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - final result:', finalResult);
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - final result settlementItems:', finalResult.settlementItems);
      
      return finalResult;
    } catch (error) {
      console.error('Error fetching assignment by job:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async getById(assignmentId) {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .query(`
          SELECT 
            pca.*,
            j.shipmentCategory,
            j.customerId,
            assignedToUser.fullName as assignedToName,
            assignedByUser.fullName as assignedByName
          FROM PettyCashAssignments pca
          LEFT JOIN Jobs j ON pca.jobId = j.jobId
          LEFT JOIN Users assignedToUser ON pca.assignedTo = assignedToUser.userId
          LEFT JOIN Users assignedByUser ON pca.assignedBy = assignedByUser.userId
          WHERE pca.assignmentId = @assignmentId
        `);
      
      if (result.recordset.length === 0) return null;
      
      const assignment = result.recordset[0];
      const items = await this.getSettlementItems(assignmentId);
      
      return new PettyCashAssignment({ ...assignment, settlementItems: items });
    } catch (error) {
      console.error('Error fetching assignment by id:', error);
      throw error;
    }
  }

  async getSettlementItems(assignmentId) {
    try {
      const pool = await this.getConnection();
      
      // Check if paidBy column exists
      const columnCheck = await pool.request()
        .query(`
          SELECT COUNT(*) as columnExists
          FROM sys.columns 
          WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
          AND name = 'paidBy'
        `);
      
      const hasPaidByColumn = columnCheck.recordset[0].columnExists > 0;
      
      let query;
      if (hasPaidByColumn) {
        // New query with paidBy column
        query = `
          SELECT 
            si.*,
            u.fullName as paidByName,
            u.email as paidByEmail
          FROM PettyCashSettlementItems si
          LEFT JOIN Users u ON si.paidBy = u.userId
          WHERE si.assignmentId = @assignmentId
          ORDER BY si.settlementItemId
        `;
      } else {
        // Fallback query without paidBy column
        query = `
          SELECT 
            si.*,
            NULL as paidByName,
            NULL as paidByEmail
          FROM PettyCashSettlementItems si
          WHERE si.assignmentId = @assignmentId
          ORDER BY si.settlementItemId
        `;
      }
      
      const result = await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error fetching settlement items:', error);
      throw error;
    }
  }

  async settle(assignmentId, settlementData) {
    try {
      const pool = await this.getConnection();
      const transaction = new this.sql.Transaction(pool);
      
      await transaction.begin();
      
      try {
        const assignment = await this.getById(assignmentId);
        
        // Check if paidBy column exists
        const columnCheck = await transaction.request()
          .query(`
            SELECT COUNT(*) as columnExists
            FROM sys.columns 
            WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
            AND name = 'paidBy'
          `);
        
        const hasPaidByColumn = columnCheck.recordset[0].columnExists > 0;
        
        // Check if this is a partial settlement (incremental)
        const isPartialSettlement = settlementData.partialSettlement === true;
        
        // Insert settlement items (without changing assignment status if partial)
        for (const item of settlementData.items) {
          if (hasPaidByColumn) {
            // New version with paidBy column
            await transaction.request()
              .input('assignmentId', this.sql.Int, assignmentId)
              .input('itemName', this.sql.NVarChar, item.itemName)
              .input('actualCost', this.sql.Decimal(18, 2), item.actualCost)
              .input('isCustomItem', this.sql.Bit, item.isCustomItem || false)
              .input('paidBy', this.sql.VarChar, item.paidBy || assignment.assignedTo)
              .query(`
                INSERT INTO PettyCashSettlementItems (assignmentId, itemName, actualCost, isCustomItem, paidBy)
                VALUES (@assignmentId, @itemName, @actualCost, @isCustomItem, @paidBy)
              `);
          } else {
            // Fallback version without paidBy column
            await transaction.request()
              .input('assignmentId', this.sql.Int, assignmentId)
              .input('itemName', this.sql.NVarChar, item.itemName)
              .input('actualCost', this.sql.Decimal(18, 2), item.actualCost)
              .input('isCustomItem', this.sql.Bit, item.isCustomItem || false)
              .query(`
                INSERT INTO PettyCashSettlementItems (assignmentId, itemName, actualCost, isCustomItem)
                VALUES (@assignmentId, @itemName, @actualCost, @isCustomItem)
              `);
          }
        }
        
        // If NOT partial settlement, mark as settled and update totals
        if (!isPartialSettlement) {
          // Calculate totals from ALL settlement items
          const allItemsResult = await transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .query(`
              SELECT SUM(actualCost) as totalSpent
              FROM PettyCashSettlementItems
              WHERE assignmentId = @assignmentId
            `);
          
          const actualSpent = allItemsResult.recordset[0].totalSpent || 0;
          const assignedAmount = parseFloat(assignment.assignedAmount);
          const balanceAmount = assignedAmount > actualSpent ? assignedAmount - actualSpent : 0;
          const overAmount = actualSpent > assignedAmount ? actualSpent - assignedAmount : 0;
          
          // Update assignment status to Settled
          await transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .input('status', this.sql.NVarChar, 'Settled')
            .input('actualSpent', this.sql.Decimal(18, 2), actualSpent)
            .input('balanceAmount', this.sql.Decimal(18, 2), balanceAmount)
            .input('overAmount', this.sql.Decimal(18, 2), overAmount)
            .query(`
              UPDATE PettyCashAssignments
              SET status = @status,
                  settlementDate = GETDATE(),
                  actualSpent = @actualSpent,
                  balanceAmount = @balanceAmount,
                  overAmount = @overAmount
              WHERE assignmentId = @assignmentId
            `);
          
          // Update job status
          await transaction.request()
            .input('jobId', this.sql.VarChar, assignment.jobId)
            .query(`
              UPDATE Jobs 
              SET pettyCashStatus = 'Settled'
              WHERE jobId = @jobId
            `);
        } else {
          // For partial settlement, just update the actualSpent without changing status
          const allItemsResult = await transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .query(`
              SELECT SUM(actualCost) as totalSpent
              FROM PettyCashSettlementItems
              WHERE assignmentId = @assignmentId
            `);
          
          const actualSpent = allItemsResult.recordset[0].totalSpent || 0;
          
          await transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .input('actualSpent', this.sql.Decimal(18, 2), actualSpent)
            .query(`
              UPDATE PettyCashAssignments
              SET actualSpent = @actualSpent
              WHERE assignmentId = @assignmentId
            `);
        }
        
        await transaction.commit();
        
        return await this.getById(assignmentId);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error settling petty cash:', error);
      throw error;
    }
  }

  async updateStatus(assignmentId, status) {
    try {
      const pool = await this.getConnection();
      await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .input('status', this.sql.NVarChar, status)
        .query(`
          UPDATE PettyCashAssignments
          SET status = @status
          WHERE assignmentId = @assignmentId
        `);
      
      return await this.getById(assignmentId);
    } catch (error) {
      console.error('Error updating assignment status:', error);
      throw error;
    }
  }

  async returnBalance(assignmentId, returnData) {
    try {
      const pool = await this.getConnection();
      await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .input('status', this.sql.NVarChar, 'Returned')
        .query(`
          UPDATE PettyCashAssignments
          SET status = @status
          WHERE assignmentId = @assignmentId
        `);
      
      return await this.getById(assignmentId);
    } catch (error) {
      console.error('Error returning balance:', error);
      throw error;
    }
  }

  async payOverAmount(assignmentId, paymentData) {
    try {
      const pool = await this.getConnection();
      await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .input('status', this.sql.NVarChar, 'Paid')
        .query(`
          UPDATE PettyCashAssignments
          SET status = @status
          WHERE assignmentId = @assignmentId
        `);
      
      return await this.getById(assignmentId);
    } catch (error) {
      console.error('Error paying over amount:', error);
      throw error;
    }
  }
}

module.exports = MSSQLPettyCashAssignmentRepository;
