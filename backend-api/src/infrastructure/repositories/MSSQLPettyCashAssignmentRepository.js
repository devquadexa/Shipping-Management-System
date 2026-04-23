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

      // Ensure groupId column exists
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'groupId')
          ALTER TABLE PettyCashAssignments ADD groupId NVARCHAR(100) NULL;
      `);

      // Ensure status column is wide enough for new status values (e.g. 'Pending Approval / Balance' = 26 chars)
      await pool.request().query(`
        IF EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('PettyCashAssignments') 
            AND name = 'status' 
            AND max_length < 100
        )
          ALTER TABLE PettyCashAssignments ALTER COLUMN status NVARCHAR(100) NOT NULL;
      `);

      // Check if there's a previous assignment with "Full Petty Cash Returned" status
      let groupId = assignmentData.groupId || `${assignmentData.jobId}_${assignmentData.assignedTo}`;
      
      if (!assignmentData.groupId) {
        const lastAssignmentResult = await pool.request()
          .input('jobId', this.sql.VarChar, assignmentData.jobId)
          .input('assignedTo', this.sql.VarChar, assignmentData.assignedTo)
          .query(`
            SELECT TOP 1 status, groupId
            FROM PettyCashAssignments
            WHERE jobId = @jobId AND assignedTo = @assignedTo
            ORDER BY assignedDate DESC
          `);
        
        if (lastAssignmentResult.recordset.length > 0) {
          const lastAssignment = lastAssignmentResult.recordset[0];
          
          // SPECIAL CASE: If the previous assignment was "Full Petty Cash Returned",
          // "Settled / Balance Returned", "Settled / Over Due Collected", or "Settled",
          // create a unique groupId so this becomes an independent group
          if (lastAssignment.status === 'Full Petty Cash Returned' || 
              lastAssignment.status === 'Settled / Balance Returned' || 
              lastAssignment.status === 'Settled / Over Due Collected' ||
              lastAssignment.status === 'Settled') {
            // Generate unique groupId with timestamp to ensure independence
            const timestamp = Date.now();
            groupId = `${assignmentData.jobId}_${assignmentData.assignedTo}_${timestamp}`;
            console.log('create - Settled status detected, creating new independent group:', groupId);
          } else {
            // Otherwise, use existing groupId to keep them together
            groupId = lastAssignment.groupId || `${assignmentData.jobId}_${assignmentData.assignedTo}`;
            console.log('create - Using existing groupId for same job+user:', groupId);
          }
        }
      }
      
      // Insert assignment
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, assignmentData.jobId)
        .input('assignedTo', this.sql.VarChar, assignmentData.assignedTo)
        .input('assignedBy', this.sql.VarChar, assignmentData.assignedBy)
        .input('assignedAmount', this.sql.Decimal(18, 2), assignmentData.assignedAmount)
        .input('notes', this.sql.NVarChar, assignmentData.notes || null)
        .input('groupId', this.sql.NVarChar, groupId)
        .query(`
          INSERT INTO PettyCashAssignments (jobId, assignedTo, assignedBy, assignedAmount, notes, groupId)
          OUTPUT INSERTED.*
          VALUES (@jobId, @assignedTo, @assignedBy, @assignedAmount, @notes, @groupId)
        `);
      
      console.log('create - New assignment created with groupId:', groupId);
      
      // Update job status only if not already in a settled state
      // Preserve "Settled" status since settle() will recalculate it after all assignments are settled
      await pool.request()
        .input('jobId', this.sql.VarChar, assignmentData.jobId)
        .query(`
          UPDATE Jobs 
          SET pettyCashStatus = 'Assigned'
          WHERE jobId = @jobId 
            AND pettyCashStatus IS NULL
        `);
      
      return new PettyCashAssignment({ ...result.recordset[0], groupId });
    } catch (error) {
      console.error('Error creating petty cash assignment:', error);
      throw error;
    }
  }

  async getAll() {
    try {
      const pool = await this.getConnection();

      // Ensure status column is wide enough for new status values
      await pool.request().query(`
        IF EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('PettyCashAssignments') 
            AND name = 'status' 
            AND max_length < 100
        )
          ALTER TABLE PettyCashAssignments ALTER COLUMN status NVARCHAR(100) NOT NULL;
      `);

      const result = await pool.request()
        .query(`
          SELECT 
            pca.assignmentId,
            pca.jobId,
            pca.assignedTo,
            pca.assignedBy,
            pca.assignedAmount,
            pca.assignedDate,
            pca.status,
            pca.settlementDate,
            pca.actualSpent,
            pca.balanceAmount,
            pca.overAmount,
            pca.notes,
            pca.parentAssignmentId,
            pca.isMainAssignment,
            ISNULL(pca.groupId, pca.jobId + '_' + pca.assignedTo) as groupId,
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
            pca.assignmentId,
            pca.jobId,
            pca.assignedTo,
            pca.assignedBy,
            pca.assignedAmount,
            pca.assignedDate,
            pca.status,
            pca.settlementDate,
            pca.actualSpent,
            pca.balanceAmount,
            pca.overAmount,
            pca.notes,
            pca.parentAssignmentId,
            pca.isMainAssignment,
            ISNULL(pca.groupId, pca.jobId + '_' + pca.assignedTo) as groupId,
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

  // Alias for consistency with other repositories
  async findById(assignmentId) {
    return this.getById(assignmentId);
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
            si.hasBill,
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
          
          // For predefined items, lock by assignment scope:
          // if an item exists in another assignment for the same job, this assignment cannot overwrite it.
          if (!item.isCustomItem) {
            const existingPredefinedItem = await transaction.request()
              .input('jobId', this.sql.VarChar, assignment.jobId)
              .input('assignmentId', this.sql.Int, assignmentId)
              .input('itemName', this.sql.NVarChar, item.itemName)
              .query(`
                SELECT si.settlementItemId, si.assignmentId, si.paidBy, u.fullName as paidByName
                FROM PettyCashSettlementItems si
                INNER JOIN PettyCashAssignments pca ON si.assignmentId = pca.assignmentId
                LEFT JOIN Users u ON si.paidBy = u.userId
                WHERE pca.jobId = @jobId 
                  AND si.itemName = @itemName 
                  AND si.isCustomItem = 0
                  AND si.assignmentId <> @assignmentId
              `);
            
            if (existingPredefinedItem.recordset.length > 0) {
              const existingItem = existingPredefinedItem.recordset[0];
              console.log('settle - predefined item already exists:', existingItem);

              // Item already entered in another assignment - skip this item.
              console.log(`settle - skipping predefined item '${item.itemName}' - already entered in assignment ${existingItem.assignmentId} by ${existingItem.paidByName || existingItem.paidBy}`);
              continue;
            }

            // Upsert behavior within the same assignment: replace existing value for this item.
            await transaction.request()
              .input('assignmentId', this.sql.Int, assignmentId)
              .input('itemName', this.sql.NVarChar, item.itemName)
              .query(`
                DELETE FROM PettyCashSettlementItems
                WHERE assignmentId = @assignmentId
                  AND itemName = @itemName
                  AND isCustomItem = 0
              `);
          } else {
            // Fix for custom item duplication:
            // When settling a group, the same custom items might be sent in multiple times.
            // We should clear the existing custom items for THIS assignment before re-inserting.
            await transaction.request()
              .input('assignmentId', this.sql.Int, assignmentId)
              .input('itemName', this.sql.NVarChar, item.itemName)
              .query(`
                DELETE FROM PettyCashSettlementItems
                WHERE assignmentId = @assignmentId
                  AND itemName = @itemName
                  AND isCustomItem = 1
              `);
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
        // For parent assignments, aggregate settlement items from all sub-assignments
        let totalSpentResult;
        
        if (assignment.isMainAssignment) {
          // This is a parent assignment - get all sub-assignment IDs
          console.log('settle - parent assignment detected, fetching sub-assignments');
          const subAssignmentsResult = await transaction.request()
            .input('parentAssignmentId', this.sql.Int, assignmentId)
            .query(`
              SELECT assignmentId FROM PettyCashAssignments 
              WHERE parentAssignmentId = @parentAssignmentId
            `);
          
          const subAssignmentIds = subAssignmentsResult.recordset.map(r => r.assignmentId);
          console.log('settle - sub-assignment IDs:', subAssignmentIds);
          
          if (subAssignmentIds.length > 0) {
            // Sum settlement items from all sub-assignments
            const placeholders = subAssignmentIds.map((_, i) => `@id${i}`).join(',');
            let query = `SELECT SUM(actualCost) as totalSpent FROM PettyCashSettlementItems WHERE assignmentId IN (${placeholders})`;
            
            let req = transaction.request();
            subAssignmentIds.forEach((id, i) => {
              req = req.input(`id${i}`, this.sql.Int, id);
            });
            
            totalSpentResult = await req.query(query);
            console.log('settle - parent assignment total from all sub-assignments:', totalSpentResult.recordset[0]);
          } else {
            // No sub-assignments, just get the parent's own items
            totalSpentResult = await transaction.request()
              .input('assignmentId', this.sql.Int, assignmentId)
              .query(`
                SELECT SUM(actualCost) as totalSpent
                FROM PettyCashSettlementItems
                WHERE assignmentId = @assignmentId
              `);
            console.log('settle - parent assignment has no sub-assignments, using own items');
          }
        } else {
          // This is a sub-assignment or standalone assignment - just get its own items
          totalSpentResult = await transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .query(`
              SELECT SUM(actualCost) as totalSpent
              FROM PettyCashSettlementItems
              WHERE assignmentId = @assignmentId
            `);
          console.log('settle - sub-assignment or standalone, using own items');
        }
        
        const actualSpent = parseFloat(totalSpentResult.recordset[0].totalSpent) || 0;
        
        // For parent assignments, also aggregate the assigned amounts from all sub-assignments
        let assignedAmount = parseFloat(assignment.assignedAmount);
        
        if (assignment.isMainAssignment) {
          const subAssignmentsResult = await transaction.request()
            .input('parentAssignmentId', this.sql.Int, assignmentId)
            .query(`
              SELECT SUM(assignedAmount) as totalAssigned FROM PettyCashAssignments 
              WHERE parentAssignmentId = @parentAssignmentId
            `);
          
          const subAssignmentsTotal = parseFloat(subAssignmentsResult.recordset[0].totalAssigned) || 0;
          console.log('settle - parent assignment sub-assignments total assigned:', subAssignmentsTotal);
          
          if (subAssignmentsTotal > 0) {
            assignedAmount = subAssignmentsTotal;
            console.log('settle - using aggregated assigned amount from sub-assignments:', assignedAmount);
          }
        }
        
        const balanceAmount = assignedAmount > actualSpent ? assignedAmount - actualSpent : 0;
        const overAmount = actualSpent > assignedAmount ? actualSpent - assignedAmount : 0;
        
        console.log('settle - calculated totals:', { 
          actualSpent, 
          assignedAmount, 
          balanceAmount, 
          overAmount,
          actualSpentType: typeof actualSpent,
          assignedAmountType: typeof assignedAmount,
          comparison: assignedAmount > actualSpent ? 'assigned > spent (BALANCE)' : 'spent > assigned (OVERDUE)'
        });
        
        // Determine status automatically based on balance/overdue
        // Use Number() to ensure proper comparison
        let newStatus = 'Settled';
        const balanceNum = Number(balanceAmount);
        const overNum = Number(overAmount);
        const actualSpentNum = Number(actualSpent);
        const assignedAmountNum = Number(assignedAmount);
        
        // Check for Full Petty Cash Returned: no items settled and full amount is being returned
        if (actualSpentNum === 0 && balanceNum === assignedAmountNum) {
          newStatus = 'Full Petty Cash Returned';
          console.log('settle - Setting status to Full Petty Cash Returned (no items paid, full cash returned)');
        } else if (balanceNum > 0) {
          newStatus = 'Balance To Be Return';
          console.log('settle - Setting status to Balance To Be Return, balanceNum:', balanceNum);
        } else if (overNum > 0) {
          newStatus = 'Over Due';
          console.log('settle - Setting status to Over Due, overNum:', overNum);
        }
        
        console.log('settle - auto-determined status:', newStatus);
        
        // Update assignment with calculated amounts and automatic status
        const updateResult = await transaction.request()
          .input('assignmentId', this.sql.Int, assignmentId)
          .input('status', this.sql.NVarChar, newStatus)
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
        
        // Update job status only if ALL assignments for this job are settled or in final states
        const unsettledCount = await transaction.request()
          .input('jobId', this.sql.VarChar, assignment.jobId)
          .query(`
            SELECT COUNT(*) as unsettledCount
            FROM PettyCashAssignments
            WHERE jobId = @jobId 
              AND status NOT IN (
                'Settled', 
                'Balance To Be Return', 
                'Over Due', 
                'Pending Approval / Balance', 
                'Pending Approval / Over Due', 
                'Settled / Balance Returned', 
                'Settled / Over Due Collected', 
                'Full Petty Cash Returned',
                'Closed',
                'Settled/Approved', 
                'Settled/Rejected', 
                'Balance Returned', 
                'Overdue Collected'
              )
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

  // Recalculate and fix status for a settled assignment based on balanceAmount/overAmount
  async recalculateStatus(assignmentId) {
    try {
      const pool = await this.getConnection();
      const result = await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .query(`
          SELECT assignmentId, status, assignedAmount, actualSpent, balanceAmount, overAmount
          FROM PettyCashAssignments
          WHERE assignmentId = @assignmentId
        `);

      if (!result.recordset.length) throw new Error('Assignment not found');

      const row = result.recordset[0];
      const balanceAmount = parseFloat(row.balanceAmount) || 0;
      const overAmount = parseFloat(row.overAmount) || 0;
      const assignedAmount = parseFloat(row.assignedAmount) || 0;
      const actualSpent = parseFloat(row.actualSpent) || 0;

      // Only recalculate if the assignment has been settled (has actualSpent)
      const settledStatuses = ['Settled', 'Balance To Be Return', 'Over Due'];
      if (!settledStatuses.includes(row.status)) {
        return await this.getById(assignmentId);
      }

      let correctStatus = 'Settled';
      if (balanceAmount > 0) {
        correctStatus = 'Balance To Be Return';
      } else if (overAmount > 0) {
        correctStatus = 'Over Due';
      }

      // Also recalculate from scratch if amounts seem wrong
      if (actualSpent > 0 && assignedAmount > 0) {
        const recalcBalance = assignedAmount > actualSpent ? assignedAmount - actualSpent : 0;
        const recalcOver = actualSpent > assignedAmount ? actualSpent - assignedAmount : 0;
        if (recalcBalance > 0) correctStatus = 'Balance To Be Return';
        else if (recalcOver > 0) correctStatus = 'Over Due';
        else correctStatus = 'Settled';

        // Update amounts too if they were wrong
        await pool.request()
          .input('assignmentId', this.sql.Int, assignmentId)
          .input('status', this.sql.NVarChar, correctStatus)
          .input('balanceAmount', this.sql.Decimal(18, 2), recalcBalance)
          .input('overAmount', this.sql.Decimal(18, 2), recalcOver)
          .query(`
            UPDATE PettyCashAssignments
            SET status = @status, balanceAmount = @balanceAmount, overAmount = @overAmount
            WHERE assignmentId = @assignmentId
          `);
      } else {
        await pool.request()
          .input('assignmentId', this.sql.Int, assignmentId)
          .input('status', this.sql.NVarChar, correctStatus)
          .query(`
            UPDATE PettyCashAssignments
            SET status = @status
            WHERE assignmentId = @assignmentId
          `);
      }

      return await this.getById(assignmentId);
    } catch (error) {
      console.error('Error recalculating assignment status:', error);
      throw error;
    }
  }

  // Close all assignments for a job after invoice is generated
  async closeAllByJob(jobId) {
    try {
      const pool = await this.getConnection();
      await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query(`
          UPDATE PettyCashAssignments
          SET status = 'Closed'
          WHERE jobId = @jobId
            AND status NOT IN ('Closed')
        `);
    } catch (error) {
      console.error('Error closing petty cash assignments for job:', error);
      throw error;
    }
  }

  // On approval: set final status only — amount stays for display purposes
  async updateStatusAndClearAmount(assignmentId, status, settlementType) {
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
  async getByJobAndUser(jobId, userId, assignmentId = null) {
    try {
      console.log('MSSQLPettyCashAssignmentRepository.getByJobAndUser - jobId:', jobId, 'userId:', userId, 'assignmentId:', assignmentId);
      const pool = await this.getConnection();
      const assignmentRequest = pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .input('userId', this.sql.VarChar, userId);

      let queryResult;
      if (assignmentId) {
        queryResult = await assignmentRequest
          .input('assignmentId', this.sql.Int, assignmentId)
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
          WHERE pca.jobId = @jobId AND pca.assignedTo = @userId AND pca.assignmentId = @assignmentId
          ORDER BY pca.assignedDate DESC
        `);
      } else {
        queryResult = await assignmentRequest.query(`
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
      }
      
      console.log('MSSQLPettyCashAssignmentRepository.getByJobAndUser - result count:', queryResult.recordset.length);
      
      if (queryResult.recordset.length === 0) {
        console.log('MSSQLPettyCashAssignmentRepository.getByJobAndUser - No assignment found for this user');
        return null;
      }
      
      const assignment = queryResult.recordset[0];
      
      // Get ONLY this user's settlement items (for calculating their Total Spent)
      const userOwnItems = await this.getSettlementItems(assignment.assignmentId);
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - user's own items:`, userOwnItems);
      
      // Get predefined items from OTHER assignments for the same job (read-only in current assignment)
      const allPredefinedItems = await pool.request()
        .input('jobId', this.sql.VarChar, jobId)
        .input('assignmentId', this.sql.Int, assignment.assignmentId)
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
            AND si.assignmentId <> @assignmentId
            AND si.isCustomItem = 0
          ORDER BY si.settlementItemId
        `);
      
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - ALL items count:`, allPredefinedItems.recordset.length);
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - ALL items:`, JSON.stringify(allPredefinedItems.recordset, null, 2));
      
      // Separate items into two categories:
      // 1. Current assignment items (editable, counted in Total Spent)
      // 2. Other assignment predefined items (read-only, NOT counted in Total Spent)
      
      const userOwnItemIds = new Set(userOwnItems.map(item => item.settlementItemId));
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - user's own item IDs:`, Array.from(userOwnItemIds));
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - current userId:`, userId);
      
      const userEditableItems = userOwnItems.map(item => ({
        ...item,
        isReadOnly: false,
        isOwnItem: true,
        countInTotalSpent: true  // Only user's own items count
      }));
      
      const otherAssignmentsPredefinedItems = allPredefinedItems.recordset
        .filter(item => {
          const isNotUserItem = !userOwnItemIds.has(item.settlementItemId);
          const isPredefined = item.isCustomItem === 0 || item.isCustomItem === false;
          
          console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - filtering item: ${item.itemName}, paidBy: ${item.paidBy}, isNotUserItem: ${isNotUserItem}, isPredefined: ${isPredefined}`);
          
          return isNotUserItem && isPredefined;
        })
        .map(item => ({
          ...item,
          isReadOnly: true,
          isOwnItem: false,
          countInTotalSpent: false  // Other assignment items do NOT count in this assignment's Total Spent
        }));
      
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - other assignment predefined items count:`, otherAssignmentsPredefinedItems.length);
      console.log(`MSSQLPettyCashAssignmentRepository.getByJobAndUser - other assignment predefined items:`, JSON.stringify(otherAssignmentsPredefinedItems, null, 2));
      
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
        readOnlyPredefinedItems: otherAssignmentsPredefinedItems  // Separate array for read-only reference
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
  
  // Update settlement item
  async updateSettlementItem(itemId, itemName, actualCost) {
    try {
      const pool = await this.getConnection();
      
      const result = await pool.request()
        .input('itemId', this.sql.Int, itemId)
        .input('itemName', this.sql.NVarChar, itemName)
        .input('actualCost', this.sql.Decimal(18, 2), actualCost)
        .query(`
          UPDATE PettyCashSettlementItems
          SET itemName = @itemName, actualCost = @actualCost
          OUTPUT INSERTED.*
          WHERE settlementItemId = @itemId
        `);
      
      if (result.recordset.length === 0) {
        throw new Error('Settlement item not found');
      }
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error updating settlement item:', error);
      throw error;
    }
  }
  
  // Delete settlement item
  async deleteSettlementItem(itemId) {
    try {
      const pool = await this.getConnection();
      
      await pool.request()
        .input('itemId', this.sql.Int, itemId)
        .query(`
          DELETE FROM PettyCashSettlementItems
          WHERE settlementItemId = @itemId
        `);
      
      return true;
    } catch (error) {
      console.error('Error deleting settlement item:', error);
      throw error;
    }
  }
  
  // Recalculate assignment totals after edit/delete
  async recalculateAssignmentTotals(assignmentId) {
    try {
      const pool = await this.getConnection();
      
      // Get sum of settlement items
      const sumResult = await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .query(`
          SELECT ISNULL(SUM(actualCost), 0) as totalSpent
          FROM PettyCashSettlementItems
          WHERE assignmentId = @assignmentId
        `);
      
      const actualSpent = sumResult.recordset[0].totalSpent;
      
      // Get assigned amount
      const assignmentResult = await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .query(`
          SELECT assignedAmount
          FROM PettyCashAssignments
          WHERE assignmentId = @assignmentId
        `);
      
      const assignedAmount = assignmentResult.recordset[0].assignedAmount;
      
      // Calculate balance/over amounts
      const balanceAmount = Math.max(0, assignedAmount - actualSpent);
      const overAmount = Math.max(0, actualSpent - assignedAmount);
      
      // Determine correct status based on amounts
      let newStatus = 'Settled';
      if (balanceAmount > 0) {
        newStatus = 'Balance To Be Return';
      } else if (overAmount > 0) {
        newStatus = 'Over Due';
      }
      
      // Update assignment with recalculated amounts AND status
      await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .input('actualSpent', this.sql.Decimal(18, 2), actualSpent)
        .input('balanceAmount', this.sql.Decimal(18, 2), balanceAmount)
        .input('overAmount', this.sql.Decimal(18, 2), overAmount)
        .input('status', this.sql.NVarChar, newStatus)
        .query(`
          UPDATE PettyCashAssignments
          SET actualSpent = @actualSpent,
              balanceAmount = @balanceAmount,
              overAmount = @overAmount,
              status = @status
          WHERE assignmentId = @assignmentId
        `);
      
      return { actualSpent, balanceAmount, overAmount, status: newStatus };
    } catch (error) {
      console.error('Error recalculating assignment totals:', error);
      throw error;
    }
  }

  // ===== PARENT-CHILD ASSIGNMENT METHODS =====
  
  async createSubAssignment(assignmentData) {
    try {
      const pool = await this.getConnection();
      
      const result = await pool.request()
        .input('jobId', this.sql.VarChar, assignmentData.jobId)
        .input('assignedTo', this.sql.VarChar, assignmentData.assignedTo)
        .input('assignedBy', this.sql.VarChar, assignmentData.assignedBy)
        .input('assignedAmount', this.sql.Decimal(18, 2), assignmentData.assignedAmount)
        .input('notes', this.sql.NVarChar, assignmentData.notes || null)
        .input('groupId', this.sql.NVarChar, assignmentData.groupId)
        .input('parentAssignmentId', this.sql.Int, assignmentData.parentAssignmentId)
        .input('isMainAssignment', this.sql.Bit, 0)
        .query(`
          INSERT INTO PettyCashAssignments (
            jobId, assignedTo, assignedBy, assignedAmount, notes, groupId, 
            parentAssignmentId, isMainAssignment
          )
          OUTPUT INSERTED.*
          VALUES (
            @jobId, @assignedTo, @assignedBy, @assignedAmount, @notes, @groupId,
            @parentAssignmentId, @isMainAssignment
          )
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating sub-assignment:', error);
      throw error;
    }
  }

  async getMainAssignments(userId = null) {
    try {
      const pool = await this.getConnection();
      
      let query = `
        SELECT 
          pca.*,
          ISNULL(pca.groupId, pca.jobId + '_' + pca.assignedTo) as groupId,
          j.shipmentCategory,
          j.customerId,
          assignedToUser.fullName as assignedToName,
          assignedByUser.fullName as assignedByName
        FROM PettyCashAssignments pca
        LEFT JOIN Jobs j ON pca.jobId = j.jobId
        LEFT JOIN Users assignedToUser ON pca.assignedTo = assignedToUser.userId
        LEFT JOIN Users assignedByUser ON pca.assignedBy = assignedByUser.userId
        WHERE pca.isMainAssignment = 1
      `;
      
      if (userId) {
        query += ` AND pca.assignedTo = @userId`;
      }
      
      query += ` ORDER BY pca.assignedDate DESC`;
      
      const request = pool.request();
      if (userId) {
        request.input('userId', this.sql.VarChar, userId);
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error fetching main assignments:', error);
      throw error;
    }
  }

  async getSubAssignments(parentAssignmentId) {
    try {
      const pool = await this.getConnection();
      
      const result = await pool.request()
        .input('parentAssignmentId', this.sql.Int, parentAssignmentId)
        .query(`
          SELECT 
            pca.*,
            assignedByUser.fullName as assignedByName
          FROM PettyCashAssignments pca
          LEFT JOIN Users assignedByUser ON pca.assignedBy = assignedByUser.userId
          WHERE pca.parentAssignmentId = @parentAssignmentId
          ORDER BY pca.assignedDate ASC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error fetching sub-assignments:', error);
      throw error;
    }
  }

  async getTotalAssignedAmount(mainAssignmentId) {
    try {
      const pool = await this.getConnection();
      
      const result = await pool.request()
        .input('mainAssignmentId', this.sql.Int, mainAssignmentId)
        .query(`
          SELECT 
            SUM(assignedAmount) as totalAmount
          FROM PettyCashAssignments
          WHERE assignmentId = @mainAssignmentId 
             OR parentAssignmentId = @mainAssignmentId
        `);
      
      return parseFloat(result.recordset[0].totalAmount || 0);
    } catch (error) {
      console.error('Error calculating total assigned amount:', error);
      throw error;
    }
  }

  /**
   * Update assignment status and clear the resolved amount after management approval.
   * settlementType: 'BALANCE_RETURN' clears balanceAmount, 'OVERDUE_COLLECTION' clears overAmount.
   */
  async updateStatusAndClearAmount(assignmentId, newStatus, settlementType) {
    try {
      const pool = await this.getConnection();
      
      let clearField = '';
      if (settlementType === 'BALANCE_RETURN') {
        clearField = ', balanceAmount = 0';
      } else if (settlementType === 'OVERDUE_COLLECTION') {
        clearField = ', overAmount = 0';
      }

      await pool.request()
        .input('assignmentId', this.sql.Int, assignmentId)
        .input('status', this.sql.NVarChar, newStatus)
        .query(`
          UPDATE PettyCashAssignments
          SET status = @status${clearField}
          WHERE assignmentId = @assignmentId
        `);

      return await this.getById(assignmentId);
    } catch (error) {
      console.error('Error in updateStatusAndClearAmount:', error);
      throw error;
    }
  }
}

module.exports = MSSQLPettyCashAssignmentRepository;
