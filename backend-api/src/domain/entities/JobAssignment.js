/**
 * JobAssignment Domain Entity
 * Represents the assignment of a user to a job
 */
class JobAssignment {
  constructor({
    assignmentId,
    jobId,
    userId,
    assignedDate = new Date(),
    assignedBy,
    isActive = true,
    notes = null,
    // Additional user info (populated from joins)
    userName = null,
    userEmail = null,
    userRole = null,
    assignedByName = null
  }) {
    this.assignmentId = assignmentId;
    this.jobId = jobId;
    this.userId = userId;
    this.assignedDate = assignedDate;
    this.assignedBy = assignedBy;
    this.isActive = isActive;
    this.notes = notes;
    // User details
    this.userName = userName;
    this.userEmail = userEmail;
    this.userRole = userRole;
    this.assignedByName = assignedByName;
  }

  // Business logic methods
  validate() {
    const errors = [];
    
    if (!this.jobId || this.jobId.trim().length === 0) {
      errors.push('Job ID is required');
    }
    
    if (!this.userId || this.userId.trim().length === 0) {
      errors.push('User ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  deactivate() {
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
  }

  addNotes(notes) {
    this.notes = notes;
  }

  // Check if assignment is currently active
  isCurrentlyActive() {
    return this.isActive === true;
  }

  // Get formatted assignment info
  getAssignmentInfo() {
    return {
      assignmentId: this.assignmentId,
      jobId: this.jobId,
      userId: this.userId,
      userName: this.userName,
      assignedDate: this.assignedDate,
      assignedBy: this.assignedBy,
      assignedByName: this.assignedByName,
      isActive: this.isActive,
      notes: this.notes
    };
  }

  // Serialize to JSON for API responses
  toJSON() {
    return {
      assignmentId: this.assignmentId,
      jobId: this.jobId,
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      userRole: this.userRole,
      assignedDate: this.assignedDate,
      assignedBy: this.assignedBy,
      assignedByName: this.assignedByName,
      isActive: this.isActive,
      notes: this.notes
    };
  }
}

module.exports = JobAssignment;