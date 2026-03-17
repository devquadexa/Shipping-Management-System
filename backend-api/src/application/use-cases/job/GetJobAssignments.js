/**
 * Get Job Assignments Use Case
 * Retrieves all user assignments for a specific job
 */
class GetJobAssignments {
  constructor(jobRepository, jobAssignmentRepository) {
    this.jobRepository = jobRepository;
    this.jobAssignmentRepository = jobAssignmentRepository;
  }

  async execute(jobId, includeInactive = false) {
    // Validate input
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    // Verify job exists
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Get assignments
    const assignments = await this.jobAssignmentRepository.findByJobId(jobId, !includeInactive);

    // Get assignment summary
    const summary = await this.jobAssignmentRepository.getJobAssignmentSummary(jobId);

    return {
      jobId,
      jobStatus: job.status,
      shipmentCategory: job.shipmentCategory,
      summary: {
        totalAssignedUsers: summary.assignedUserCount,
        assignedUserNames: summary.assignedUserNames,
        assignedUserIds: summary.assignedUserIds ? summary.assignedUserIds.split(',') : [],
        lastAssignedDate: summary.lastAssignedDate
      },
      assignments: assignments.map(assignment => assignment.toJSON())
    };
  }
}

module.exports = GetJobAssignments;