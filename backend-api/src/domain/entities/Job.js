/**
 * Job Domain Entity
 * Represents a cargo shipping job
 */
class Job {
  constructor({
    jobId,
    customerId,
    blNumber = null,
    cusdecNumber = null,
    openDate = null,
    shipmentCategory = null,
    exporter = null,
    lcNumber = null,
    containerNumber = null,
    status = 'Open',
    assignedTo = null,
    createdDate = new Date(),
    completedDate = null,
    payItems = [],
    metadata = {}
  }) {
    this.jobId = jobId;
    this.customerId = customerId;
    this.blNumber = blNumber;
    this.cusdecNumber = cusdecNumber;
    this.openDate = openDate;
    this.shipmentCategory = shipmentCategory;
    this.exporter = exporter;
    this.lcNumber = lcNumber;
    this.containerNumber = containerNumber;
    this.status = status;
    this.assignedTo = assignedTo;
    this.createdDate = createdDate;
    this.completedDate = completedDate;
    this.payItems = payItems;
    this.metadata = metadata;
  }

  // Business logic
  validate() {
    const errors = [];
    
    if (!this.customerId) errors.push('Customer ID is required');
    if (!this.shipmentCategory) errors.push('Shipment Category is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  canBeAssigned() {
    return this.status === 'Open' || this.status === 'Started';
  }

  assignTo(userId) {
    if (!this.canBeAssigned()) {
      throw new Error(`Cannot assign job with status: ${this.status}`);
    }
    this.assignedTo = userId;
  }

  updateStatus(newStatus) {
    const validStatuses = ['Open', 'Started', 'Completed', 'Canceled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    
    this.status = newStatus;
    if (newStatus === 'Completed') {
      this.completedDate = new Date();
    }
  }

  addPayItem(description, amount) {
    if (!description || amount <= 0) {
      throw new Error('Invalid pay item');
    }
    
    this.payItems.push({ description, amount, addedDate: new Date() });
  }

  getTotalCost() {
    const payItemsTotal = this.payItems.reduce((sum, item) => sum + item.amount, 0);
    return payItemsTotal;
  }

  // Serialize to JSON for API responses
  toJSON() {
    return {
      jobId: this.jobId,
      customerId: this.customerId,
      blNumber: this.blNumber,
      cusdecNumber: this.cusdecNumber,
      openDate: this.openDate,
      shipmentCategory: this.shipmentCategory,
      exporter: this.exporter,
      lcNumber: this.lcNumber,
      containerNumber: this.containerNumber,
      status: this.status,
      assignedTo: this.assignedTo,
      createdDate: this.createdDate,
      completedDate: this.completedDate,
      payItems: this.payItems,
      metadata: this.metadata
    };
  }
}

module.exports = Job;
