class CreateSubAssignment {
  constructor(pettyCashAssignmentRepository, jobRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
    this.jobRepository = jobRepository;
  }

  async execute(parentAssignmentId, assignmentData) {
    // Get parent assignment
    const parent = await this.pettyCashAssignmentRepository.findById(parentAssignmentId);
    if (!parent) {
      throw new Error('Parent assignment not found');
    }

    // Create sub-assignment with parent reference
    const subAssignment = await this.pettyCashAssignmentRepository.createSubAssignment({
      ...assignmentData,
      parentAssignmentId,
      jobId: parent.jobId,
      assignedTo: parent.assignedTo,
      groupId: parent.groupId,
      isMainAssignment: false
    });

    // Auto-update job status from "Open" to "In Progress" when petty cash is assigned
    // (This handles edge cases where job status might have been reverted)
    if (this.jobRepository && parent.jobId) {
      const job = await this.jobRepository.findById(parent.jobId);
      if (job && job.status === 'Open') {
        await this.jobRepository.updateStatus(parent.jobId, 'In Progress');
      }
    }

    return subAssignment;
  }
}

module.exports = CreateSubAssignment;
