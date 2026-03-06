class CreatePettyCashAssignment {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(assignmentData) {
    if (!assignmentData.jobId || !assignmentData.assignedTo || !assignmentData.assignedAmount) {
      throw new Error('Job ID, assigned user, and amount are required');
    }

    if (assignmentData.assignedAmount <= 0) {
      throw new Error('Assigned amount must be greater than 0');
    }

    return await this.pettyCashAssignmentRepository.create(assignmentData);
  }
}

module.exports = CreatePettyCashAssignment;
