class GetAggregatedAssignments {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(userId = null) {
    // Get all assignments
    const allAssignments = userId 
      ? await this.pettyCashAssignmentRepository.getByUser(userId)
      : await this.pettyCashAssignmentRepository.findAll();

    // Group by jobId + assignedTo
    const grouped = {};
    
    allAssignments.forEach(assignment => {
      const key = `${assignment.jobId}_${assignment.assignedTo}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          groupKey: key,
          jobId: assignment.jobId,
          assignedTo: assignment.assignedTo,
          assignedToName: assignment.assignedToName,
          shipmentCategory: assignment.shipmentCategory,
          customerId: assignment.customerId,
          assignments: [],
          totalAssignedAmount: 0,
          totalActualSpent: 0,
          totalBalance: 0,
          totalOver: 0,
          allSettled: true,
          groupStatus: 'Assigned',
          latestAssignedDate: assignment.assignedDate,
          mainAssignmentId: assignment.assignmentId // Use first assignment as main ID
        };
      }

      // Add to assignments array
      grouped[key].assignments.push(assignment);
      
      // Calculate totals
      grouped[key].totalAssignedAmount += parseFloat(assignment.assignedAmount || 0);
      grouped[key].totalActualSpent += parseFloat(assignment.actualSpent || 0);

      // Update group status
      if (assignment.status !== 'Settled' && 
          assignment.status !== 'Balance To Be Return' && 
          assignment.status !== 'Over Due' &&
          assignment.status !== 'Pending Approval / Balance' &&
          assignment.status !== 'Pending Approval / Over Due' &&
          assignment.status !== 'Pending Approval' &&
          assignment.status !== 'Settled/Approved' &&
          assignment.status !== 'Settled / Balance Returned' &&
          assignment.status !== 'Settled / Over Due Collected') {
        grouped[key].allSettled = false;
      }

      // Keep the latest date
      if (new Date(assignment.assignedDate) > new Date(grouped[key].latestAssignedDate)) {
        grouped[key].latestAssignedDate = assignment.assignedDate;
      }
    });

    // Calculate group balance/over from totals (not sum of individual balances)
    Object.values(grouped).forEach(group => {
      group.totalBalance = Math.max(0, group.totalAssignedAmount - group.totalActualSpent);
      group.totalOver = Math.max(0, group.totalActualSpent - group.totalAssignedAmount);
      
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
      } else if (!group.allSettled) {
        group.groupStatus = 'Assigned';
      } else if (group.totalBalance > 0) {
        group.groupStatus = 'Balance To Be Return';
      } else if (group.totalOver > 0) {
        group.groupStatus = 'Over Due';
      } else {
        group.groupStatus = 'Settled';
      }
    });

    // Convert to array and sort by latest date
    const result = Object.values(grouped).sort((a, b) => 
      new Date(b.latestAssignedDate) - new Date(a.latestAssignedDate)
    );

    return result;
  }
}

module.exports = GetAggregatedAssignments;
