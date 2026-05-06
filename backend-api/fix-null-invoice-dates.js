/**
 * Fix NULL invoiceDate and InvoiceNumber values in Bills table
 * This script updates existing bills that have NULL invoiceDate or InvoiceNumber
 */
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  }
};

async function fixNullInvoiceDates() {
  console.log('📊 Database Configuration:');
  console.log(`Server: ${dbConfig.server}:${dbConfig.port}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`User: ${dbConfig.user}`);
  console.log('');

  let pool;
  try {
    console.log('🔌 Connecting to database...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected successfully\n');

    // Check how many bills have NULL invoiceDate
    console.log('🔍 Checking for bills with NULL invoiceDate...');
    const checkDateResult = await pool.request().query(`
      SELECT COUNT(*) as nullCount
      FROM Bills
      WHERE invoiceDate IS NULL
    `);
    
    const nullDateCount = checkDateResult.recordset[0].nullCount;
    console.log(`Found ${nullDateCount} bills with NULL invoiceDate`);

    // Check how many bills have NULL or empty InvoiceNumber
    console.log('🔍 Checking for bills with NULL or empty InvoiceNumber...');
    const checkNumberResult = await pool.request().query(`
      SELECT COUNT(*) as nullCount
      FROM Bills
      WHERE InvoiceNumber IS NULL OR InvoiceNumber = ''
    `);
    
    const nullNumberCount = checkNumberResult.recordset[0].nullCount;
    console.log(`Found ${nullNumberCount} bills with NULL or empty InvoiceNumber\n`);

    if (nullDateCount === 0 && nullNumberCount === 0) {
      console.log('✅ No bills need to be updated. All bills have invoiceDate and InvoiceNumber set.');
      return;
    }

    // Update NULL invoiceDate values
    if (nullDateCount > 0) {
      console.log('🔧 Updating NULL invoiceDate values...');
      const updateDateResult = await pool.request().query(`
        UPDATE Bills
        SET invoiceDate = COALESCE(BillDate, CreatedDate, GETDATE())
        WHERE invoiceDate IS NULL
      `);
      console.log(`✅ Updated ${updateDateResult.rowsAffected[0]} bills with invoiceDate\n`);
    }

    // Update NULL or empty InvoiceNumber values
    if (nullNumberCount > 0) {
      console.log('🔧 Updating NULL or empty InvoiceNumber values...');
      const updateNumberResult = await pool.request().query(`
        UPDATE Bills
        SET InvoiceNumber = 'INV-' + RIGHT(BillId, 4)
        WHERE InvoiceNumber IS NULL OR InvoiceNumber = ''
      `);
      console.log(`✅ Updated ${updateNumberResult.rowsAffected[0]} bills with InvoiceNumber\n`);
    }

    // Verify the update
    console.log('🔍 Verifying update...');
    const verifyResult = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Bills WHERE invoiceDate IS NULL) as nullDateCount,
        (SELECT COUNT(*) FROM Bills WHERE InvoiceNumber IS NULL OR InvoiceNumber = '') as nullNumberCount
    `);

    const remainingNullDate = verifyResult.recordset[0].nullDateCount;
    const remainingNullNumber = verifyResult.recordset[0].nullNumberCount;
    
    if (remainingNullDate === 0 && remainingNullNumber === 0) {
      console.log('✅ All bills now have invoiceDate and InvoiceNumber set!\n');
    } else {
      if (remainingNullDate > 0) {
        console.log(`⚠️  Warning: ${remainingNullDate} bills still have NULL invoiceDate`);
      }
      if (remainingNullNumber > 0) {
        console.log(`⚠️  Warning: ${remainingNullNumber} bills still have NULL or empty InvoiceNumber`);
      }
      console.log('');
    }

    // Show sample of updated bills
    console.log('📋 Sample of updated bills:');
    const sampleResult = await pool.request().query(`
      SELECT TOP 10
        BillId,
        JobId,
        InvoiceNumber,
        invoiceDate,
        PaymentStatus,
        netTotal
      FROM Bills
      ORDER BY invoiceDate DESC
    `);

    console.table(sampleResult.recordset);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
fixNullInvoiceDates()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
