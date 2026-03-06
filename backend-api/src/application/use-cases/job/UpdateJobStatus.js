/**
 * Update Job Status Use Case
 */
class UpdateJobStatus {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(jobId, status) {
    console.log('UpdateJobStatus.execute - jobId:', jobId, 'status:', status);
    
    const job = await this.jobRepository.findById(jobId);
    console.log('UpdateJobStatus.execute - found job:', job);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Validate status
    const validStatuses = ['Open', 'In Progress', 'Pending Payment', 'Payment Collected', 'Overdue', 'Completed', 'Canceled'];
    if (!validStatuses.includes(status)) {
      console.log('UpdateJobStatus.execute - Invalid status:', status);
      throw new Error(`Invalid status: ${status}`);
    }
    
    console.log('UpdateJobStatus.execute - Updating status to:', status);
    const result = await this.jobRepository.updateStatus(jobId, status);
    console.log('UpdateJobStatus.execute - Update result:', result);
    
    return result;
  }
}

module.exports = UpdateJobStatus;
