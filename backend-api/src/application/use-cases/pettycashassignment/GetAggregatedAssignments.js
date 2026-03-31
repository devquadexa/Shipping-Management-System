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
      grouped[key].totalBalance += parseFloat(assignment.balanceAmount || 0);
      grouped[key].totalOver += parseFloat(assignment.overAmount || 0);

      // Update group status
      if (assignment.status !== 'Settled' && assignment.status !== 'Settled/Approved') {
        grouped[key].allSettled = false;
      }

      // Keep the latest date
      if (new Date(assignment.assignedDate) > new Date(grouped[key].latestAssignedDate)) {
        grouped[key].latestAssignedDate = assignment.assignedDate;
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
