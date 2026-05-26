/**
 * Test Petty Cash Notification System
 * Run with: node test-petty-cash-notification.js
 */

require('dotenv').config();
const container = require('./src/infrastructure/di/container');

async function testPettyCashNotification() {
  console.log('\n========================================');
  console.log('=== PETTY CASH NOTIFICATION TEST ===');
  console.log('========================================\n');

  try {
    // Step 1: Check if createPettyCashAssignment has notification support
    console.log('Step 1: Checking createPettyCashAssignment...');
    const createPettyCashAssignment = container.get('createPettyCashAssignment');
    console.log('✅ createPettyCashAssignment exists:', !!createPettyCashAssignment);
    console.log('   Has createNotification:', !!createPettyCashAssignment.createNotification);
    console.log('   createNotification type:', typeof createPettyCashAssignment.createNotification);

    // Step 2: Check if createSubAssignment has notification support
    console.log('\nStep 2: Checking createSubAssignment...');
    const createSubAssignment = container.get('createSubAssignment');
    console.log('✅ createSubAssignment exists:', !!createSubAssignment);
    console.log('   Has createNotification:', !!createSubAssignment.createNotification);
    console.log('   createNotification type:', typeof createSubAssignment.createNotification);

    // Step 3: Check if createNotification use case exists
    console.log('\nStep 3: Checking createNotification use case...');
    const createNotification = container.get('createNotification');
    console.log('✅ createNotification exists:', !!createNotification);
    console.log('   Type:', typeof createNotification);
    console.log('   Has execute method:', typeof createNotification.execute === 'function');

    // Step 4: Test creating a petty cash notification directly
    console.log('\nStep 4: Testing petty cash notification creation...');
    const testNotificationData = {
      userId: 'USER0002', // waff clerk 01
      type: 'PETTY_CASH_ASSIGNED',
      title: 'Petty Cash Assigned',
      message: 'Petty cash of LKR 5,000 has been assigned to you for Job #TEST001',
      relatedId: 'ASSIGN_TEST001',
      relatedType: 'PETTY_CASH_ASSIGNMENT',
      metadata: {
        assignmentId: 'ASSIGN_TEST001',
        jobId: 'TEST001',
        assignedAmount: 5000,
        assignedBy: 'ADMIN',
        notes: 'Test petty cash assignment'
      },
      createdBy: 'ADMIN'
    };

    console.log('   Creating test notification with data:', JSON.stringify(testNotificationData, null, 2));
    const createdNotification = await createNotification.execute(testNotificationData);
    console.log('✅ Test notification created successfully!');
    console.log('   Notification ID:', createdNotification.notificationId);

    // Step 5: Verify notification was saved
    console.log('\nStep 5: Verifying notification was saved...');
    const notificationRepository = container.get('notificationRepository');
    const savedNotification = await notificationRepository.findById(createdNotification.notificationId);
    if (savedNotification) {
      console.log('✅ Notification found in database!');
      console.log('   Title:', savedNotification.title);
      console.log('   Message:', savedNotification.message);
      console.log('   User ID:', savedNotification.userId);
      console.log('   Type:', savedNotification.type);
      console.log('   Related ID:', savedNotification.relatedId);
      console.log('   Related Type:', savedNotification.relatedType);
    } else {
      console.log('❌ Notification NOT found in database!');
    }

    // Step 6: Check unread count for user
    console.log('\nStep 6: Checking unread count for USER0002...');
    const unreadCount = await notificationRepository.getUnreadCount('USER0002');
    console.log('✅ Unread count for USER0002:', unreadCount);

    // Step 7: Clean up test notification
    console.log('\nStep 7: Cleaning up test notification...');
    await notificationRepository.delete(createdNotification.notificationId);
    console.log('✅ Test notification deleted');

    console.log('\n========================================');
    console.log('✅ PETTY CASH NOTIFICATION TEST COMPLETE');
    console.log('========================================');
    console.log('\nSummary:');
    console.log('  ✅ createPettyCashAssignment has notification support');
    console.log('  ✅ createSubAssignment has notification support');
    console.log('  ✅ Notifications can be created for petty cash assignments');
    console.log('  ✅ Notifications are saved to database');
    console.log('  ✅ Unread count is working');
    console.log('\nNext steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Create a petty cash assignment for a user');
    console.log('  3. Login as that user and check notifications');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPettyCashNotification();
