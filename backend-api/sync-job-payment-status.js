/**
 * Sync Job Payment Status
 * This script synchronizes job payment status with their corresponding bill status
 * Run this to fix any mismatches between job status and bill payment status
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'SuperShineCargoDb',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function syncJobPaymentStatus() {
  let pool;
  
  try {
    console.log('🔄 Connecting to database...');
    pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Get all jobs with bills
    const result = await pool.request().query(`
      SELECT 
        j.jobId,
        j.status as currentJobStatus,
        b.BillId,
        b.PaymentStatus as billPaymentStatus,
        b.InvoiceNumber
      FROM Jobs j
      INNER JOIN Bills b ON j.jobId = b.JobId
      ORDER BY j.jobId
    `);

    console.log(`📊 Found ${result.recordset.length} jobs with bills\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of result.recordset) {
      const { jobId, currentJobStatus, billPaymentStatus, InvoiceNumber } = row;
      
      // Determine what the job status should be based on bill payment status
      let correctJobStatus = null;
      
      if (billPaymentStatus === 'Paid') {
        correctJobStatus = 'Payment Collected';
      } else if (billPaymentStatus === 'Partially Paid') {
        correctJobStatus = 'Partially Paid';
      } else if (billPaymentStatus === 'Unpaid') {
        correctJobStatus = 'Pending Payment';
      }

      // Check if job status needs updating
      if (correctJobStatus && currentJobStatus !== correctJobStatus) {
        console.log(`🔧 Updating Job ${jobId}:`);
        console.log(`   Current Status: ${currentJobStatus}`);
        console.log(`   Bill Status: ${billPaymentStatus}`);
        console.log(`   New Status: ${correctJobStatus}`);
        console.log(`   Invoice: ${InvoiceNumber || 'N/A'}`);
        
        // Update job status
        await pool.request()
          .input('jobId', sql.VarChar, jobId)
          .input('status', sql.VarChar, correctJobStatus)
          .query(`UPDATE Jobs SET status = @status WHERE jobId = @jobId`);
        
        console.log(`   ✅ Updated\n`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   Total jobs processed: ${result.recordset.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`);
    console.log('\n✅ Synchronization complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the sync
syncJobPaymentStatus();
