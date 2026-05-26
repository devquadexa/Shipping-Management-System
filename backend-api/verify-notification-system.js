/**
 * Verify Notification System is Ready
 * Run with: node verify-notification-system.js
 */

require('dotenv').config();
const { getConnection } = require('./src/config/database');
const container = require('./src/infrastructure/di/container');

async function verifyNotificationSystem() {
  console.log('\n========================================');
  console.log('=== NOTIFICATION SYSTEM VERIFICATION ===');
  console.log('========================================\n');

  let allChecksPass = true;

  try {
    const pool = await getConnection();
    
    // Check 1: Table exists
    console.log('✓ Check 1: Notifications table exists');
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Notifications'
    `);
    
    if (tableCheck.recordset[0].tableExists === 0) {
      console.log('  ❌ FAIL: Notifications table does not exist');
      allChecksPass = false;
    } else {
      console.log('  ✅ PASS\n');
    }
    
    // Check 2: Required columns exist
    console.log('✓ Check 2: Required columns exist');
    const requiredColumns = [
      'notificationId', 'userId', 'type', 'title', 'message',
      'relatedId', 'relatedType', 'isRead', 'readDate',
      'metadata', 'createdDate', 'createdBy'
    ];
    
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Notifications'
    `);
    
    const existingColumns = columns.recordset.map(c => c.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`  ❌ FAIL: Missing columns: ${missingColumns.join(', ')}`);
      console.log('  Run: node fix-notifications-table.js');
      allChecksPass = false;
    } else {
      console.log('  ✅ PASS - All required columns present\n');
    }
    
    // Check 3: Indexes exist
    console.log('✓ Check 3: Indexes exist');
    const indexes = await pool.request().query(`
      SELECT COUNT(*) as indexCount
      FROM sys.indexes 
      WHERE object_id = OBJECT_ID('Notifications')
      AND name IS NOT NULL
    `);
    
    if (indexes.recordset[0].indexCount < 5) {
      console.log(`  ⚠️  WARNING: Only ${indexes.recordset[0].indexCount} indexes found (expected 6+)`);
      console.log('  Consider running: create-notifications-system.sql');
    } else {
      console.log(`  ✅ PASS - ${indexes.recordset[0].indexCount} indexes found\n`);
    }
    
    // Check 4: Foreign key constraint exists
    console.log('✓ Check 4: Foreign key constraint exists');
    const fkCheck = await pool.request().query(`
      SELECT COUNT(*) as fkCount
      FROM sys.foreign_keys
      WHERE parent_object_id = OBJECT_ID('Notifications')
      AND name = 'FK_Notifications_UserId'
    `);
    
    if (fkCheck.recordset[0].fkCount === 0) {
      console.log('  ⚠️  WARNING: Foreign key constraint not found');
      console.log('  This is optional but recommended');
    } else {
      console.log('  ✅ PASS\n');
    }
    
    // Check 5: Notification repository is configured
    console.log('✓ Check 5: Notification repository is configured');
    const notificationRepository = container.get('notificationRepository');
    if (!notificationRepository) {
      console.log('  ❌ FAIL: Notification repository not found in container');
      allChecksPass = false;
    } else {
      console.log('  ✅ PASS\n');
    }
    
    // Check 6: CreateNotification use case is configured
    console.log('✓ Check 6: CreateNotification use case is configured');
    const createNotification = container.get('createNotification');
    if (!createNotification) {
      console.log('  ❌ FAIL: CreateNotification use case not found in container');
      allChecksPass = false;
    } else {
      console.log('  ✅ PASS\n');
    }
    
    // Check 7: AssignMultipleUsersToJob has notification support
    console.log('✓ Check 7: AssignMultipleUsersToJob has notification support');
    const assignMultipleUsersToJob = container.get('assignMultipleUsersToJob');
    if (!assignMultipleUsersToJob || !assignMultipleUsersToJob.createNotification) {
      console.log('  ❌ FAIL: AssignMultipleUsersToJob does not have notification support');
      allChecksPass = false;
    } else {
      console.log('  ✅ PASS\n');
    }
    
    // Check 8: Can generate notification IDs
    console.log('✓ Check 8: Can generate notification IDs');
    try {
      const nextId = await notificationRepository.generateNextId();
      if (!nextId || !nextId.startsWith('NOTIF')) {
        console.log(`  ❌ FAIL: Invalid notification ID generated: ${nextId}`);
        allChecksPass = false;
      } else {
        console.log(`  ✅ PASS - Generated ID: ${nextId}\n`);
      }
    } catch (error) {
      console.log(`  ❌ FAIL: Error generating ID: ${error.message}`);
      allChecksPass = false;
    }
    
    // Final summary
    console.log('========================================');
    if (allChecksPass) {
      console.log('✅ ALL CHECKS PASSED');
      console.log('========================================');
      console.log('\nNotification system is ready to use!');
      console.log('\nNext steps:');
      console.log('1. Restart your backend server (if running)');
      console.log('2. Create a new job and assign it to a user');
      console.log('3. Login as that user and check notifications');
    } else {
      console.log('❌ SOME CHECKS FAILED');
      console.log('========================================');
      console.log('\nPlease fix the issues above before using the notification system.');
      console.log('\nTo fix:');
      console.log('1. Run: node fix-notifications-table.js');
      console.log('2. Run this verification again');
    }
    console.log('');
    
    process.exit(allChecksPass ? 0 : 1);
  } catch (error) {
    console.error('\n❌ VERIFICATION ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

verifyNotificationSystem();
