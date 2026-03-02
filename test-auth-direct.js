// Test Auth Route Directly
require('dotenv').config();
const { getConnection, sql } = require('./server/config/database');

async function testAuth() {
  console.log('Testing authentication query...\n');
  
  try {
    const pool = await getConnection();
    console.log('✓ Database connected\n');
    
    const username = 'superadmin';
    const password = 'admin123';
    
    console.log('Executing query...');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}\n`);
    
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM Users WHERE Username = @username AND Password = @password AND IsActive = 1');
    
    console.log('Query executed successfully!');
    console.log(`Records found: ${result.recordset.length}\n`);
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('✅ User found:');
      console.log(`  UserId: ${user.UserId}`);
      console.log(`  Username: ${user.Username}`);
      console.log(`  FullName: ${user.FullName}`);
      console.log(`  Role: ${user.Role}`);
      console.log(`  Email: ${user.Email}`);
      console.log(`  IsActive: ${user.IsActive}`);
    } else {
      console.log('❌ No user found with these credentials');
    }
    
    await pool.close();
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error(error);
  }
}

testAuth();
