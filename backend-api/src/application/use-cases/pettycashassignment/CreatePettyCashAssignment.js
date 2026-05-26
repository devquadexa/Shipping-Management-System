class CreatePettyCashAssignment {
  constructor(pettyCashAssignmentRepository, billRepository, jobRepository, createNotification) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
    this.billRepository = billRepository;
    this.jobRepository = jobRepository;
    this.createNotification = createNotification;
  }

  async execute(assignmentData) {
    // Validate required fields
    if (!assignmentData.jobId || !assignmentData.assignedTo || !assignmentData.assignedAmount) {
      throw new Error('Job ID, assigned user, and amount are required');
    }

    if (assignmentData.assignedAmount <= 0) {
      throw new Error('Assigned amount must be greater than 0');
    }

    // Check if a bill has been generated for this job
    if (this.billRepository) {
      const existingBills = await this.billRepository.findByJob(assignmentData.jobId);
      if (existingBills && existingBills.length > 0) {
        throw new Error('Cannot create petty cash assignment: a bill has already been generated for this job');
      }
    }

    // Create new assignment
    // NOTE: This ALWAYS creates a new assignment record with a new assignmentId,
    // even if there are existing assignments for the same job+user combination.
    // Multiple assignments for the same job+user are grouped together using groupId.
    // This allows creating new assignments after "Full Petty Cash Returned" status.
    const assignment = await this.pettyCashAssignmentRepository.create(assignmentData);

    // Auto-update job status from "Open" to "In Progress" when petty cash is assigned
    if (this.jobRepository) {
      const job = await this.jobRepository.findById(assignmentData.jobId);
      if (job && job.status === 'Open') {
        await this.jobRepository.updateStatus(assignmentData.jobId, 'In Progress');
      }
    }

    // Create notification for the assigned user
    if (this.createNotification && assignmentData.assignedTo) {
      try {
        console.log(`[NOTIFICATION] Creating PETTY_CASH_ASSIGNED notification for user ${assignmentData.assignedTo}`);
        
        const notificationData = {
          userId: assignmentData.assignedTo,
          type: 'PETTY_CASH_ASSIGNED',
          title: 'Petty Cash Assigned',
          message: `Petty cash of LKR ${assignmentData.assignedAmount.toLocaleString()} has been assigned to you for Job #${assignmentData.jobId}`,
          relatedId: String(assignment.assignmentId), // Convert to string
          relatedType: 'PETTY_CASH_ASSIGNMENT',
          metadata: {
            assignmentId: assignment.assignmentId,
            jobId: assignmentData.jobId,
            assignedAmount: assignmentData.assignedAmount,
            assignedBy: assignmentData.assignedBy,
            notes: assignmentData.notes
          },
          createdBy: assignmentData.assignedBy
        };
        
        console.log(`[NOTIFICATION] Notification data: ${JSON.stringify(notificationData)}`);
        const result = await this.createNotification.execute(notificationData);
        console.log(`[NOTIFICATION] Successfully created notification for user ${assignmentData.assignedTo}, result: ${JSON.stringify(result)}`);
      } catch (notificationError) {
        console.error('[NOTIFICATION] Error creating notification for petty cash assignment:', notificationError);
        console.error('[NOTIFICATION] Error stack:', notificationError.stack);
        // Don't fail the assignment if notification creation fails
      }
    } else {
      if (!this.createNotification) {
        console.warn('[NOTIFICATION] createNotification is NOT available - notifications will not be created');
      }
    }

    return assignment;
  }
}

module.exports = CreatePettyCashAssignment;
