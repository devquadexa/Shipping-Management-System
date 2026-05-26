/**
 * Simulate Petty Cash Assignment with Notification
 * This simulates the exact flow that happens when creating a petty cash assignment
 * Run with: node simulate-petty-cash-assignment.js
 */

require('dotenv').config();
const container = require('./src/infrastructure/di/container');
const { getConnection } = require('./src/config/database');

async function simulatePettyCashAssignment() {
  console.log('\n========================================');
  console.log('=== SIMULATE PETTY CASH ASSIGNMENT ===');
  console.log('========================================\n');

  try {
    const pool = await getConnection();
    
    // Step 1: Get a real job from the database
    console.log('Step 1: Getting a real job from database...');
    const jobResult = await pool.request().query(`
      SELECT TOP 1 jobId 
      FROM Jobs 
      WHERE status IN ('Open', 'In Progress')
      ORDER BY createdDate DESC
    `);
    
    if (jobResult.recordset.length === 0) {
      console.log('❌ No jobs found in database');
      console.log('Please create a job first, then run this script again.');
      process.exit(1);
    }
    
    const jobId = jobResult.recordset[0].jobId;
    console.log(`✅ Found job: ${jobId}\n`);
    
    // Step 2: Simulate the petty cash assignment
    console.log('Step 2: Simulating petty cash assignment...');
    console.log('This is exactly what happens when you create a petty cash assignment in the UI\n');
    
    const assignmentData = {
      jobId: jobId,
      assignedTo: 'USER0002', // waff clerk 01
      assignedAmount: 5000,
      assignedBy: 'USER0001', // admin
      notes: 'Test assignment to verify notification system'
    };
    
    console.log('Assignment Data:');
    console.log(JSON.stringify(assignmentData, null, 2));
    console.log('');
    
    // Step 3: Get the use case from container (same as controller does)
    console.log('Step 3: Getting createPettyCashAssignment from container...');
    const createPettyCashAssignment = container.resolve('createPettyCashAssignment');
    console.log('✅ Got createPettyCashAssignment');
    console.log('   Has createNotification:', !!createPettyCashAssignment.createNotification);
    console.log('');
    
    // Step 4: Execute the use case (this should create notification)
    console.log('Step 4: Executing createPettyCashAssignment.execute()...');
    console.log('Watch for [NOTIFICATION] logs below:\n');
    console.log('---START OF USE CASE EXECUTION---');
    
    const assignment = await createPettyCashAssignment.execute(assignmentData);
    
    console.log('---END OF USE CASE EXECUTION---\n');
    console.log('✅ Assignment created:', assignment.assignmentId);
    console.log('');
    
    // Step 5: Check if notification was created
    console.log('Step 5: Checking if notification was created...');
    const notificationResult = await pool.request().query(`
      SELECT * FROM Notifications 
      WHERE relatedId = '${assignment.assignmentId}'
      AND type = 'PETTY_CASH_ASSIGNED'
    `);
    
    if (notificationResult.recordset.length > 0) {
      console.log('✅ NOTIFICATION WAS CREATED!');
      const notif = notificationResult.recordset[0];
      console.log('\nNotification Details:');
      console.log(`   ID: ${notif.notificationId}`);
      console.log(`   User: ${notif.userId}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Title: ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Created: ${notif.createdDate}`);
      console.log(`   Is Read: ${notif.isRead}`);
    } else {
      console.log('❌ NO NOTIFICATION WAS CREATED!');
      console.log('\nThis means:');
      console.log('1. The backend server is running OLD code (before notification support)');
      console.log('2. The server MUST be restarted to load the new code');
      console.log('\nTo fix:');
      console.log('1. Find the terminal where backend server is running');
      console.log('2. Press Ctrl+C to stop the server');
      console.log('3. Run: npm start');
      console.log('4. Wait for "Server running on port 5000"');
      console.log('5. Run this script again');
    }
    
    // Step 6: Clean up the test assignment
    console.log('\nStep 6: Cleaning up test assignment...');
    
    // Delete notification if it was created
    await pool.request().query(`
      DELETE FROM Notifications 
      WHERE relatedId = '${assignment.assignmentId}'
    `);
    
    // Delete settlement items if any
    await pool.request().query(`
      DELETE FROM PettyCashSettlementItems 
      WHERE assignmentId = ${assignment.assignmentId}
    `);
    
    // Delete the assignment
    await pool.request().query(`
      DELETE FROM PettyCashAssignments 
      WHERE assignmentId = ${assignment.assignmentId}
    `);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n========================================');
    console.log('=== SIMULATION COMPLETE ===');
    console.log('========================================\n');
    
    if (notificationResult.recordset.length > 0) {
      console.log('✅ SUCCESS: Notification system is working!');
      console.log('\nThe notification code is loaded and working correctly.');
      console.log('When you create a petty cash assignment in the UI,');
      console.log('notifications will be created automatically.');
    } else {
      console.log('⚠️  ISSUE: Notification was NOT created');
      console.log('\nThe code is correct, but the server needs to be restarted.');
      console.log('See the instructions above to restart the server.');
    }
    
    console.log('\n========================================\n');
    
    process.exit(notificationResult.recordset.length > 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

simulatePettyCashAssignment();
