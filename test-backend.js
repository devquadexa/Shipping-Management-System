/**
 * Test backend configuration and startup
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend-api/.env') });

console.log('🔍 Testing Backend Configuration...\n');

// Test environment variables
console.log('📋 Environment Variables:');
console.log('  PORT:', process.env.PORT || 'NOT SET');
console.log('  DB_SERVER:', process.env.DB_SERVER || 'NOT SET');
console.log('  DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('  DB_DATABASE:', process.env.DB_DATABASE || 'NOT SET');
console.log('  DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '********' : 'NOT SET');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '********' : 'NOT SET');
console.log('');

// Test database connection
console.log('🔌 Testing Database Connection...');
const { getConnection } = require('./backend-api/src/config/database');

getConnection()
  .then(async (pool) => {
    console.log('✅ Database connected successfully!\n');
    
    // Test login query
    console.log('🔐 Testing Login Query...');
    const result = await pool.request()
      .input('username', 'superadmin')
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1');
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('✅ Found user:', user.Username, '-', user.FullName, '(' + user.Role + ')');
      console.log('');
      console.log('✅ Backend configuration is correct!');
      console.log('');
      console.log('🚀 You can now start the backend server:');
      console.log('   cd backend-api');
      console.log('   npm start');
    } else {
      console.log('❌ User not found in database');
    }
    
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.log('');
    console.log('Please check:');
    console.log('1. SQL Server is running');
    console.log('2. Database credentials in backend-api/.env');
    console.log('3. Database SuperShineCargoDb exists');
    process.exit(1);
  });
