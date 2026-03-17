/**
 * MSSQL Job Assignment Repository Implementation
 * Implements IJobAssignmentRepository interface
 */
const IJobAssignmentRepository = require('../../domain/repositories/IJobAssignmentRepository');
const JobAssignment = require('../../domain/entities/JobAssignment');

class MSSQLJobAssignmentRepository extends IJobAssignmentRepository {
  constructor(dbConnection, sql) {
    super();
    this.db = dbConnection;
    this.sql = sql;
  }

  async create(assignment) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, assignment.jobId)
      .input('userId', this.sql.VarChar, assignment.userId)
      .input('assignedBy', this.sql.VarChar, assignment.assignedBy)
      .input('notes', this.sql.NVarChar, assignment.notes)
      .query(`
        INSERT INTO JobAssignments (jobId, userId, assignedBy, notes)
        OUTPUT INSERTED.assignmentId
        VALUES (@jobId, @userId, @assignedBy, @notes)
      `);
    
    assignment.assignmentId = result.recordset[0].assignmentId;
    return assignment;
  }

  async findById(assignmentId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('assignmentId', this.sql.Int, assignmentId)
      .query(`
        SELECT ja.*, u.name as userName, u.email as userEmail, u.role as userRole,
               ab.name as assignedByName
        FROM JobAssignments ja
        INNER JOIN Users u ON ja.userId = u.userId
        LEFT JOIN Users ab ON ja.assignedBy = ab.userId
        WHERE ja.assignmentId = @assignmentId
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.recordset[0]);
  }

  async findByJobId(jobId, activeOnly = true) {
    const pool = await this.db();
    
    let query = `
      SELECT ja.*, u.fullName as userName, u.email as userEmail, u.role as userRole,
             ab.fullName as assignedByName
      FROM JobAssignments ja
      INNER JOIN Users u ON ja.userId = u.userId
      LEFT JOIN Users ab ON ja.assignedBy = ab.userId
      WHERE ja.jobId = @jobId
    `;

    if (activeOnly) {
      query += ' AND ja.isActive = 1';
    }

    query += ' ORDER BY ja.assignedDate DESC';
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query(query);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async findByUserId(userId, activeOnly = true) {
    const pool = await this.db();
    
    let query = `
      SELECT ja.*, u.fullName as userName, u.email as userEmail, u.role as userRole,
             ab.fullName as assignedByName
      FROM JobAssignments ja
      INNER JOIN Users u ON ja.userId = u.userId
      LEFT JOIN Users ab ON ja.assignedBy = ab.userId
      WHERE ja.userId = @userId
    `;

    if (activeOnly) {
      query += ' AND ja.isActive = 1';
    }

    query += ' ORDER BY ja.assignedDate DESC';
    
    const result = await pool.request()
      .input('userId', this.sql.VarChar, userId)
      .query(query);
    
    return result.recordset.map(row => this.mapToEntity(row));
  }

  async assignUsersToJob(jobId, userIds, assignedBy, notes = null) {
    const pool = await this.db();
    const transaction = new this.sql.Transaction(pool);
    
    try {
      await transaction.begin();

      // Replace existing assignments for this job.
      await transaction.request()
        .input('jobId', this.sql.VarChar, jobId)
        .query(`
          UPDATE JobAssignments
          SET isActive = 0
          WHERE jobId = @jobId
        `);

      for (const userId of userIds) {
        const existingResult = await transaction.request()
          .input('jobId', this.sql.VarChar, jobId)
          .input('userId', this.sql.VarChar, userId)
          .query(`
            SELECT TOP 1 assignmentId
            FROM JobAssignments
            WHERE jobId = @jobId AND userId = @userId
            ORDER BY assignedDate DESC
          `);

        if (existingResult.recordset.length > 0) {
          await transaction.request()
            .input('assignmentId', this.sql.Int, existingResult.recordset[0].assignmentId)
            .input('assignedBy', this.sql.VarChar, assignedBy)
            .input('notes', this.sql.NVarChar, notes)
            .query(`
              UPDATE JobAssignments
              SET isActive = 1,
                  assignedDate = GETDATE(),
                  assignedBy = @assignedBy,
                  notes = @notes
              WHERE assignmentId = @assignmentId
            `);
        } else {
          await transaction.request()
            .input('jobId', this.sql.VarChar, jobId)
            .input('userId', this.sql.VarChar, userId)
            .input('assignedBy', this.sql.VarChar, assignedBy)
            .input('notes', this.sql.NVarChar, notes)
            .query(`
              INSERT INTO JobAssignments (jobId, userId, assignedBy, notes, isActive)
              VALUES (@jobId, @userId, @assignedBy, @notes, 1)
            `);
        }
      }

      await transaction.request()
        .input('jobId', this.sql.VarChar, jobId)
        .input('assignedTo', this.sql.VarChar, userIds[0] || null)
        .query(`
          UPDATE Jobs
          SET assignedTo = @assignedTo
          WHERE jobId = @jobId
        `);

      await transaction.commit();
      return userIds.length;
    } catch (error) {
      if (transaction._aborted !== true) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('Rollback failed in assignUsersToJob:', rollbackError);
        }
      }
      console.error('Error in assignUsersToJob:', error);
      throw error;
    }
  }

  async removeUserFromJob(jobId, userId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('userId', this.sql.VarChar, userId)
      .execute('sp_RemoveUserFromJob');
    
    return result.recordset[0].RemovedCount > 0;
  }

  async removeAllAssignmentsForJob(jobId) {
    const pool = await this.db();
    
    await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query('DELETE FROM JobAssignments WHERE jobId = @jobId');
    
    return true;
  }

  async getJobAssignmentSummary(jobId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .query(`
        SELECT 
          jobId,
          assignedUserCount,
          assignedUserNames,
          assignedUserIds,
          lastAssignedDate
        FROM vw_JobAssignmentSummary
        WHERE jobId = @jobId
      `);
    
    if (result.recordset.length === 0) {
      return {
        jobId,
        assignedUserCount: 0,
        assignedUserNames: '',
        assignedUserIds: '',
        lastAssignedDate: null
      };
    }
    
    return result.recordset[0];
  }

  async isUserAssignedToJob(jobId, userId) {
    const pool = await this.db();
    
    const result = await pool.request()
      .input('jobId', this.sql.VarChar, jobId)
      .input('userId', this.sql.VarChar, userId)
      .query(`
        SELECT COUNT(*) as count 
        FROM JobAssignments 
        WHERE jobId = @jobId AND userId = @userId AND isActive = 1
      `);
    
    return result.recordset[0].count > 0;
  }

  async getJobsForUser(userId, filters = {}) {
    const pool = await this.db();
    
    let query = `
      SELECT 
        j.jobId,
        j.customerId,
        c.name as customerName,
        j.shipmentCategory,
        j.status,
        j.openDate,
        j.createdDate,
        ja.assignedDate,
        ja.notes as assignmentNotes,
        ja.assignmentId
      FROM JobAssignments ja
      INNER JOIN Jobs j ON ja.jobId = j.jobId
      INNER JOIN Customers c ON j.customerId = c.customerId
      WHERE ja.userId = @userId AND ja.isActive = 1
    `;
    
    const request = pool.request().input('userId', this.sql.VarChar, userId);
    
    if (filters.status) {
      query += ' AND j.status = @status';
      request.input('status', this.sql.VarChar, filters.status);
    }
    
    if (filters.customerId) {
      query += ' AND j.customerId = @customerId';
      request.input('customerId', this.sql.VarChar, filters.customerId);
    }
    
    query += ' ORDER BY ja.assignedDate DESC';
    
    const result = await request.query(query);
    return result.recordset;
  }

  async updateNotes(assignmentId, notes) {
    const pool = await this.db();
    
    await pool.request()
      .input('assignmentId', this.sql.Int, assignmentId)
      .input('notes', this.sql.NVarChar, notes)
      .query('UPDATE JobAssignments SET notes = @notes WHERE assignmentId = @assignmentId');
    
    return true;
  }

  // Helper method to map database row to domain entity
  mapToEntity(row) {
    return new JobAssignment({
      assignmentId: row.assignmentId,
      jobId: row.jobId,
      userId: row.userId,
      assignedDate: row.assignedDate,
      assignedBy: row.assignedBy,
      isActive: row.isActive,
      notes: row.notes,
      userName: row.userName,
      userEmail: row.userEmail,
      userRole: row.userRole,
      assignedByName: row.assignedByName
    });
  }
}

module.exports = MSSQLJobAssignmentRepository;