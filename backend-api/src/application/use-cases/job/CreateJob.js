/**
 * Create Job Use Case
 */
const Job = require('../../../domain/entities/Job');

class CreateJob {
  constructor(jobRepository, customerRepository) {
    this.jobRepository = jobRepository;
    this.customerRepository = customerRepository;
  }

  async execute(jobData) {
    // Verify customer exists
    const customerExists = await this.customerRepository.exists(jobData.customerId);
    if (!customerExists) {
      throw new Error('Customer not found');
    }

    // Create domain entity
    const job = new Job({
      jobId: await this.jobRepository.generateNextId(),
      ...jobData
    });

    // Validate business rules
    const validation = job.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Persist
    const createdJob = await this.jobRepository.create(job);
    
    return createdJob;
  }
}

module.exports = CreateJob;
