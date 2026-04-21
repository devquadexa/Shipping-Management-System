class SettlePettyCashAssignment {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(assignmentId, settlementData) {
    // Allow empty items array for FULL RETURN scenario:
    // When a Waff Clerk cannot complete the job (illness, leave, etc.),
    // they can submit with no items to return the entire assigned amount.
    // This will result in actualSpent = 0 and balanceAmount = assignedAmount.
    
    // If items are provided, validate them
    if (settlementData.items && settlementData.items.length > 0) {
      // Validate all items have required fields
      for (const item of settlementData.items) {
        if (!item.itemName || !item.actualCost) {
          throw new Error('All items must have name and actual cost');
        }
        if (item.actualCost <= 0) {
          throw new Error('Actual cost must be greater than 0');
        }
      }
    }
    // If no items: this is a full return request, proceed without validation

    return await this.pettyCashAssignmentRepository.settle(assignmentId, settlementData);
  }
}

module.exports = SettlePettyCashAssignment;
