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

      if (assignment.status !== 'Settled' && 
          assignment.status !== 'Balance To Be Return' && 
          assignment.status !== 'Over Due' &&
          assignment.status !== 'Pending Approval / Balance' &&
          assignment.status !== 'Pending Approval / Over Due' &&
          assignment.status !== 'Pending Approval' &&
          assignment.status !== 'Settled/Approved' &&
          assignment.status !== 'Settled / Balance Returned' &&
          assignment.status !== 'Settled / Over Due Collected') {
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

    // Calculate group balance/over from totals (not sum of individual balances)
    Object.values(grouped).forEach(group => {
      group.totalBalance = Math.max(0, group.totalAssigned - group.totalSpent);
      group.totalOver = Math.max(0, group.totalSpent - group.totalAssigned);
      
      // Check if any assignment has a pending approval status
      const hasPendingApproval = group.assignments.some(a => 
        a.status === 'Pending Approval / Balance' || 
        a.status === 'Pending Approval / Over Due' ||
        a.status === 'Pending Approval'
      );
      
      // Check if all assignments have the same approved status
      const allBalanceReturned = group.assignments.every(a => a.status === 'Settled / Balance Returned');
      const allOverDueCollected = group.assignments.every(a => a.status === 'Settled / Over Due Collected');
      const allApproved = group.assignments.every(a => a.status === 'Settled/Approved');
      
      // Determine group status based on pending approval first, then approved statuses, then group totals
      if (hasPendingApproval) {
        // Find the specific pending approval status
        const pendingAssignment = group.assignments.find(a => 
          a.status === 'Pending Approval / Balance' || 
          a.status === 'Pending Approval / Over Due' ||
          a.status === 'Pending Approval'
        );
        group.groupStatus = pendingAssignment.status;
      } else if (allBalanceReturned) {
        group.groupStatus = 'Settled / Balance Returned';
      } else if (allOverDueCollected) {
        group.groupStatus = 'Settled / Over Due Collected';
      } else if (allApproved) {
        group.groupStatus = 'Settled/Approved';
      } else if (group.hasUnsettled) {
        group.groupStatus = 'Assigned';
      } else if (group.totalBalance > 0) {
        group.groupStatus = 'Balance To Be Return';
      } else if (group.totalOver > 0) {
        group.groupStatus = 'Over Due';
      } else {
        group.groupStatus = 'Settled';
      }
    });

    return Object.values(grouped);
  }
}

module.exports = GetGroupedAssignments;
