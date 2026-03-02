/**
 * Assign Job to User Use Case
 */
class AssignJob {
  constructor(jobRepository, userRepository) {
    this.jobRepository = jobRepository;
    this.userRepository = userRepository;
  }

  async execute(jobId, userId) {
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

    // Business logic: Check if job can be assigned
    if (!job.canBeAssigned()) {
      throw new Error(`Cannot assign job with status: ${job.status}`);
    }

    // Assign
    job.assignTo(userId);

    // Update
    await this.jobRepository.update(jobId, job);
    
    return job;
  }
}

module.exports = AssignJob;
