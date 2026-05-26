/**
 * Test Notification System
 * Run this to verify notifications are being created
 */

const { getConnection, sql } = require('./src/config/database');
const container = require('./src/infrastructure/di/container');

async function testNotificationSystem() {
  console.log('\n========================================');
  console.log('TESTING NOTIFICATION SYSTEM');
  console.log('========================================\n');

  try {
    // Test 1: Check if createNotification is available
    console.log('Test 1: Check if createNotification is available');
    const createNotification = container.get('createNotification');
    console.log('✅ createNotification is available:', !!createNotification);
    console.log('   Type:', typeof createNotification);
    console.log('   Has execute method:', typeof createNotification.execute === 'function');

    // Test 2: Create a test notification
    console.log('\nTest 2: Create a test notification');
    const testNotification = await createNotification.execute({
      userId: 'USER0002',
      type: 'JOB_ASSIGNED',
      title: 'Test Notification',
      message: 'This is a test notification',
      relatedId: 'JOB0001',
      relatedType: 'JOB',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      },
      createdBy: 'USER0001'
    });
    console.log('✅ Notification created successfully');
    console.log('   Notification ID:', testNotification.notificationId);
    console.log('   User ID:', testNotification.userId);
    console.log('   Type:', testNotification.type);

    // Test 3: Query the database
    console.log('\nTest 3: Query Notifications table');
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT TOP 5 * FROM Notifications ORDER BY createdDate DESC');
    console.log('✅ Query successful');
    console.log('   Total records:', result.recordset.length);
    if (result.recordset.length > 0) {
      console.log('   Latest notification:');
      const latest = result.recordset[0];
      console.log('     - ID:', latest.notificationId);
      console.log('     - User:', latest.userId);
      console.log('     - Type:', latest.type);
      console.log('     - Title:', latest.title);
      console.log('     - Created:', latest.createdDate);
    }

    // Test 4: Check DI container
    console.log('\nTest 4: Check DI container');
    const assignMultipleUsersToJob = container.get('assignMultipleUsersToJob');
    console.log('✅ assignMultipleUsersToJob is available:', !!assignMultipleUsersToJob);
    console.log('   Has execute method:', typeof assignMultipleUsersToJob.execute === 'function');
    console.log('   Has createNotification:', !!assignMultipleUsersToJob.createNotification);

    console.log('\n========================================');
    console.log('✅ ALL TESTS PASSED');
    console.log('========================================\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n========================================\n');
    process.exit(1);
  }
}

testNotificationSystem();
