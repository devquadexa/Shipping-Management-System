class GetUserBalancesSummary {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute() {
    const allAssignments = await this.pettyCashAssignmentRepository.getAll();
    
    const userBalances = {};
    
    allAssignments.forEach(assignment => {
      const userId = assignment.assignedTo;
      
      if (!userBalances[userId]) {
        userBalances[userId] = {
          userId: userId,
          userName: assignment.assignedToName || userId,
          totalAssigned: 0,
          totalSpent: 0,
          totalBalance: 0,
          totalOver: 0,
          activeAssignments: 0,
          settledAssignments: 0,
          assignments: []
        };
      }
      
      userBalances[userId].totalAssigned += parseFloat(assignment.assignedAmount || 0);
      
      if (assignment.status === 'Assigned') {
        userBalances[userId].activeAssignments += 1;
      } else if (assignment.status === 'Settled') {
        userBalances[userId].settledAssignments += 1;
        userBalances[userId].totalSpent += parseFloat(assignment.actualSpent || 0);
        userBalances[userId].totalBalance += parseFloat(assignment.balanceAmount || 0);
        userBalances[userId].totalOver += parseFloat(assignment.overAmount || 0);
      }
      
      userBalances[userId].assignments.push({
        assignmentId: assignment.assignmentId,
        jobId: assignment.jobId,
        status: assignment.status,
        assignedAmount: assignment.assignedAmount,
        actualSpent: assignment.actualSpent,
        balanceAmount: assignment.balanceAmount,
        overAmount: assignment.overAmount
      });
    });
    
    return Object.values(userBalances);
  }
}

module.exports = GetUserBalancesSummary;
