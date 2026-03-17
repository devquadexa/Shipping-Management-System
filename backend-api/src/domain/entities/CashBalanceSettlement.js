/**
 * Cash Balance Settlement Domain Entity
 * Handles cash balance returns and overdue collections between Waff Clerks and Management
 */
class CashBalanceSettlement {
  constructor({
    settlementId,
    userId, // Waff Clerk user ID
    userName, // Waff Clerk name
    managerId, // Super Admin/Admin/Manager who handles the settlement
    managerName, // Manager name
    settlementType, // 'BALANCE_RETURN' or 'OVERDUE_COLLECTION'
    amount, // Amount to be returned or collected
    status, // 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'
    requestDate = new Date(),
    approvedDate = null,
    completedDate = null,
    notes = null, // Notes from Waff Clerk
    managerNotes = null, // Notes from Manager
    relatedAssignments = [], // Array of assignment IDs that contribute to this settlement
    createdBy,
    createdDate = new Date(),
    updatedBy = null,
    updatedDate = null
  }) {
    this.settlementId = settlementId;
    this.userId = userId;
    this.userName = userName;
    this.managerId = managerId;
    this.managerName = managerName;
    this.settlementType = settlementType;
    this.amount = parseFloat(amount) || 0.00;
    this.status = status || 'PENDING';
    this.requestDate = requestDate;
    this.approvedDate = approvedDate;
    this.completedDate = completedDate;
    this.notes = notes;
    this.managerNotes = managerNotes;
    this.relatedAssignments = relatedAssignments || [];
    this.createdBy = createdBy;
    this.createdDate = createdDate;
    this.updatedBy = updatedBy;
    this.updatedDate = updatedDate;
  }

  // Business logic methods
  validate() {
    const errors = [];
    
    if (!this.userId) errors.push('User ID is required');
    if (!this.settlementType) errors.push('Settlement type is required');
    if (!['BALANCE_RETURN', 'OVERDUE_COLLECTION'].includes(this.settlementType)) {
      errors.push('Invalid settlement type');
    }
    if (this.amount <= 0) errors.push('Amount must be greater than 0');
    if (!['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].includes(this.status)) {
      errors.push('Invalid status');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  canBeApproved() {
    return this.status === 'PENDING';
  }

  canBeCompleted() {
    return this.status === 'APPROVED';
  }

  canBeRejected() {
    return this.status === 'PENDING';
  }

  approve(managerId, managerName, managerNotes = null) {
    if (!this.canBeApproved()) {
      throw new Error(`Cannot approve settlement with status: ${this.status}`);
    }
    
    this.status = 'APPROVED';
    this.managerId = managerId;
    this.managerName = managerName;
    this.managerNotes = managerNotes;
    this.approvedDate = new Date();
    this.updatedBy = managerId;
    this.updatedDate = new Date();
  }

  complete(managerId, managerNotes = null) {
    if (!this.canBeCompleted()) {
      throw new Error(`Cannot complete settlement with status: ${this.status}`);
    }
    
    this.status = 'COMPLETED';
    if (managerNotes) {
      this.managerNotes = managerNotes;
    }
    this.completedDate = new Date();
    this.updatedBy = managerId;
    this.updatedDate = new Date();
  }

  reject(managerId, managerName, managerNotes) {
    if (!this.canBeRejected()) {
      throw new Error(`Cannot reject settlement with status: ${this.status}`);
    }
    
    this.status = 'REJECTED';
    this.managerId = managerId;
    this.managerName = managerName;
    this.managerNotes = managerNotes;
    this.updatedBy = managerId;
    this.updatedDate = new Date();
  }

  getStatusDisplay() {
    const statusMap = {
      'PENDING': 'Pending Approval',
      'APPROVED': 'Approved - Ready for Settlement',
      'COMPLETED': 'Completed',
      'REJECTED': 'Rejected'
    };
    return statusMap[this.status] || this.status;
  }

  getTypeDisplay() {
    const typeMap = {
      'BALANCE_RETURN': 'Balance Return to Management',
      'OVERDUE_COLLECTION': 'Overdue Collection from Management'
    };
    return typeMap[this.settlementType] || this.settlementType;
  }

  isBalanceReturn() {
    return this.settlementType === 'BALANCE_RETURN';
  }

  isOverdueCollection() {
    return this.settlementType === 'OVERDUE_COLLECTION';
  }

  isPending() {
    return this.status === 'PENDING';
  }

  isApproved() {
    return this.status === 'APPROVED';
  }

  isCompleted() {
    return this.status === 'COMPLETED';
  }

  isRejected() {
    return this.status === 'REJECTED';
  }

  // Serialize to JSON for API responses
  toJSON() {
    return {
      settlementId: this.settlementId,
      userId: this.userId,
      userName: this.userName,
      managerId: this.managerId,
      managerName: this.managerName,
      settlementType: this.settlementType,
      settlementTypeDisplay: this.getTypeDisplay(),
      amount: this.amount,
      status: this.status,
      statusDisplay: this.getStatusDisplay(),
      requestDate: this.requestDate,
      approvedDate: this.approvedDate,
      completedDate: this.completedDate,
      notes: this.notes,
      managerNotes: this.managerNotes,
      relatedAssignments: this.relatedAssignments,
      createdBy: this.createdBy,
      createdDate: this.createdDate,
      updatedBy: this.updatedBy,
      updatedDate: this.updatedDate
    };
  }
}

module.exports = CashBalanceSettlement;