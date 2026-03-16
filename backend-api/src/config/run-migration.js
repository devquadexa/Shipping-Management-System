const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getConnection } = require('./database');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Starting migration to add missing columns to Jobs table...');
    
    const pool = await getConnection();
    console.log('Connected to database');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'ADD_MISSING_JOB_COLUMNS.sql'), 'utf8');
    
    // Split by GO statements and execute each batch
    const batches = migrationSQL.split(/\bGO\b/gi).filter(batch => batch.trim());
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        console.log(`Executing batch ${i + 1}...`);
        await pool.request().query(batch);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();