/**
 * Clean up test notifications
 * Run with: node cleanup-test-notifications.js
 */

require('dotenv').config();
const { getConnection } = require('./src/config/database');

async function cleanupTestNotifications() {
  console.log('\n========================================');
  console.log('=== CLEANUP TEST NOTIFICATIONS ===');
  console.log('========================================\n');

  try {
    const pool = await getConnection();
    
    // Delete test notifications
    console.log('Deleting test notifications (relatedId = TEST001)...');
    const result = await pool.request().query(`
      DELETE FROM Notifications 
      WHERE relatedId = 'TEST001'
    `);
    
    console.log(`✅ Deleted ${result.rowsAffected[0]} test notification(s)\n`);
    
    // Show remaining notifications
    const remaining = await pool.request().query(`
      SELECT COUNT(*) as count FROM Notifications
    `);
    
    console.log(`Remaining notifications in database: ${remaining.recordset[0].count}`);
    
    console.log('\n========================================');
    console.log('✅ CLEANUP COMPLETE');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

cleanupTestNotifications();
