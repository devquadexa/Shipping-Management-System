// Test Database Connection Script
// Run this to verify your database is properly configured
// Usage: node test-db-connection.js

require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || undefined,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function testConnection() {
  console.log('Testing database connection...\n');
  console.log('Configuration:');
  console.log(`  Server: ${config.server}`);
  console.log(`  Port: ${config.port || 'default'}`);
  console.log(`  Instance: ${config.options.instanceName || 'none'}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}`);
  console.log('  Password: ********\n');

  try {
    // Test connection
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    console.log('✓ Connected successfully!\n');

    // Test Users table
    console.log('Checking Users table...');
    const usersResult = await pool.request().query('SELECT COUNT(*) as Count FROM Users');
    console.log(`✓ Users table exists. Total users: ${usersResult.recordset[0].Count}`);

    // Get all users
    const allUsers = await pool.request().query('SELECT UserId, Username, FullName, Role FROM Users');
    console.log('\nExisting users:');
    allUsers.recordset.forEach(user => {
      console.log(`  - ${user.UserId}: ${user.Username} (${user.FullName}) - ${user.Role}`);
    });

    // Test other tables
    console.log('\nChecking other tables...');
    const tables = ['Customers', 'Jobs', 'Bills', 'PettyCash', 'PettyCashBalance', 'PayItems'];
    
    for (const table of tables) {
      const result = await pool.request().query(`SELECT COUNT(*) as Count FROM ${table}`);
      console.log(`✓ ${table} table exists. Records: ${result.recordset[0].Count}`);
    }

    // Check petty cash balance
    const balanceResult = await pool.request().query('SELECT Balance FROM PettyCashBalance WHERE Id = 1');
    console.log(`\n✓ Petty Cash Balance: LKR ${balanceResult.recordset[0].Balance.toFixed(2)}`);

    console.log('\n✅ All database checks passed!');
    console.log('\nYou can now start the application with: npm run dev');

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Database connection failed!');
    console.error('\nError details:');
    console.error(err.message);
    
    console.error('\n📋 Troubleshooting steps:');
    console.error('1. Verify SQL Server is running');
    console.error('2. Check credentials in .env file');
    console.error('3. Ensure database "SuperShineCargoDb" exists');
    console.error('4. Run init-database.sql script if not already done');
    console.error('5. Check if TCP/IP is enabled in SQL Server Configuration');
    console.error('6. Verify firewall allows SQL Server connections');
    
    process.exit(1);
  }
}

testConnection();
