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
    transporter = null,
    lcNumber = null,
    containerNumber = null,
    status = 'Open',
    assignedTo = null, // Legacy single assignment (for backward compatibility)
    assignedUsers = [], // New: Array of assigned users
    createdDate = new Date(),
    completedDate = null,
    payItems = [],
    officePayItems = [], // New: Office pay items
    pettyCashStatus = null,
    advancePayment = 0.00, // New: Advance payment amount
    advancePaymentDate = null, // New: Date when advance was received
    advancePaymentNotes = null, // New: Notes about advance payment
    advancePaymentRecordedBy = null, // New: User who recorded the advance
    metadata = {}
  }) {
    this.jobId = jobId;
    this.customerId = customerId;
    this.blNumber = blNumber;
    this.cusdecNumber = cusdecNumber;
    this.openDate = openDate;
    this.shipmentCategory = shipmentCategory;
    this.exporter = exporter;
    this.transporter = transporter;
    this.lcNumber = lcNumber;
    this.containerNumber = containerNumber;
    this.status = status;
    this.assignedTo = assignedTo; // Legacy field
    this.assignedUsers = assignedUsers; // New field for multiple users
    this.createdDate = createdDate;
    this.completedDate = completedDate;
    this.payItems = payItems;
    this.officePayItems = officePayItems; // New field for office pay items
    this.pettyCashStatus = pettyCashStatus;
    this.advancePayment = parseFloat(advancePayment) || 0.00;
    this.advancePaymentDate = advancePaymentDate;
    this.advancePaymentNotes = advancePaymentNotes;
    this.advancePaymentRecordedBy = advancePaymentRecordedBy;
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
    return this.status === 'Open' || this.status === 'In Progress';
  }

  assignTo(userId) {
    if (!this.canBeAssigned()) {
      throw new Error(`Cannot assign job with status: ${this.status}`);
    }
    this.assignedTo = userId; // Legacy field for backward compatibility
  }

  // New method for multiple user assignment
  assignToUsers(userIds) {
    if (!this.canBeAssigned()) {
      throw new Error(`Cannot assign job with status: ${this.status}`);
    }
    this.assignedUsers = Array.isArray(userIds) ? userIds : [userIds];
    // Update legacy field with first user for backward compatibility
    this.assignedTo = this.assignedUsers.length > 0 ? this.assignedUsers[0] : null;
  }

  // Check if user is assigned to this job
  isAssignedToUser(userId) {
    return this.assignedUsers.includes(userId) || this.assignedTo === userId;
  }

  // Get all assigned user IDs
  getAssignedUserIds() {
    return this.assignedUsers.length > 0 ? this.assignedUsers : (this.assignedTo ? [this.assignedTo] : []);
  }

  // Get assignment count
  getAssignedUserCount() {
    return this.getAssignedUserIds().length;
  }

  updateStatus(newStatus) {
    const validStatuses = ['Open', 'In Progress', 'Pending Payment', 'Payment Collected', 'Overdue', 'Completed', 'Canceled'];
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
    const officePayItemsTotal = this.officePayItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
    return payItemsTotal + officePayItemsTotal;
  }

  // Advance Payment Methods
  recordAdvancePayment(amount, notes, recordedByUserId) {
    if (amount <= 0) {
      throw new Error('Advance payment amount must be greater than 0');
    }
    
    this.advancePayment = parseFloat(amount);
    this.advancePaymentDate = new Date();
    this.advancePaymentNotes = notes || null;
    this.advancePaymentRecordedBy = recordedByUserId;
  }

  updateAdvancePayment(amount, notes) {
    if (amount < 0) {
      throw new Error('Advance payment amount cannot be negative');
    }
    
    this.advancePayment = parseFloat(amount);
    this.advancePaymentNotes = notes || null;
  }

  clearAdvancePayment() {
    this.advancePayment = 0.00;
    this.advancePaymentDate = null;
    this.advancePaymentNotes = null;
    this.advancePaymentRecordedBy = null;
  }

  hasAdvancePayment() {
    return this.advancePayment > 0;
  }

  getAdvancePaymentInfo() {
    return {
      amount: this.advancePayment,
      date: this.advancePaymentDate,
      notes: this.advancePaymentNotes,
      recordedBy: this.advancePaymentRecordedBy,
      hasAdvance: this.hasAdvancePayment()
    };
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
      transporter: this.transporter,
      lcNumber: this.lcNumber,
      containerNumber: this.containerNumber,
      status: this.status,
      assignedTo: this.assignedTo, // Legacy field
      assignedUsers: this.assignedUsers, // New field
      assignedUserCount: this.getAssignedUserCount(),
      createdDate: this.createdDate,
      completedDate: this.completedDate,
      payItems: this.payItems,
      officePayItems: this.officePayItems, // New field for office pay items
      pettyCashStatus: this.pettyCashStatus,
      advancePayment: this.advancePayment,
      advancePaymentDate: this.advancePaymentDate,
      advancePaymentNotes: this.advancePaymentNotes,
      advancePaymentRecordedBy: this.advancePaymentRecordedBy,
      metadata: this.metadata
    };
  }
}

module.exports = Job;
