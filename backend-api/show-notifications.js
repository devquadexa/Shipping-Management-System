/**
 * Show all notifications in the database
 * Run with: node show-notifications.js [userId]
 */

require('dotenv').config();
const { getConnection } = require('./src/config/database');

async function showNotifications() {
  const userId = process.argv[2]; // Optional user ID filter
  
  console.log('\n========================================');
  console.log('=== NOTIFICATIONS VIEWER ===');
  console.log('========================================\n');

  try {
    const pool = await getConnection();
    
    // Get total count
    const countResult = await pool.request().query('SELECT COUNT(*) as total FROM Notifications');
    const totalCount = countResult.recordset[0].total;
    
    console.log(`Total notifications in database: ${totalCount}\n`);
    
    if (totalCount === 0) {
      console.log('No notifications found.');
      console.log('\nTo create a notification:');
      console.log('1. Create a new job in the system');
      console.log('2. Assign it to a user (e.g., waff clerk 01)');
      console.log('3. The notification will be created automatically\n');
      process.exit(0);
    }
    
    // Get notifications (filtered by user if provided)
    let query = `
      SELECT 
        n.notificationId,
        n.userId,
        u.FullName as userName,
        n.type,
        n.title,
        n.message,
        n.relatedId,
        n.relatedType,
        n.isRead,
        n.createdDate,
        n.readDate,
        n.createdBy
      FROM Notifications n
      LEFT JOIN Users u ON n.userId = u.UserId
    `;
    
    if (userId) {
      query += ` WHERE n.userId = '${userId}'`;
      console.log(`Filtering by user: ${userId}\n`);
    }
    
    query += ' ORDER BY n.createdDate DESC';
    
    const result = await pool.request().query(query);
    
    if (result.recordset.length === 0) {
      console.log(`No notifications found for user: ${userId}\n`);
      process.exit(0);
    }
    
    // Display notifications
    console.log('========================================');
    result.recordset.forEach((notif, index) => {
      console.log(`\n[${index + 1}] ${notif.notificationId}`);
      console.log(`    User: ${notif.userName || notif.userId} (${notif.userId})`);
      console.log(`    Type: ${notif.type}`);
      console.log(`    Title: ${notif.title}`);
      console.log(`    Message: ${notif.message}`);
      if (notif.relatedId) {
        console.log(`    Related: ${notif.relatedType} #${notif.relatedId}`);
      }
      console.log(`    Status: ${notif.isRead ? '✅ Read' : '🔔 Unread'}`);
      console.log(`    Created: ${new Date(notif.createdDate).toLocaleString()}`);
      if (notif.readDate) {
        console.log(`    Read: ${new Date(notif.readDate).toLocaleString()}`);
      }
      if (notif.createdBy) {
        console.log(`    Created By: ${notif.createdBy}`);
      }
      console.log('    ' + '-'.repeat(60));
    });
    
    // Show unread count by user
    console.log('\n========================================');
    console.log('UNREAD COUNT BY USER');
    console.log('========================================\n');
    
    const unreadByUser = await pool.request().query(`
      SELECT 
        n.userId,
        u.FullName as userName,
        COUNT(*) as unreadCount
      FROM Notifications n
      LEFT JOIN Users u ON n.userId = u.UserId
      WHERE n.isRead = 0
      GROUP BY n.userId, u.FullName
      ORDER BY unreadCount DESC
    `);
    
    if (unreadByUser.recordset.length === 0) {
      console.log('No unread notifications\n');
    } else {
      unreadByUser.recordset.forEach(row => {
        console.log(`${row.userName || row.userId} (${row.userId}): ${row.unreadCount} unread`);
      });
      console.log('');
    }
    
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

showNotifications();
