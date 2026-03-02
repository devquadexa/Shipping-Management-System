/**
 * Update Job Status Use Case
 */
class UpdateJobStatus {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(jobId, status) {
    const job = await this.jobRepository.findById(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    job.updateStatus(status);
    
    return await this.jobRepository.updateStatus(jobId, status);
  }
}

module.exports = UpdateJobStatus;
