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
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Connected to MSSQL database');
      // Run migrations on every fresh connection
      await runMigrations(pool);
    }
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

const runMigrations = async (pool) => {
  try {
    // Add hasBill column to PettyCashSettlementItems if not exists
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('PettyCashSettlementItems') 
        AND name = 'hasBill'
      )
      BEGIN
        ALTER TABLE PettyCashSettlementItems
        ADD hasBill BIT NOT NULL DEFAULT 0;
        PRINT 'Migration: Added hasBill column to PettyCashSettlementItems';
      END
    `);
    // Verify column exists after migration
    const check = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.columns 
      WHERE object_id = OBJECT_ID('PettyCashSettlementItems') AND name = 'hasBill'
    `);
    const exists = check.recordset[0].cnt === 1;
    console.log('✅ Database migrations applied. hasBill column exists:', exists);
    if (!exists) {
      console.error('❌ CRITICAL: hasBill column does not exist after migration attempt!');
      console.error('   Please run manually in SQL Server Management Studio:');
      console.error('   ALTER TABLE PettyCashSettlementItems ADD hasBill BIT NOT NULL DEFAULT 0;');
    } else {
      // Check for triggers that might interfere
      const triggerCheck = await pool.request().query(`
        SELECT t.name as triggerName
        FROM sys.triggers t
        INNER JOIN sys.tables tbl ON t.parent_id = tbl.object_id
        WHERE tbl.name = 'PettyCashSettlementItems'
      `);
      if (triggerCheck.recordset.length > 0) {
        console.warn('⚠️  Triggers found on PettyCashSettlementItems:', triggerCheck.recordset.map(r => r.triggerName));
      }
    }
  } catch (err) {
    console.error('❌ Migration FAILED:', err.message);
    console.error('   Please run manually in SQL Server Management Studio:');
    console.error('   ALTER TABLE PettyCashSettlementItems ADD hasBill BIT NOT NULL DEFAULT 0;');
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
