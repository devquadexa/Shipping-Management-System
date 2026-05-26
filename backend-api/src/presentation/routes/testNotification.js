/**
 * Test Notification Route
 * Simple endpoint to test if notification creation works
 */
const express = require('express');
const router = express.Router();

module.exports = (container) => {
  // Test endpoint to create a notification
  router.post('/test-create', async (req, res) => {
    try {
      console.log('\n========================================');
      console.log('TEST: Creating test notification');
      console.log('========================================');
      
      const createNotification = container.get('createNotification');
      console.log('createNotification available:', !!createNotification);
      
      const testNotification = await createNotification.execute({
        userId: req.body.userId || 'USER0002',
        type: 'JOB_ASSIGNED',
        title: 'Test Notification',
        message: 'This is a test notification created via API',
        relatedId: 'TEST001',
        relatedType: 'TEST',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        },
        createdBy: 'SYSTEM'
      });
      
      console.log('Test notification created:', testNotification);
      console.log('========================================\n');
      
      res.status(200).json({
        success: true,
        message: 'Test notification created successfully',
        notification: testNotification
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test notification',
        error: error.message
      });
    }
  });
  
  // Test endpoint to check DI container
  router.get('/test-di', async (req, res) => {
    try {
      console.log('\n========================================');
      console.log('TEST: Checking DI container');
      console.log('========================================');
      
      const createNotification = container.get('createNotification');
      const assignMultipleUsersToJob = container.get('assignMultipleUsersToJob');
      
      const result = {
        createNotification: {
          available: !!createNotification,
          type: typeof createNotification,
          hasExecute: typeof createNotification?.execute === 'function'
        },
        assignMultipleUsersToJob: {
          available: !!assignMultipleUsersToJob,
          type: typeof assignMultipleUsersToJob,
          hasExecute: typeof assignMultipleUsersToJob?.execute === 'function',
          hasCreateNotification: !!assignMultipleUsersToJob?.createNotification
        }
      };
      
      console.log('DI Container check:', JSON.stringify(result, null, 2));
      console.log('========================================\n');
      
      res.status(200).json({
        success: true,
        message: 'DI container check complete',
        result
      });
    } catch (error) {
      console.error('Error checking DI container:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check DI container',
        error: error.message
      });
    }
  });
  
  return router;
};
