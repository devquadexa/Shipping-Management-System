class GetAssignmentsWithChildren {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(userId = null) {
    // Get only main assignments
    const mainAssignments = await this.pettyCashAssignmentRepository.getMainAssignments(userId);

    // For each main assignment, get its sub-assignments and calculate totals
    const assignmentsWithChildren = await Promise.all(
      mainAssignments.map(async (main) => {
        const subAssignments = await this.pettyCashAssignmentRepository.getSubAssignments(main.assignmentId);
        
        // Calculate total assigned amount (main + all subs)
        const totalAssignedAmount = parseFloat(main.assignedAmount) + 
          subAssignments.reduce((sum, sub) => sum + parseFloat(sub.assignedAmount || 0), 0);
        
        return {
          ...main,
          subAssignments,
          totalAssignedAmount,
          subAssignmentCount: subAssignments.length
        };
      })
    );

    return assignmentsWithChildren;
  }
}

module.exports = GetAssignmentsWithChildren;
