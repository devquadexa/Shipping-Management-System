class CreateSubAssignment {
  constructor(pettyCashAssignmentRepository, jobRepository, createNotification) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
    this.jobRepository = jobRepository;
    this.createNotification = createNotification;
  }

  async execute(parentAssignmentId, assignmentData) {
    // Get parent assignment
    const parent = await this.pettyCashAssignmentRepository.findById(parentAssignmentId);
    if (!parent) {
      throw new Error('Parent assignment not found');
    }

    // Create sub-assignment with parent reference
    const subAssignment = await this.pettyCashAssignmentRepository.createSubAssignment({
      ...assignmentData,
      parentAssignmentId,
      jobId: parent.jobId,
      assignedTo: parent.assignedTo,
      groupId: parent.groupId,
      isMainAssignment: false
    });

    // Auto-update job status from "Open" to "In Progress" when petty cash is assigned
    // (This handles edge cases where job status might have been reverted)
    if (this.jobRepository && parent.jobId) {
      const job = await this.jobRepository.findById(parent.jobId);
      if (job && job.status === 'Open') {
        await this.jobRepository.updateStatus(parent.jobId, 'In Progress');
      }
    }

    // Create notification for the assigned user (sub-assignment)
    if (this.createNotification && parent.assignedTo) {
      try {
        console.log(`[NOTIFICATION] Creating PETTY_CASH_ASSIGNED notification for sub-assignment to user ${parent.assignedTo}`);
        
        const notificationData = {
          userId: parent.assignedTo,
          type: 'PETTY_CASH_ASSIGNED',
          title: 'Additional Petty Cash Assigned',
          message: `Additional petty cash of LKR ${assignmentData.assignedAmount.toLocaleString()} has been assigned to you for Job #${parent.jobId}`,
          relatedId: subAssignment.assignmentId,
          relatedType: 'PETTY_CASH_ASSIGNMENT',
          metadata: {
            assignmentId: subAssignment.assignmentId,
            parentAssignmentId: parentAssignmentId,
            jobId: parent.jobId,
            assignedAmount: assignmentData.assignedAmount,
            assignedBy: assignmentData.assignedBy,
            notes: assignmentData.notes,
            isSubAssignment: true
          },
          createdBy: assignmentData.assignedBy
        };
        
        console.log(`[NOTIFICATION] Notification data: ${JSON.stringify(notificationData)}`);
        const result = await this.createNotification.execute(notificationData);
        console.log(`[NOTIFICATION] Successfully created notification for user ${parent.assignedTo}, result: ${JSON.stringify(result)}`);
      } catch (notificationError) {
        console.error('[NOTIFICATION] Error creating notification for sub-assignment:', notificationError);
        console.error('[NOTIFICATION] Error stack:', notificationError.stack);
        // Don't fail the assignment if notification creation fails
      }
    } else {
      if (!this.createNotification) {
        console.warn('[NOTIFICATION] createNotification is NOT available - notifications will not be created');
      }
    }

    return subAssignment;
  }
}

module.exports = CreateSubAssignment;
