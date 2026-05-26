/**
 * Verify Petty Cash Notification Fix
 * Run this after restarting the server to verify notifications are working
 * Run with: node verify-notification-fix.js
 */

require('dotenv').config();
const { getConnection } = require('./src/config/database');

async function verifyNotificationFix() {
  console.log('\n========================================');
  console.log('=== VERIFY NOTIFICATION FIX ===');
  console.log('========================================\n');

  try {
    const pool = await getConnection();
    
    // Check 1: Verify Notifications table exists
    console.log('✓ Check 1: Verifying Notifications table exists...');
    const tableCheck = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Notifications'
    `);
    
    if (tableCheck.recordset.length === 0) {
      console.log('❌ FAIL: Notifications table does not exist');
      console.log('   Run: create-notifications-system.sql');
      process.exit(1);
    }
    console.log('   ✅ PASS: Notifications table exists\n');
    
    // Check 2: Count total notifications
    console.log('✓ Check 2: Counting notifications...');
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM Notifications
    `);
    const totalNotifications = countResult.recordset[0].total;
    console.log(`   ✅ Total notifications in database: ${totalNotifications}\n`);
    
    // Check 3: Check petty cash assignment notifications
    console.log('✓ Check 3: Checking petty cash assignment notifications...');
    const pettyCashNotifs = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Notifications 
      WHERE type = 'PETTY_CASH_ASSIGNED'
    `);
    const pettyCashCount = pettyCashNotifs.recordset[0].total;
    console.log(`   ✅ Petty cash notifications: ${pettyCashCount}\n`);
    
    // Check 4: Get recent petty cash assignments
    console.log('✓ Check 4: Checking recent petty cash assignments...');
    const recentAssignments = await pool.request().query(`
      SELECT TOP 5
        assignmentId,
        jobId,
        assignedTo,
        assignedAmount,
        assignedDate
      FROM PettyCashAssignments
      ORDER BY assignedDate DESC
    `);
    
    console.log(`   Found ${recentAssignments.recordset.length} recent assignments\n`);
    
    // Check 5: Check which assignments have notifications
    console.log('✓ Check 5: Checking which assignments have notifications...');
    let assignmentsWithNotifications = 0;
    let assignmentsWithoutNotifications = 0;
    
    for (const assignment of recentAssignments.recordset) {
      const notifCheck = await pool.request().query(`
        SELECT notificationId 
        FROM Notifications 
        WHERE relatedId = '${assignment.assignmentId}'
        AND type = 'PETTY_CASH_ASSIGNED'
      `);
      
      if (notifCheck.recordset.length > 0) {
        assignmentsWithNotifications++;
        console.log(`   ✅ Assignment ${assignment.assignmentId} (${assignment.assignedDate.toISOString().split('T')[0]}) - HAS notification`);
      } else {
        assignmentsWithoutNotifications++;
        console.log(`   ⚠️  Assignment ${assignment.assignmentId} (${assignment.assignedDate.toISOString().split('T')[0]}) - NO notification`);
      }
    }
    
    console.log('');
    console.log(`   Summary: ${assignmentsWithNotifications} with notifications, ${assignmentsWithoutNotifications} without\n`);
    
    // Check 6: Get most recent notification
    console.log('✓ Check 6: Getting most recent petty cash notification...');
    const recentNotif = await pool.request().query(`
      SELECT TOP 1
        notificationId,
        userId,
        title,
        message,
        createdDate,
        isRead
      FROM Notifications
      WHERE type = 'PETTY_CASH_ASSIGNED'
      ORDER BY createdDate DESC
    `);
    
    if (recentNotif.recordset.length > 0) {
      const notif = recentNotif.recordset[0];
      console.log('   ✅ Most recent notification:');
      console.log(`      ID: ${notif.notificationId}`);
      console.log(`      User: ${notif.userId}`);
      console.log(`      Title: ${notif.title}`);
      console.log(`      Created: ${notif.createdDate}`);
      console.log(`      Read: ${notif.isRead ? 'Yes' : 'No'}`);
    } else {
      console.log('   ⚠️  No petty cash notifications found');
    }
    
    console.log('\n========================================');
    console.log('=== VERIFICATION RESULTS ===');
    console.log('========================================\n');
    
    if (assignmentsWithoutNotifications === 0 && assignmentsWithNotifications > 0) {
      console.log('✅ SUCCESS: All recent assignments have notifications!');
      console.log('   The notification system is working correctly.\n');
    } else if (assignmentsWithoutNotifications > 0 && assignmentsWithNotifications > 0) {
      console.log('⚠️  PARTIAL: Some assignments have notifications, some don\'t');
      console.log('   This is expected if:');
      console.log('   - Old assignments were created before notification feature');
      console.log('   - Server was restarted recently');
      console.log('\n   Action: Create a NEW petty cash assignment and verify it gets a notification.\n');
    } else if (assignmentsWithNotifications === 0 && recentAssignments.recordset.length > 0) {
      console.log('❌ ISSUE: No recent assignments have notifications');
      console.log('   This means the server is still running old code.');
      console.log('\n   Action Required:');
      console.log('   1. Stop the backend server (Ctrl+C)');
      console.log('   2. Restart: npm start');
      console.log('   3. Wait for "Server running on port 5000"');
      console.log('   4. Create a new petty cash assignment');
      console.log('   5. Run this script again\n');
    } else {
      console.log('ℹ️  INFO: No recent assignments found');
      console.log('   Create a petty cash assignment to test notifications.\n');
    }
    
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

verifyNotificationFix();
