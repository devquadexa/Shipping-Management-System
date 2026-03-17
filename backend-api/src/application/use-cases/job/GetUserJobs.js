/**
 * Get User Jobs Use Case
 * Retrieves all jobs assigned to a specific user
 */
class GetUserJobs {
  constructor(userRepository, jobAssignmentRepository) {
    this.userRepository = userRepository;
    this.jobAssignmentRepository = jobAssignmentRepository;
  }

  async execute(userId, filters = {}) {
    // Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get jobs for user
    const jobs = await this.jobAssignmentRepository.getJobsForUser(userId, filters);

    // Get user assignments summary
    const assignments = await this.jobAssignmentRepository.findByUserId(userId, true);

    return {
      userId,
      userName: user.name,
      userRole: user.role,
      summary: {
        totalAssignedJobs: jobs.length,
        activeAssignments: assignments.length
      },
      jobs: jobs.map(job => ({
        jobId: job.jobId,
        customerId: job.customerId,
        customerName: job.customerName,
        shipmentCategory: job.shipmentCategory,
        status: job.status,
        openDate: job.openDate,
        createdDate: job.createdDate,
        assignedDate: job.assignedDate,
        assignmentNotes: job.assignmentNotes,
        assignmentId: job.assignmentId
      }))
    };
  }
}

module.exports = GetUserJobs;