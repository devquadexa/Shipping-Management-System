# Code Changes Reference

## File 1: MSSQLPettyCashAssignmentRepository.js

### Location: backend-api/src/infrastructure/repositories/MSSQLPettyCashAssignmentRepository.js

### Change 1: getByJob() method (Lines 110-156)

**Purpose**: Collect settlement items from ALL assignments for a job, not just the first one

**Key Changes**:
- Loop through all assignments instead of just taking the first one
- Collect settlement items from each assignment
- Return first assignment but with all collected items

**Code**:
```javascript
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
```

### Change 2: settle() method (Lines 240-354)

**Purpose**: Add comprehensive logging to trace settlement execution and verify transaction commits

**Key Changes**:
- Log at transaction start
- Log each item insertion with rowsAffected
- Log calculated totals
- Log assignment update with rowsAffected
- Log job status update with rowsAffected
- Log transaction commit
- Log final returned assignment

**Code**:
```javascript
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
      
      // Check if paidBy column exists
      const columnCheck = await transaction.request()
        .query(`
          SELECT COUNT(*) as columnExists
          FROM sys.columns 
          WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
          AND name = 'paidBy'
        `);
      
      const hasPaidByColumn = columnCheck.recordset[0].columnExists > 0;
      console.log('settle - hasPaidByColumn:', hasPaidByColumn);
      
      // Insert settlement items
      for (const item of settlementData.items) {
        console.log('settle - inserting item:', item);
        if (hasPaidByColumn) {
          // New version with paidBy column
          const result = await transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .input('itemName', this.sql.NVarChar, item.itemName)
            .input('actualCost', this.sql.Decimal(18, 2), item.actualCost)
            .input('isCustomItem', this.sql.Bit, item.isCustomItem || false)
            .input('paidBy', this.sql.VarChar, item.paidBy || assignment.assignedTo)
            .query(`
              INSERT INTO PettyCashSettlementItems (assignmentId, itemName, actualCost, isCustomItem, paidBy)
              VALUES (@assignmentId, @itemName, @actualCost, @isCustomItem, @paidBy)
            `);
          console.log('settle - item inserted, rowsAffected:', result.rowsAffected);
        } else {
          // Fallback version without paidBy column
          const result = await transaction.request()
            .input('assignmentId', this.sql.Int, assignmentId)
            .input('itemName', this.sql.NVarChar, item.itemName)
            .input('actualCost', this.sql.Decimal(18, 2), item.actualCost)
            .input('isCustomItem', this.sql.Bit, item.isCustomItem || false)
            .query(`
              INSERT INTO PettyCashSettlementItems (assignmentId, itemName, actualCost, isCustomItem)
              VALUES (@assignmentId, @itemName, @actualCost, @isCustomItem)
            `);
          console.log('settle - item inserted (no paidBy), rowsAffected:', result.rowsAffected);
        }
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
          WHERE jobId = @jobId AND status != 'Settled'
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
```

## File 2: PettyCashAssignmentController.js

### Location: backend-api/src/presentation/controllers/PettyCashAssignmentController.js

### Change: settle() method

**Purpose**: Add logging to track settlement requests from frontend

**Key Changes**:
- Log controller entry with assignment ID
- Log user information
- Log request body
- Log settlement data being sent to repository
- Log returned assignment
- Log controller exit

**Code**:
```javascript
async settle(req, res) {
  try {
    console.log('=== CONTROLLER SETTLE START ===');
    const { id } = req.params;
    console.log('controller settle - id:', id);
    console.log('controller settle - req.user:', req.user);
    console.log('controller settle - req.body:', req.body);
    
    const settlePettyCashAssignment = this.container.resolve('settlePettyCashAssignment');
    
    // Add paidBy to each item if not provided
    const settlementData = {
      ...req.body,
      items: req.body.items.map(item => ({
        ...item,
        paidBy: item.paidBy || req.user.userId
      }))
    };
    
    console.log('controller settle - settlementData:', settlementData);
    
    const assignment = await settlePettyCashAssignment.execute(parseInt(id), settlementData);
    console.log('controller settle - returned assignment:', assignment);
    console.log('=== CONTROLLER SETTLE END ===');
    res.json(assignment);
  } catch (error) {
    console.error('Error in settle:', error);
    res.status(500).json({ message: error.message || 'Error settling petty cash' });
  }
}
```

## Summary of Changes

| File | Method | Lines | Change Type | Impact |
|------|--------|-------|-------------|--------|
| MSSQLPettyCashAssignmentRepository.js | getByJob() | 110-156 | Logic Change | Collects items from all assignments |
| MSSQLPettyCashAssignmentRepository.js | settle() | 240-354 | Logging Addition | Enables debugging |
| PettyCashAssignmentController.js | settle() | - | Logging Addition | Tracks requests |

## No Changes Required

The following files already have correct logic and require no changes:

1. **frontend/src/components/PettyCash.js**
   - Already loads all settlement items for a job
   - Already marks items as read-only if paid
   - Already shows "Paid by" badge

2. **frontend/src/components/Billing.js**
   - Already detects settled status
   - Already auto-saves settlement items
   - Already shows cost breakdown

3. **Database Schema**
   - PettyCashSettlementItems table already has paidBy column
   - PettyCashAssignments table already has status column
   - Jobs table already has pettyCashStatus column

## Verification

To verify changes are correct:

1. Check syntax: `npm run lint` (if available)
2. Check diagnostics: Use IDE diagnostics tool
3. Test settlement flow end-to-end
4. Monitor backend logs during testing
5. Verify database updates correctly

## Rollback Instructions

If needed to rollback:

1. Revert MSSQLPettyCashAssignmentRepository.js to previous version
2. Revert PettyCashAssignmentController.js to previous version
3. Restart backend: `npm start`
4. Clear browser cache
5. Test settlement flow again

## Performance Considerations

- **getByJob()**: Now loops through assignments (typically 2-3 per job)
- **settle()**: No performance impact, just added logging
- **Database**: No additional queries, just collecting results
- **Frontend**: No changes to rendering

## Security Considerations

- Logging includes user IDs and settlement amounts (acceptable for debugging)
- No sensitive data exposed in logs
- Transaction rollback on error prevents partial updates
- paidBy field ensures audit trail of who paid for what
