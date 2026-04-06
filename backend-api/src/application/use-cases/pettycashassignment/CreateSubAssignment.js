class CreateSubAssignment {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
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

    return subAssignment;
  }
}

module.exports = CreateSubAssignment;
