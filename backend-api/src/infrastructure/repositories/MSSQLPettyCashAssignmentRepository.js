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
      
      // Collect ALL settlement items from ALL assignments for this job
      let allSettlementItems = [];
      
      for (const assignment of queryResult.recordset) {
        const items = await this.getSettlementItems(assignment.assignmentId);
        console.log(`MSSQLPettyCashAssignmentRepository.getByJob - assignment ${assignment.assignmentId} items:`, items);
        allSettlementItems = allSettlementItems.concat(items);
      }
      
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - total settlement items:', allSettlementItems.length);
      
      // Return the first assignment (most recent) but with ALL settlement items from all assignments
      const assignment = queryResult.recordset[0];
      const finalResult = new PettyCashAssignment({ ...assignment, settlementItems: allSettlementItems });
      console.log('MSSQLPettyCashAssignmentRepository.getByJob - final result:', finalResult);
      
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
      
      const result = await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .query(`
          SELECT 
            si.settlementItemId,
            si.assignmentId,
            si.itemName,
            si.actualCost,
            si.isCustomItem,
            ISNULL(si.hasBill, 0) as hasBill,
            si.paidBy,
            u.fullName as paidByName,
            u.email as paidByEmail
          FROM PettyCashSettlementItems si
          LEFT JOIN Users u ON si.paidBy = u.userId
          WHERE si.assignmentId = @assignmentId
          ORDER BY si.settlementItemId
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error fetching settlement items:', error);
      throw error;
    }
  }

  async settle(assignmentId, settlementData) {
    try {
      console.log('=== SETTLE START ===');
      console.log('settle - assignmentId:', assignmentId);
      console.log('settle - settlementData:', settlementData);
      
      const pool = await this.getConnection();
      const transaction = new this.sql.Transaction(pool);
      
      await transaction.begin();
      console.log('settle - transaction begun');
      
      try {
        const assignment = await this.getById(assignmentId);
        console.log('settle - fetched assignment:', assignment);
        
        // Verify hasBill column exists before inserting
        const colCheck = await transaction.request().query(`
          SELECT COUNT(*) as cnt FROM sys.columns 
          WHERE object_id = OBJECT_ID('PettyCashSettlementItems') AND name = 'hasBill'
        `);
        const hasBillColExists = colCheck.recordset[0].cnt === 1;
        console.log('settle - hasBill column exists in DB:', hasBillColExists);
        if (!hasBillColExists) {
          console.error('settle - ERROR: hasBill column missing! Running emergency migration...');
          await transaction.request().query(`
            ALTER TABLE PettyCashSettlementItems ADD hasBill BIT NOT NULL DEFAULT 0;
          `);
          console.log('settle - Emergency migration applied: hasBill column added');
        }
        
        // Insert settlement items with validation for predefined items
        for (const item of settlementData.items) {
          console.log('settle - processing item:', item);
          
          // For predefined items, check if already entered by another clerk for this job
          if (!item.isCustomItem) {
            const existingPredefinedItem = await transaction.request()
              .input('jobId', this.sql.VarChar, assignment.jobId)
              .input('itemName', this.sql.NVarChar, item.itemName)
              .query(`
                SELECT si.settlementItemId, si.paidBy, u.fullName as paidByName
                FROM PettyCashSettlementItems si
                INNER JOIN PettyCashAssignments pca ON si.assignmentId = pca.assignmentId
                LEFT JOIN Users u ON si.paidBy = u.userId
                WHERE pca.jobId = @jobId 
                  AND si.itemName = @itemName 
                  AND si.isCustomItem = 0
              `);
            
            if (existingPredefinedItem.recordset.length > 0) {
              const existingItem = existingPredefinedItem.recordset[0];
              console.log('settle - predefined item already exists:', existingItem);
              
              // If the item was entered by the same user, allow update (re-settlement)
              if (existingItem.paidBy === (item.paidBy || assignment.assignedTo)) {
                console.log('settle - allowing re-settlement by same user');
                // Delete the existing item first, then insert the new one
                await transaction.request()
                  .input('settlementItemId', this.sql.Int, existingItem.settlementItemId)
                  .query(`DELETE FROM PettyCashSettlementItems WHERE settlementItemId = @settlementItemId`);
              } else {
                // Item already entered by another clerk - skip this item
                console.log(`settle - skipping predefined item '${item.itemName}' - already entered by ${existingItem.paidByName}`);
                continue;
              }
            }
          }
          
          console.log('settle - inserting item:', item.itemName, '| hasBill:', item.hasBill);
          const hasBillValue = (item.hasBill === true || item.hasBill === 1 || item.hasBill === 'true') ? 1 : 0;
          console.log('settle - hasBillValue resolved to:', hasBillValue, '(type:', typeof hasBillValue, ')');

          const insertReq = transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .input('itemName', this.sql.NVarChar, item.itemName)
            .input('actualCost', this.sql.Decimal(18, 2), item.actualCost)
            .input('isCustomItem', this.sql.Bit, item.isCustomItem ? 1 : 0)
            .input('paidBy', this.sql.VarChar, item.paidBy || assignment.assignedTo)
            .input('hasBill', this.sql.Bit, hasBillValue);

          const result = await insertReq.query(`
            INSERT INTO PettyCashSettlementItems (assignmentId, itemName, actualCost, isCustomItem, paidBy, hasBill)
            OUTPUT INSERTED.settlementItemId, INSERTED.hasBill
            VALUES (@assignmentId, @itemName, @actualCost, @isCustomItem, @paidBy, @hasBill)
          `);
          console.log('settle - item inserted, OUTPUT hasBill:', result.recordset[0]?.hasBill, '| rowsAffected:', result.rowsAffected);
        }
        
        // ALWAYS calculate totals and mark as settled
        // Each assignment is independent - when a Waff Clerk settles their assignment, it's complete
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
        
        console.log('settle - calculated totals:', { actualSpent, assignedAmount, balanceAmount, overAmount });
        
        // Update assignment status to Settled
        const updateResult = await transaction.request()
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
        
        console.log('settle - assignment updated, rowsAffected:', updateResult.rowsAffected);
        
        // Update job status only if ALL assignments for this job are settled
        const unsettledCount = await transaction.request()
          .input('jobId', this.sql.VarChar, assignment.jobId)
          .query(`
            SELECT COUNT(*) as unsettledCount
            FROM PettyCashAssignments
            WHERE jobId = @jobId AND status NOT IN ('Settled', 'Settled/Approved', 'Settled/Rejected', 'Balance Returned', 'Overdue Collected')
          `);
        
        console.log('settle - unsettledCount:', unsettledCount.recordset[0].unsettledCount);
        
        if (unsettledCount.recordset[0].unsettledCount === 0) {
          // All assignments settled, update job status
          const jobUpdateResult = await transaction.request()
            .input('jobId', this.sql.VarChar, assignment.jobId)
            .query(`
              UPDATE Jobs 
              SET pettyCashStatus = 'Settled'
              WHERE jobId = @jobId
            `);
          console.log('settle - job updated, rowsAffected:', jobUpdateResult.rowsAffected);
        }
        
        await transaction.commit();
        console.log('settle - transaction committed');
        
        // Return updated assignment
        const updatedAssignment = await this.getById(assignmentId);
        console.log('settle - returning updated assignment:', updatedAssignment);
        console.log('=== SETTLE END ===');
        return updatedAssignment;
      } catch (error) {
        console.error('settle - error in transaction, rolling back:', error);
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in settle:', error);
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

  /**
   * Get petty cash assignment for a specific job and user
   * Each clerk sees ONLY their own spending, but can view predefined items from others as read-only
   */
  async getByJobAndUser(jobId, userId) {
    try {
      console.log('MSSQLPettyCashAssignmentRepository.getByJobAndUser - jobId:', jobId, 'userId:', userId);
      const pool = await this.getConnection();
      const queryResult = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .input('userId', this.sql.VarChar, userId)
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
          WHERE pca.jobId = @jobId AND pca.assignedTo = @userId
          ORDER BY pca.assignedDate DESC
        `);
      
      console.log('MSSQLPettyCashAssignmentRepository.getByJobAndUser - result count:', queryResult.recordset.length);
      
      if (queryResult.recordset.length === 0) {
        console.log('MSSQLPettyCashAssignmentRepository.getByJobAndUser - No assignment found for this user');
        return null;
      }
      
      const assignment = queryResult.recordset[0];
      
      // Get ONLY this user's settlement items (for calculating their Total Spent)
      const userOwnItems = await this.getSettlementItems(assignment.assignmentId);
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - user's own items:`, userOwnItems);
      
      // Get ALL predefined items from ALL assignments for this job (for read-only reference)
      const allPredefinedItems = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query(`
          SELECT 
            si.*,
            u.fullName as paidByName,
            u.email as paidByEmail,
            pca.assignedTo as assignmentUserId
          FROM PettyCashSettlementItems si
          LEFT JOIN Users u ON si.paidBy = u.userId
          INNER JOIN PettyCashAssignments pca ON si.assignmentId = pca.assignmentId
          WHERE pca.jobId = @jobId
          ORDER BY si.settlementItemId
        `);
      
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - ALL items count:`, allPredefinedItems.recordset.length);
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - ALL items:`, JSON.stringify(allPredefinedItems.recordset, null, 2));
      
      // Separate items into two categories:
      // 1. User's own items (editable, counted in Total Spent)
      // 2. Other clerks' predefined items (read-only, NOT counted in Total Spent)
      
      const userOwnItemIds = new Set(userOwnItems.map(item => item.settlementItemId));
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - user's own item IDs:`, Array.from(userOwnItemIds));
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - current userId:`, userId);
      
      const userEditableItems = userOwnItems.map(item => ({
        ...item,
        isReadOnly: false,
        isOwnItem: true,
        countInTotalSpent: true  // Only user's own items count
      }));
      
      // Filter for items that are:
      // 1. NOT entered by the current user (paidBy !== userId)
      // 2. NOT already in the user's own items
      // 3. Are predefined items (isCustomItem = 0 or false)
      const otherClerksPredefinedItems = allPredefinedItems.recordset
        .filter(item => {
          const isOtherClerk = item.paidBy && item.paidBy !== userId;
          const isNotUserItem = !userOwnItemIds.has(item.settlementItemId);
          const isPredefined = item.isCustomItem === 0 || item.isCustomItem === false;
          
          console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - filtering item: ${item.itemName}, paidBy: ${item.paidBy}, userId: ${userId}, isOtherClerk: ${isOtherClerk}, isNotUserItem: ${isNotUserItem}, isPredefined: ${isPredefined}`);
          
          return isOtherClerk && isNotUserItem && isPredefined;
        })
        .map(item => ({
          ...item,
          isReadOnly: true,
          isOwnItem: false,
          countInTotalSpent: false  // Other clerks' items do NOT count in this user's Total Spent
        }));
      
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - other clerks' predefined items count:`, otherClerksPredefinedItems.length);
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - other clerks' predefined items:`, JSON.stringify(otherClerksPredefinedItems, null, 2));
      
      // Calculate Total Spent based ONLY on user's own items
      const userOwnTotalSpent = userEditableItems.reduce((sum, item) => sum + parseFloat(item.actualCost || 0), 0);
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - user's own total spent:`, userOwnTotalSpent);
      
      // Override the actualSpent to reflect only user's own spending
      const assignmentWithCorrectSpent = {
        ...assignment,
        actualSpent: userOwnTotalSpent,
        balanceAmount: parseFloat(assignment.assignedAmount) - userOwnTotalSpent,
        overAmount: userOwnTotalSpent > parseFloat(assignment.assignedAmount) ? userOwnTotalSpent - parseFloat(assignment.assignedAmount) : 0,
        settlementItems: userEditableItems,  // ONLY user's own items for Total Spent calculation
        readOnlyPredefinedItems: otherClerksPredefinedItems  // Separate array for read-only reference
      };
      
      const finalResult = new PettyCashAssignment(assignmentWithCorrectSpent);
      console.log('MSSQLPettyCashAssignmentRepository.getByJobAndUser - final result:', finalResult);
      
      return finalResult;
    } catch (error) {
      console.error('Error fetching assignment by job and user:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get ALL petty cash assignments for a job (for Invoicing)
   * Returns all assignments with all their settlement items
   */
  async getAllByJob(jobId) {
    try {
      console.log('MSSQLPettyCashAssignmentRepository.getAllByJob - jobId:', jobId);
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
      
      console.log('MSSQLPettyCashAssignmentRepository.getAllByJob - result count:', queryResult.recordset.length);
      
      // Get settlement items for each assignment
      const assignments = await Promise.all(queryResult.recordset.map(async (assignment) => {
        const settlementItems = await this.getSettlementItems(assignment.assignmentId);
        return new PettyCashAssignment({ ...assignment, settlementItems });
      }));
      
      console.log('MSSQLPettyCashAssignmentRepository.getAllByJob - returning assignments:', assignments.length);
      
      return assignments;
    } catch (error) {
      console.error('Error fetching all assignments by job:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
}

module.exports = MSSQLPettyCashAssignmentRepository;
