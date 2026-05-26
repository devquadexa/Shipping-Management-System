/**
 * Debug script to test notification creation
 * Run with: node debug-notification-issue.js
 */

// Load environment variables
require('dotenv').config();

const container = require('./src/infrastructure/di/container');

async function debugNotificationIssue() {
  console.log('\n========================================');
  console.log('=== NOTIFICATION DEBUG SCRIPT ===');
  console.log('========================================\n');

  try {
    // Step 1: Check if notification repository exists
    console.log('Step 1: Checking notification repository...');
    const notificationRepository = container.get('notificationRepository');
    console.log('✅ Notification repository exists:', !!notificationRepository);
    console.log('   Type:', typeof notificationRepository);
    console.log('   Has create method:', typeof notificationRepository.create === 'function');
    console.log('   Has generateNextId method:', typeof notificationRepository.generateNextId === 'function');

    // Step 2: Check if createNotification use case exists
    console.log('\nStep 2: Checking createNotification use case...');
    const createNotification = container.get('createNotification');
    console.log('✅ createNotification exists:', !!createNotification);
    console.log('   Type:', typeof createNotification);
    console.log('   Has execute method:', typeof createNotification.execute === 'function');

    // Step 3: Check if assignMultipleUsersToJob has createNotification
    console.log('\nStep 3: Checking assignMultipleUsersToJob...');
    const assignMultipleUsersToJob = container.get('assignMultipleUsersToJob');
    console.log('✅ assignMultipleUsersToJob exists:', !!assignMultipleUsersToJob);
    console.log('   Has createNotification:', !!assignMultipleUsersToJob.createNotification);
    console.log('   createNotification type:', typeof assignMultipleUsersToJob.createNotification);

    // Step 4: Test notification ID generation
    console.log('\nStep 4: Testing notification ID generation...');
    const nextId = await notificationRepository.generateNextId();
    console.log('✅ Generated notification ID:', nextId);

    // Step 5: Check existing notifications in database
    console.log('\nStep 5: Checking existing notifications...');
    const { getConnection, sql } = require('./src/config/database');
    const pool = await getConnection();
    
    // Check if table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Notifications'
    `);
    console.log('✅ Notifications table exists:', tableCheck.recordset[0].tableExists === 1);

    if (tableCheck.recordset[0].tableExists === 1) {
      // Get notification count
      const countResult = await pool.request().query('SELECT COUNT(*) as count FROM Notifications');
      console.log('   Total notifications in database:', countResult.recordset[0].count);

      // Get all notifications
      const allNotifications = await pool.request().query('SELECT * FROM Notifications ORDER BY createdDate DESC');
      console.log('   Notifications:');
      if (allNotifications.recordset.length === 0) {
        console.log('   ⚠️  No notifications found in database');
      } else {
        allNotifications.recordset.forEach(notif => {
          console.log(`   - ${notif.notificationId}: ${notif.title} (User: ${notif.userId}, Read: ${notif.isRead})`);
        });
      }
    } else {
      console.log('   ❌ Notifications table does NOT exist!');
      console.log('   Please run: create-notifications-system.sql');
    }

    // Step 6: Test creating a notification
    console.log('\nStep 6: Testing notification creation...');
    const testNotificationData = {
      userId: 'USER0002', // waff clerk 01
      type: 'JOB_ASSIGNED',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      relatedId: 'TEST001',
      relatedType: 'JOB',
      metadata: { test: true },
      createdBy: 'ADMIN'
    };

    console.log('   Creating test notification with data:', JSON.stringify(testNotificationData, null, 2));
    const createdNotification = await createNotification.execute(testNotificationData);
    console.log('✅ Test notification created successfully!');
    console.log('   Notification ID:', createdNotification.notificationId);
    console.log('   Full notification:', JSON.stringify(createdNotification, null, 2));

    // Step 7: Verify notification was saved
    console.log('\nStep 7: Verifying notification was saved...');
    const savedNotification = await notificationRepository.findById(createdNotification.notificationId);
    if (savedNotification) {
      console.log('✅ Notification found in database!');
      console.log('   Title:', savedNotification.title);
      console.log('   Message:', savedNotification.message);
      console.log('   User ID:', savedNotification.userId);
      console.log('   Is Read:', savedNotification.isRead);
    } else {
      console.log('❌ Notification NOT found in database!');
    }

    // Step 8: Check unread count for user
    console.log('\nStep 8: Checking unread count for USER0002...');
    const unreadCount = await notificationRepository.getUnreadCount('USER0002');
    console.log('✅ Unread count for USER0002:', unreadCount);

    console.log('\n========================================');
    console.log('=== DEBUG COMPLETE ===');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugNotificationIssue();
