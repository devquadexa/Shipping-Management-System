/**
 * Assign Multiple Users to Job Use Case
 * Handles assigning one job to multiple users simultaneously
 * Also creates notifications for assigned users
 */
class AssignMultipleUsersToJob {
  constructor(jobRepository, userRepository, jobAssignmentRepository, createNotification) {
    this.jobRepository = jobRepository;
    this.userRepository = userRepository;
    this.jobAssignmentRepository = jobAssignmentRepository;
    this.createNotification = createNotification;
  }

  async execute(jobId, userIds, assignedBy, notes = null) {
    console.log(`[AssignMultipleUsersToJob] Starting job assignment - jobId: ${jobId}, userIds: ${JSON.stringify(userIds)}, assignedBy: ${assignedBy}`);
    console.log(`[AssignMultipleUsersToJob] createNotification available: ${!!this.createNotification}`);
    
    // Validate inputs
    if (!jobId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('Job ID and user IDs array are required');
    }

    if (!assignedBy) {
      throw new Error('AssignedBy user ID is required');
    }

    // Get job
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Check if job can be assigned
    if (!job.canBeAssigned()) {
      throw new Error(`Cannot assign job with status: ${job.status}`);
    }

    // Verify all users exist
    const validUserIds = [];
    const invalidUserIds = [];
    
    for (const userId of userIds) {
      const user = await this.userRepository.findById(userId);
      if (user) {
        validUserIds.push(userId);
      } else {
        invalidUserIds.push(userId);
      }
    }

    if (invalidUserIds.length > 0) {
      throw new Error(`Invalid user IDs: ${invalidUserIds.join(', ')}`);
    }

    // Verify assignedBy user exists
    const assignedByUser = await this.userRepository.findById(assignedBy);
    if (!assignedByUser) {
      throw new Error('AssignedBy user not found');
    }

    // Assign users to job using repository
    const assignedCount = await this.jobAssignmentRepository.assignUsersToJob(
      jobId, 
      validUserIds, 
      assignedBy, 
      notes
    );

    // Update job entity with assigned users
    job.assignToUsers(validUserIds);

    // Get assignment summary
    const summary = await this.jobAssignmentRepository.getJobAssignmentSummary(jobId);

    // Create notifications for each assigned user
    if (this.createNotification) {
      try {
        console.log(`[NOTIFICATION] createNotification is available, creating notifications for ${validUserIds.length} assigned users`);
        for (const userId of validUserIds) {
          console.log(`[NOTIFICATION] Creating JOB_ASSIGNED notification for user ${userId}, job ${jobId}`);
          const notificationData = {
            userId,
            type: 'JOB_ASSIGNED',
            title: 'New Job Assigned',
            message: `You have been assigned to Job #${jobId}`,
            relatedId: jobId,
            relatedType: 'JOB',
            metadata: {
              jobId,
              assignedBy,
              assignmentNotes: notes
            },
            createdBy: assignedBy
          };
          console.log(`[NOTIFICATION] Notification data: ${JSON.stringify(notificationData)}`);
          
          const result = await this.createNotification.execute(notificationData);
          console.log(`[NOTIFICATION] Successfully created notification for user ${userId}, result: ${JSON.stringify(result)}`);
        }
      } catch (notificationError) {
        console.error('[NOTIFICATION] Error creating notifications for job assignment:', notificationError);
        console.error('[NOTIFICATION] Error stack:', notificationError.stack);
        // Don't fail the assignment if notification creation fails
      }
    } else {
      console.warn('[NOTIFICATION] createNotification is NOT available - notifications will not be created');
      console.warn('[NOTIFICATION] this.createNotification:', this.createNotification);
      console.warn('[NOTIFICATION] typeof this.createNotification:', typeof this.createNotification);
    }

    return {
      jobId,
      assignedCount,
      totalAssignedUsers: summary.assignedUserCount,
      assignedUserIds: validUserIds,
      assignedUserNames: summary.assignedUserNames,
      message: `Successfully assigned ${assignedCount} users to job ${jobId}`
    };
  }
}

module.exports = AssignMultipleUsersToJob;