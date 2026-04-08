class CreatePettyCashAssignment {
  constructor(pettyCashAssignmentRepository, billRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
    this.billRepository = billRepository;
  }

  async execute(assignmentData) {
    // Validate required fields
    if (!assignmentData.jobId || !assignmentData.assignedTo || !assignmentData.assignedAmount) {
      throw new Error('Job ID, assigned user, and amount are required');
    }

    if (assignmentData.assignedAmount <= 0) {
      throw new Error('Assigned amount must be greater than 0');
    }

    // Check if a bill has been generated for this job
    if (this.billRepository) {
      const existingBills = await this.billRepository.findByJob(assignmentData.jobId);
      if (existingBills && existingBills.length > 0) {
        throw new Error('Cannot create petty cash assignment: a bill has already been generated for this job');
      }
    }

    // Create new assignment
    // NOTE: This ALWAYS creates a new assignment record with a new assignmentId,
    // even if there are existing assignments for the same job+user combination.
    // Multiple assignments for the same job+user are grouped together using groupId.
    // This allows creating new assignments after "Full Petty Cash Returned" status.
    return await this.pettyCashAssignmentRepository.create(assignmentData);
  }
}

module.exports = CreatePettyCashAssignment;
