class SettleGroupedAssignments {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(groupId, settlementData) {
    // Get all assignments in this group
    const allAssignments = await this.pettyCashAssignmentRepository.getAll();
    const groupAssignments = allAssignments.filter(a => 
      (a.groupId || `${a.jobId}_${a.assignedTo}`) === groupId
    );

    if (groupAssignments.length === 0) {
      throw new Error('No assignments found for this group');
    }

    // Settle all assignments in the group with the same items
    const results = [];
    for (const assignment of groupAssignments) {
      if (assignment.status === 'Assigned' || assignment.status === 'Pending') {
        const result = await this.pettyCashAssignmentRepository.settle(
          assignment.assignmentId,
          settlementData
        );
        results.push(result);
      }
    }

    return results;
  }
}

module.exports = SettleGroupedAssignments;
