// Extension methods for parent-child petty cash assignments
// Add these methods to MSSQLPettyCashAssignmentRepository

const extensions = {
  // Create a sub-assignment under a parent
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
  },

  // Get only main assignments (no parent)
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
  },

  // Get sub-assignments for a parent
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
  },

  // Get total assigned amount for a main assignment (including subs)
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
};

module.exports = extensions;
