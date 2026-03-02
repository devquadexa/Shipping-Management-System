/**
 * Get Job By ID Use Case
 */
class GetJobById {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(jobId) {
    const job = await this.jobRepository.findById(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    return job;
  }
}

module.exports = GetJobById;
