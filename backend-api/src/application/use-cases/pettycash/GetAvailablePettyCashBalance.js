/**
 * Get Available Petty Cash Balance Use Case
 * Returns the available balance after subtracting active assignments
 */
class GetAvailablePettyCashBalance {
  constructor(pettyCashRepository, pettyCashAssignmentRepository) {
    this.pettyCashRepository = pettyCashRepository;
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute() {
    // Get current petty cash balance
    const currentBalance = await this.pettyCashRepository.getBalance();

    // Get all active assignments to calculate total assigned
    const allAssignments = await this.pettyCashAssignmentRepository.getAll();
    const totalAssigned = allAssignments
      .filter(a => a.status === 'Assigned')
      .reduce((sum, a) => sum + parseFloat(a.assignedAmount || 0), 0);

    // Calculate available balance
    const availableBalance = currentBalance - totalAssigned;

    return {
      totalBalance: currentBalance,
      totalAssigned: totalAssigned,
      availableBalance: availableBalance
    };
  }
}

module.exports = GetAvailablePettyCashBalance;
