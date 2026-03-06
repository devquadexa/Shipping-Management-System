/**
 * Migration Script: Add Manager Role
 * Run this script to add Manager role to the database CHECK constraint
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getConnection, sql } = require('./database');

async function migrateManagerRole() {
  try {
    console.log('🔄 Starting Manager role migration...');
    
    const pool = await getConnection();
    
    // Drop the existing CHECK constraint
    console.log('📝 Dropping existing CHECK constraint...');
    await pool.request().query(`
      ALTER TABLE Users
      DROP CONSTRAINT CK__Users__Role__5DCAEF64;
    `);
    console.log('✅ Existing constraint dropped');
    
    // Add the new CHECK constraint with Manager role
    console.log('📝 Adding new CHECK constraint with Manager role...');
    await pool.request().query(`
      ALTER TABLE Users
      ADD CONSTRAINT CK_Users_Role 
      CHECK (Role IN ('Super Admin', 'Admin', 'Manager', 'User'));
    `);
    console.log('✅ New constraint added successfully');
    
    console.log('🎉 Manager role migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateManagerRole();
