class GetPettyCashAssignmentByJob {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(jobId) {
    return await this.pettyCashAssignmentRepository.getByJob(jobId);
  }
}

module.exports = GetPettyCashAssignmentByJob;
