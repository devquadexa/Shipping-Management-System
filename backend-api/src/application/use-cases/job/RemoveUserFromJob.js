/**
 * Remove User from Job Use Case
 * Handles removing a user assignment from a job
 */
class RemoveUserFromJob {
  constructor(jobRepository, userRepository, jobAssignmentRepository) {
    this.jobRepository = jobRepository;
    this.userRepository = userRepository;
    this.jobAssignmentRepository = jobAssignmentRepository;
  }

  async execute(jobId, userId) {
    // Validate inputs
    if (!jobId || !userId) {
      throw new Error('Job ID and User ID are required');
    }

    // Get job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is actually assigned to this job
    const isAssigned = await this.jobAssignmentRepository.isUserAssignedToJob(jobId, userId);
    if (!isAssigned) {
      throw new Error('User is not assigned to this job');
    }

    // Remove user assignment
    const removed = await this.jobAssignmentRepository.removeUserFromJob(jobId, userId);

    if (!removed) {
      throw new Error('Failed to remove user from job');
    }

    // Get updated assignment summary
    const summary = await this.jobAssignmentRepository.getJobAssignmentSummary(jobId);

    return {
      jobId,
      removedUserId: userId,
      remainingAssignedUsers: summary.assignedUserCount,
      assignedUserNames: summary.assignedUserNames,
      message: `Successfully removed user ${userId} from job ${jobId}`
    };
  }
}

module.exports = RemoveUserFromJob;