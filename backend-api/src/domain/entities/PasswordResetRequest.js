/**
 * Password Reset Request Domain Entity
 */
class PasswordResetRequest {
  constructor({
    requestId,
    userId,
    userName,
    userFullName,
    requestedBy,
    requestedByName,
    requestDate = new Date(),
    status = 'Pending',
    resolvedBy = null,
    resolvedByName = null,
    resolvedDate = null,
    notes = null
  }) {
    this.requestId = requestId;
    this.userId = userId;
    this.userName = userName;
    this.userFullName = userFullName;
    this.requestedBy = requestedBy;
    this.requestedByName = requestedByName;
    this.requestDate = requestDate;
    this.status = status; // Pending, Approved, Rejected, Completed
    this.resolvedBy = resolvedBy;
    this.resolvedByName = resolvedByName;
    this.resolvedDate = resolvedDate;
    this.notes = notes;
  }

  validate() {
    const errors = [];
    
    if (!this.userId) errors.push('User ID is required');
    if (!this.requestedBy) errors.push('Requested by is required');
    if (!['Pending', 'Approved', 'Rejected', 'Completed'].includes(this.status)) {
      errors.push('Invalid status');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      requestId: this.requestId,
      userId: this.userId,
      userName: this.userName,
      userFullName: this.userFullName,
      requestedBy: this.requestedBy,
      requestedByName: this.requestedByName,
      requestDate: this.requestDate,
      status: this.status,
      resolvedBy: this.resolvedBy,
      resolvedByName: this.resolvedByName,
      resolvedDate: this.resolvedDate,
      notes: this.notes
    };
  }
}

module.exports = PasswordResetRequest;
