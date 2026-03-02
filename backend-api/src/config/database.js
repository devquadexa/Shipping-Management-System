const sql = require('mssql');

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_DATABASE'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file in backend-api folder');
  process.exit(1);
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Log database configuration (hide password for security)
console.log('📊 Database Configuration:');
console.log(`   Server: ${config.server}:${config.port}`);
console.log(`   Database: ${config.database}`);
console.log(`   User: ${config.user}`);
console.log(`   Password: ${'*'.repeat(config.password.length)}`);
console.log(`   Encrypt: ${config.options.encrypt}`);

let pool = null;

const getConnection = async () => {
  try {
    if (pool) {
      return pool;
    }
    pool = await sql.connect(config);
    console.log('✅ Connected to MSSQL database');
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    console.error('Please verify:');
    console.error('  1. SQL Server is running');
    console.error('  2. Database credentials are correct in .env file');
    console.error('  3. Database exists and is accessible');
    throw err;
  }
};

const closeConnection = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (err) {
    console.error('Error closing database connection:', err);
  }
};

module.exports = {
  sql,
  getConnection,
  closeConnection
};
