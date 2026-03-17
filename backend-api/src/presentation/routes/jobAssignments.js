/**
 * Job Assignment Routes
 * Handles multi-user job assignment operations
 */
const express = require('express');
const router = express.Router();
const container = require('../../infrastructure/di/container');
const { auth } = require('../../middleware/auth');

// Test endpoint to verify routes are loaded
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Job assignments routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Assign multiple users to a job
router.post('/jobs/:jobId/assign-users', auth, async (req, res) => {
  try {
    console.log('=== Assign Users to Job ===');
    console.log('Job ID:', req.params.jobId);
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { jobId } = req.params;
    const { userIds, notes } = req.body;
    const assignedBy = req.user.userId;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('Invalid userIds:', userIds);
      return res.status(400).json({ 
        message: 'userIds array is required and must contain at least one user ID' 
      });
    }

    console.log('Getting assignMultipleUsersToJob from container...');
    const assignMultipleUsersToJob = container.get('assignMultipleUsersToJob');
    console.log('Executing use case...');
    const result = await assignMultipleUsersToJob.execute(jobId, userIds, assignedBy, notes);
    console.log('Success! Result:', result);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('=== Error assigning users to job ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Remove user from job
router.delete('/jobs/:jobId/users/:userId', auth, async (req, res) => {
  try {
    const { jobId, userId } = req.params;

    const removeUserFromJob = container.get('removeUserFromJob');
    const result = await removeUserFromJob.execute(jobId, userId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error removing user from job:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all assignments for a job
router.get('/jobs/:jobId/assignments', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { includeInactive } = req.query;

    const getJobAssignments = container.get('getJobAssignments');
    const result = await getJobAssignments.execute(jobId, includeInactive === 'true');

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting job assignments:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all jobs for a user
router.get('/users/:userId/jobs', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, customerId } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;

    const getUserJobs = container.get('getUserJobs');
    const result = await getUserJobs.execute(userId, filters);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting user jobs:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get current user's jobs
router.get('/my-jobs', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, customerId } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;

    const getUserJobs = container.get('getUserJobs');
    const result = await getUserJobs.execute(userId, filters);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting current user jobs:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update assignment notes
router.patch('/assignments/:assignmentId/notes', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { notes } = req.body;

    const jobAssignmentRepository = container.get('jobAssignmentRepository');
    await jobAssignmentRepository.updateNotes(parseInt(assignmentId), notes);

    res.status(200).json({
      success: true,
      message: 'Assignment notes updated successfully'
    });
  } catch (error) {
    console.error('Error updating assignment notes:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get assignment summary for multiple jobs
router.post('/jobs/assignment-summary', auth, async (req, res) => {
  try {
    const { jobIds } = req.body;

    if (!jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ 
        message: 'jobIds array is required' 
      });
    }

    const jobAssignmentRepository = container.get('jobAssignmentRepository');
    const summaries = [];

    for (const jobId of jobIds) {
      const summary = await jobAssignmentRepository.getJobAssignmentSummary(jobId);
      summaries.push(summary);
    }

    res.status(200).json({
      success: true,
      data: summaries
    });
  } catch (error) {
    console.error('Error getting assignment summaries:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;