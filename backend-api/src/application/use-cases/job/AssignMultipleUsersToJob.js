/**
 * Assign Multiple Users to Job Use Case
 * Handles assigning one job to multiple users simultaneously
 */
class AssignMultipleUsersToJob {
  constructor(jobRepository, userRepository, jobAssignmentRepository) {
    this.jobRepository = jobRepository;
    this.userRepository = userRepository;
    this.jobAssignmentRepository = jobAssignmentRepository;
  }

  async execute(jobId, userIds, assignedBy, notes = null) {
    // Validate inputs
    if (!jobId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('Job ID and user IDs array are required');
    }

    if (!assignedBy) {
      throw new Error('AssignedBy user ID is required');
    }

    // Get job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Check if job can be assigned
    if (!job.canBeAssigned()) {
      throw new Error(`Cannot assign job with status: ${job.status}`);
    }

    // Verify all users exist
    const validUserIds = [];
    const invalidUserIds = [];
    
    for (const userId of userIds) {
      const user = await this.userRepository.findById(userId);
      if (user) {
        validUserIds.push(userId);
      } else {
        invalidUserIds.push(userId);
      }
    }

    if (invalidUserIds.length > 0) {
      throw new Error(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
    }

    // Verify assignedBy user exists
    const assignedByUser = await this.userRepository.findById(assignedBy);
    if (!assignedByUser) {
      throw new Error('AssignedBy user not found');
    }

    // Assign users to job using repository
    const assignedCount = await this.jobAssignmentRepository.assignUsersToJob(
      jobId, 
      validUserIds, 
      assignedBy, 
      notes
    );

    // Update job entity with assigned users
    job.assignToUsers(validUserIds);

    // Get assignment summary
    const summary = await this.jobAssignmentRepository.getJobAssignmentSummary(jobId);

    return {
      jobId,
      assignedCount,
      totalAssignedUsers: summary.assignedUserCount,
      assignedUserIds: validUserIds,
      assignedUserNames: summary.assignedUserNames,
      message: `Successfully assigned ${assignedCount} users to job ${jobId}`
    };
  }
}

module.exports = AssignMultipleUsersToJob;