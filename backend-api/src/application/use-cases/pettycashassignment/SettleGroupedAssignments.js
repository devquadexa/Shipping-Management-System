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

    // Settle all assignments in the group.
    // Important: To avoid duplicating custom items in the combined view, 
    // we should only attach custom items to ONE assignment in the group (the main one or the first one),
    // while predefined items are synced across all.
    const results = [];
    const mainAssignmentId = groupAssignments[0].assignmentId;

    for (let i = 0; i < groupAssignments.length; i++) {
      const assignment = groupAssignments[i];
      // Filter settlement data for this assignment
      const assignmentSettlementData = {
        ...settlementData,
        // Only include custom items for the first assignment in the group to avoid duplication
        items: settlementData.items.filter(item => 
          !(item.isCustomItem || item.isCustom) || i === 0
        )
      };

      const result = await this.pettyCashAssignmentRepository.settle(
        assignment.assignmentId,
        assignmentSettlementData
      );
      results.push(result);
    }

    return results;
  }
}

module.exports = SettleGroupedAssignments;
