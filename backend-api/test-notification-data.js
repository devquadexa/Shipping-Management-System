/**
 * Test Notification Data
 * Check what data is being returned by the API
 * Run with: node test-notification-data.js
 */

require('dotenv').config();
const { getConnection } = require('./src/config/database');

async function testNotificationData() {
  console.log('\n========================================');
  console.log('=== TEST NOTIFICATION DATA ===');
  console.log('========================================\n');

  try {
    const pool = await getConnection();
    
    // Get recent notifications
    console.log('Fetching recent notifications...\n');
    const result = await pool.request().query(`
      SELECT TOP 5
        notificationId,
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        metadata,
        isRead,
        createdDate
      FROM Notifications
      ORDER BY createdDate DESC
    `);
    
    if (result.recordset.length === 0) {
      console.log('❌ No notifications found in database');
      console.log('   Create a petty cash assignment or job assignment first.');
      process.exit(1);
    }
    
    console.log(`Found ${result.recordset.length} notifications:\n`);
    
    result.recordset.forEach((notif, index) => {
      console.log(`[${index + 1}] ${notif.notificationId}`);
      console.log(`    Type: ${notif.type}`);
      console.log(`    Title: ${notif.title}`);
      console.log(`    User: ${notif.userId}`);
      console.log(`    Related ID: ${notif.relatedId}`);
      console.log(`    Related Type: ${notif.relatedType}`);
      console.log(`    Metadata (raw): ${notif.metadata}`);
      console.log(`    Metadata type: ${typeof notif.metadata}`);
      
      // Try to parse metadata
      if (notif.metadata) {
        try {
          const parsed = JSON.parse(notif.metadata);
          console.log(`    Metadata (parsed):`, parsed);
        } catch (e) {
          console.log(`    ⚠️  Metadata parsing failed: ${e.message}`);
        }
      } else {
        console.log(`    ⚠️  Metadata is null/empty`);
      }
      
      console.log(`    Is Read: ${notif.isRead}`);
      console.log(`    Created: ${notif.createdDate}`);
      console.log('');
    });
    
    // Check specific notification types
    console.log('========================================');
    console.log('Checking notification types:\n');
    
    const typeCheck = await pool.request().query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM Notifications
      GROUP BY type
      ORDER BY count DESC
    `);
    
    typeCheck.recordset.forEach(row => {
      console.log(`  ${row.type}: ${row.count} notification(s)`);
    });
    
    console.log('\n========================================');
    console.log('=== ANALYSIS ===');
    console.log('========================================\n');
    
    // Check if metadata is properly formatted
    const hasMetadata = result.recordset.filter(n => n.metadata).length;
    const hasValidMetadata = result.recordset.filter(n => {
      if (!n.metadata) return false;
      try {
        JSON.parse(n.metadata);
        return true;
      } catch (e) {
        return false;
      }
    }).length;
    
    console.log(`Notifications with metadata: ${hasMetadata}/${result.recordset.length}`);
    console.log(`Notifications with valid JSON metadata: ${hasValidMetadata}/${result.recordset.length}`);
    
    if (hasValidMetadata < hasMetadata) {
      console.log('\n⚠️  WARNING: Some notifications have invalid JSON metadata!');
      console.log('   This will cause parsing errors in the frontend.');
    }
    
    if (hasMetadata === 0) {
      console.log('\n⚠️  WARNING: No notifications have metadata!');
      console.log('   Metadata is needed for proper navigation.');
      console.log('   Check if notifications are being created correctly.');
    }
    
    console.log('\n========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testNotificationData();
