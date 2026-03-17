/**
 * Job Assignment Repository Interface
 * Defines the contract for job assignment data access
 */
class IJobAssignmentRepository {
  
  /**
   * Create a new job assignment
   * @param {JobAssignment} assignment 
   * @returns {Promise<JobAssignment>}
   */
  async create(assignment) {
    throw new Error('Method not implemented');
  }

  /**
   * Find assignment by ID
   * @param {number} assignmentId 
   * @returns {Promise<JobAssignment|null>}
   */
  async findById(assignmentId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all assignments for a job
   * @param {string} jobId 
   * @param {boolean} activeOnly - Only return active assignments
   * @returns {Promise<JobAssignment[]>}
   */
  async findByJobId(jobId, activeOnly = true) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all assignments for a user
   * @param {string} userId 
   * @param {boolean} activeOnly - Only return active assignments
   * @returns {Promise<JobAssignment[]>}
   */
  async findByUserId(userId, activeOnly = true) {
    throw new Error('Method not implemented');
  }

  /**
   * Assign multiple users to a job
   * @param {string} jobId 
   * @param {string[]} userIds 
   * @param {string} assignedBy 
   * @param {string} notes 
   * @returns {Promise<number>} Number of assignments created
   */
  async assignUsersToJob(jobId, userIds, assignedBy, notes = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove user assignment from job (soft delete)
   * @param {string} jobId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async removeUserFromJob(jobId, userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove all assignments for a job
   * @param {string} jobId 
   * @returns {Promise<boolean>}
   */
  async removeAllAssignmentsForJob(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get assignment summary for a job
   * @param {string} jobId 
   * @returns {Promise<Object>} Summary with user count, names, etc.
   */
  async getJobAssignmentSummary(jobId) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if user is assigned to job
   * @param {string} jobId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async isUserAssignedToJob(jobId, userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all jobs assigned to a user with details
   * @param {string} userId 
   * @param {Object} filters - Optional filters (status, etc.)
   * @returns {Promise<Object[]>} Jobs with assignment details
   */
  async getJobsForUser(userId, filters = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update assignment notes
   * @param {number} assignmentId 
   * @param {string} notes 
   * @returns {Promise<boolean>}
   */
  async updateNotes(assignmentId, notes) {
    throw new Error('Method not implemented');
  }
}

module.exports = IJobAssignmentRepository;