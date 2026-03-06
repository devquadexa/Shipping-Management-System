class SettlePettyCashAssignment {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(assignmentId, settlementData) {
    if (!settlementData.items || settlementData.items.length === 0) {
      throw new Error('At least one settlement item is required');
    }

    // Validate all items have required fields
    for (const item of settlementData.items) {
      if (!item.itemName || !item.actualCost) {
        throw new Error('All items must have name and actual cost');
      }
      if (item.actualCost <= 0) {
        throw new Error('Actual cost must be greater than 0');
      }
    }

    return await this.pettyCashAssignmentRepository.settle(assignmentId, settlementData);
  }
}

module.exports = SettlePettyCashAssignment;
