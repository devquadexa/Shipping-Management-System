class GetUserBalancesSummary {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(month, year) {
    const allAssignments = await this.pettyCashAssignmentRepository.getAll();

    // All statuses that mean the assignment has been settled/finalised
    const settledStatuses = new Set([
      'Settled',
      'Balance To Be Return',
      'Over Due',
      'Pending Approval / Balance',
      'Pending Approval / Over Due',
      'Settled / Balance Returned',
      'Settled / Over Due Collected',
      'Full Petty Cash Returned',
      'Closed',
      'Settled/Approved',
      'Settled/Rejected',
      'Balance Returned',
      'Overdue Collected',
    ]);

    const activeStatuses = new Set(['Assigned']);

    const userBalances = {};

    allAssignments.forEach(assignment => {
      // Filter by month and year if provided
      if (month && year) {
        const assignmentDate = new Date(assignment.createdDate || assignment.assignedDate);
        if (assignmentDate.getMonth() + 1 !== month || assignmentDate.getFullYear() !== year) {
          return; // Skip this assignment if it doesn't match the month/year
        }
      }

      const userId = assignment.assignedTo;

      if (!userBalances[userId]) {
        userBalances[userId] = {
          userId,
          userName: assignment.assignedToName || userId,
          totalAssigned: 0,
          totalSpent: 0,
          totalBalance: 0,
          totalOver: 0,
          activeAssignments: 0,
          settledAssignments: 0,
          assignments: [],
        };
      }

      const u = userBalances[userId];
      const assigned = parseFloat(assignment.assignedAmount || 0);
      const spent    = parseFloat(assignment.actualSpent   || 0);
      const balance  = parseFloat(assignment.balanceAmount || 0);
      const over     = parseFloat(assignment.overAmount    || 0);

      // Total Assigned = sum of ALL assignments (including Closed — shows historical total)
      u.totalAssigned += assigned;

      if (activeStatuses.has(assignment.status)) {
        u.activeAssignments += 1;
      }

      if (settledStatuses.has(assignment.status)) {
        u.settledAssignments += 1;
        // Total Spent = actual amount spent (from settlement items)
        u.totalSpent   += spent;
        u.totalBalance += balance;
        u.totalOver    += over;
      }

      u.assignments.push({
        assignmentId: assignment.assignmentId,
        jobId:        assignment.jobId,
        status:       assignment.status,
        assignedAmount: assignment.assignedAmount,
        actualSpent:    assignment.actualSpent,
        balanceAmount:  assignment.balanceAmount,
        overAmount:     assignment.overAmount,
      });
    });

    return Object.values(userBalances);
  }
}

module.exports = GetUserBalancesSummary;
