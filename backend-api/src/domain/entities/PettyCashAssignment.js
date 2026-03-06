class PettyCashAssignment {
  constructor({
    assignmentId,
    jobId,
    assignedTo,
    assignedBy,
    assignedAmount,
    assignedDate,
    status,
    settlementDate,
    actualSpent,
    balanceAmount,
    overAmount,
    notes,
    settlementItems,
    shipmentCategory,
    customerId,
    assignedToName,
    assignedByName
  }) {
    this.assignmentId = assignmentId;
    this.jobId = jobId;
    this.assignedTo = assignedTo;
    this.assignedBy = assignedBy;
    this.assignedAmount = assignedAmount;
    this.assignedDate = assignedDate;
    this.status = status || 'Assigned';
    this.settlementDate = settlementDate;
    this.actualSpent = actualSpent;
    this.balanceAmount = balanceAmount;
    this.overAmount = overAmount;
    this.notes = notes;
    this.settlementItems = settlementItems || [];
    this.shipmentCategory = shipmentCategory;
    this.customerId = customerId;
    this.assignedToName = assignedToName;
    this.assignedByName = assignedByName;
  }

  toJSON() {
    return {
      assignmentId: this.assignmentId,
      jobId: this.jobId,
      assignedTo: this.assignedTo,
      assignedBy: this.assignedBy,
      assignedAmount: this.assignedAmount,
      assignedDate: this.assignedDate,
      status: this.status,
      settlementDate: this.settlementDate,
      actualSpent: this.actualSpent,
      balanceAmount: this.balanceAmount,
      overAmount: this.overAmount,
      notes: this.notes,
      settlementItems: this.settlementItems,
      shipmentCategory: this.shipmentCategory,
      customerId: this.customerId,
      assignedToName: this.assignedToName,
      assignedByName: this.assignedByName
    };
  }
}

module.exports = PettyCashAssignment;
