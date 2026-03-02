/**
 * Get All Jobs Use Case
 */
class GetAllJobs {
  constructor(jobRepository) {
    this.jobRepository = jobRepository;
  }

  async execute(filters = {}) {
    return await this.jobRepository.findAll(filters);
  }
}

module.exports = GetAllJobs;
