class GetGroupedAssignments {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(userId = null) {
    const assignments = userId 
      ? await this.pettyCashAssignmentRepository.getByUser(userId)
      : await this.pettyCashAssignmentRepository.findAll();

    // Group assignments by groupId
    const grouped = {};
    assignments.forEach(assignment => {
      const gid = assignment.groupId || `${assignment.jobId}_${assignment.assignedTo}`;
      if (!grouped[gid]) {
        grouped[gid] = {
          groupId: gid,
          jobId: assignment.jobId,
          assignedTo: assignment.assignedTo,
          assignedToName: assignment.assignedToName,
          shipmentCategory: assignment.shipmentCategory,
          customerId: assignment.customerId,
          assignments: [],
          totalAssigned: 0,
          totalSpent: 0,
          totalBalance: 0,
          totalOver: 0,
          allSettled: true,
          hasUnsettled: false,
          groupStatus: 'Assigned'
        };
      }

      grouped[gid].assignments.push(assignment);
      grouped[gid].totalAssigned += parseFloat(assignment.assignedAmount || 0);
      grouped[gid].totalSpent += parseFloat(assignment.actualSpent || 0);
      grouped[gid].totalBalance += parseFloat(assignment.balanceAmount || 0);
      grouped[gid].totalOver += parseFloat(assignment.overAmount || 0);

      if (assignment.status !== 'Settled' && assignment.status !== 'Settled/Approved') {
        grouped[gid].allSettled = false;
        grouped[gid].hasUnsettled = true;
      }

      // Group status priority: Assigned > Settled > Settled/Approved
      if (assignment.status === 'Assigned' || assignment.status === 'Pending') {
        grouped[gid].groupStatus = 'Assigned';
      } else if (grouped[gid].groupStatus !== 'Assigned' && assignment.status === 'Settled') {
        grouped[gid].groupStatus = 'Settled';
      } else if (grouped[gid].groupStatus === 'Settled' && grouped[gid].allSettled) {
        grouped[gid].groupStatus = 'Settled';
      }
    });

    return Object.values(grouped);
  }
}

module.exports = GetGroupedAssignments;
