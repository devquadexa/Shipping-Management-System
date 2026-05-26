/**
 * Debug Petty Cash Assignment Notification Issue
 * Run with: node debug-petty-cash-assignment.js
 */

require('dotenv').config();
const container = require('./src/infrastructure/di/container');
const { getConnection } = require('./src/config/database');

async function debugPettyCashAssignment() {
  console.log('\n========================================');
  console.log('=== DEBUG PETTY CASH ASSIGNMENT ===');
  console.log('========================================\n');

  try {
    const pool = await getConnection();
    
    // Step 1: Check container setup
    console.log('Step 1: Checking container setup...');
    const createPettyCashAssignment = container.get('createPettyCashAssignment');
    const createNotification = container.get('createNotification');
    
    console.log('✅ createPettyCashAssignment exists:', !!createPettyCashAssignment);
    console.log('   Has createNotification:', !!createPettyCashAssignment.createNotification);
    console.log('   createNotification is same instance:', createPettyCashAssignment.createNotification === createNotification);
    console.log('   createNotification type:', typeof createPettyCashAssignment.createNotification);
    
    if (createPettyCashAssignment.createNotification) {
      console.log('   Has execute method:', typeof createPettyCashAssignment.createNotification.execute === 'function');
    }
    
    // Step 2: Check recent petty cash assignments
    console.log('\nStep 2: Checking recent petty cash assignments...');
    const recentAssignments = await pool.request().query(`
      SELECT TOP 5
        assignmentId,
        jobId,
        assignedTo,
        assignedAmount,
        assignedBy,
        assignedDate,
        notes
      FROM PettyCashAssignments
      ORDER BY assignedDate DESC
    `);
    
    console.log(`Found ${recentAssignments.recordset.length} recent assignments:`);
    recentAssignments.recordset.forEach((assignment, index) => {
      console.log(`\n  [${index + 1}] Assignment ID: ${assignment.assignmentId}`);
      console.log(`      Job ID: ${assignment.jobId}`);
      console.log(`      Assigned To: ${assignment.assignedTo}`);
      console.log(`      Amount: LKR ${assignment.assignedAmount}`);
      console.log(`      Assigned By: ${assignment.assignedBy}`);
      console.log(`      Date: ${assignment.assignedDate}`);
    });
    
    // Step 3: Check if notifications exist for these assignments
    console.log('\nStep 3: Checking notifications for recent assignments...');
    
    if (recentAssignments.recordset.length > 0) {
      const assignmentIds = recentAssignments.recordset.map(a => `'${a.assignmentId}'`).join(',');
      const notifications = await pool.request().query(`
        SELECT 
          notificationId,
          userId,
          type,
          title,
          message,
          relatedId,
          createdDate,
          isRead
        FROM Notifications
        WHERE relatedId IN (${assignmentIds})
        ORDER BY createdDate DESC
      `);
      
      console.log(`Found ${notifications.recordset.length} notifications for these assignments:`);
      
      if (notifications.recordset.length === 0) {
        console.log('  ⚠️  NO NOTIFICATIONS FOUND for recent petty cash assignments!');
        console.log('  This means notifications are not being created.');
      } else {
        notifications.recordset.forEach((notif, index) => {
          console.log(`\n  [${index + 1}] Notification ID: ${notif.notificationId}`);
          console.log(`      User: ${notif.userId}`);
          console.log(`      Type: ${notif.type}`);
          console.log(`      Title: ${notif.title}`);
          console.log(`      Related Assignment: ${notif.relatedId}`);
          console.log(`      Created: ${notif.createdDate}`);
        });
      }
    }
    
    // Step 4: Test creating a notification manually
    console.log('\nStep 4: Testing manual notification creation...');
    
    const testNotificationData = {
      userId: 'USER0002',
      type: 'PETTY_CASH_ASSIGNED',
      title: 'Test Petty Cash Notification',
      message: 'This is a test notification for petty cash assignment',
      relatedId: 'TEST_ASSIGN_001',
      relatedType: 'PETTY_CASH_ASSIGNMENT',
      metadata: {
        test: true,
        assignmentId: 'TEST_ASSIGN_001',
        jobId: 'TEST_JOB_001',
        assignedAmount: 1000
      },
      createdBy: 'ADMIN'
    };
    
    console.log('Creating test notification...');
    const testNotification = await createNotification.execute(testNotificationData);
    console.log('✅ Test notification created:', testNotification.notificationId);
    
    // Clean up test notification
    await pool.request().query(`DELETE FROM Notifications WHERE notificationId = '${testNotification.notificationId}'`);
    console.log('✅ Test notification cleaned up');
    
    // Step 5: Check the actual code
    console.log('\nStep 5: Checking CreatePettyCashAssignment code...');
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'src', 'application', 'use-cases', 'pettycashassignment', 'CreatePettyCashAssignment.js');
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Check if createNotification is in constructor
      const hasCreateNotificationParam = fileContent.includes('constructor(pettyCashAssignmentRepository, billRepository, jobRepository, createNotification)');
      console.log('   Has createNotification in constructor:', hasCreateNotificationParam);
      
      // Check if this.createNotification is assigned
      const hasCreateNotificationAssignment = fileContent.includes('this.createNotification = createNotification');
      console.log('   Has this.createNotification assignment:', hasCreateNotificationAssignment);
      
      // Check if notification creation code exists
      const hasNotificationCreation = fileContent.includes('PETTY_CASH_ASSIGNED');
      console.log('   Has notification creation code:', hasNotificationCreation);
      
      // Check if createNotification.execute is called
      const hasExecuteCall = fileContent.includes('this.createNotification.execute');
      console.log('   Has createNotification.execute call:', hasExecuteCall);
    } else {
      console.log('   ⚠️  File not found:', filePath);
    }
    
    console.log('\n========================================');
    console.log('=== DIAGNOSIS ===');
    console.log('========================================\n');
    
    if (!createPettyCashAssignment.createNotification) {
      console.log('❌ ISSUE FOUND: createPettyCashAssignment does NOT have createNotification!');
      console.log('\nPossible causes:');
      console.log('1. Backend server was not restarted after code changes');
      console.log('2. Container is not properly injecting createNotification');
      console.log('3. Code changes were not saved');
      console.log('\nSolution:');
      console.log('1. Make sure all code changes are saved');
      console.log('2. Restart the backend server');
      console.log('3. Run this script again to verify');
    } else {
      console.log('✅ createPettyCashAssignment has createNotification');
      console.log('\nIf notifications are still not being created:');
      console.log('1. Check backend server logs when creating petty cash assignment');
      console.log('2. Look for [NOTIFICATION] log messages');
      console.log('3. Check for any errors in the console');
    }
    
    console.log('\n========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugPettyCashAssignment();
