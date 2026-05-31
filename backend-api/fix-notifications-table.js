/**
 * Fix Notifications Table - Add missing columns
 * Run with: node fix-notifications-table.js
 */

require('dotenv').config();
const { getConnection, sql } = require('./src/config/database');

async function fixNotificationsTable() {
  console.log('\n========================================');
  console.log('=== FIX NOTIFICATIONS TABLE ===');
  console.log('========================================\n');

  try {
    const pool = await getConnection();
    
    // Check if table exists
    console.log('Step 1: Checking if Notifications table exists...');
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableExists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Notifications'
    `);
    
    if (tableCheck.recordset[0].tableExists === 0) {
      console.log('❌ Notifications table does NOT exist!');
      console.log('Please run: create-notifications-system.sql first');
      process.exit(1);
    }
    
    console.log('✅ Notifications table exists\n');
    
    // Show current structure
    console.log('Step 2: Current table structure:');
    const currentStructure = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Notifications'
      ORDER BY ORDINAL_POSITION
    `);
    
    currentStructure.recordset.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\nStep 3: Checking for missing columns...');
    
    // Check and add createdBy column
    const createdByCheck = await pool.request().query(`
      SELECT COUNT(*) as columnExists 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('Notifications') 
      AND name = 'createdBy'
    `);
    
    if (createdByCheck.recordset[0].columnExists === 0) {
      console.log('   Adding createdBy column...');
      await pool.request().query(`
        ALTER TABLE Notifications ADD createdBy VARCHAR(50) NULL
      `);
      console.log('   ✅ Added createdBy column');
    } else {
      console.log('   ✓ createdBy column already exists');
    }
    
    // Check and add metadata column
    const metadataCheck = await pool.request().query(`
      SELECT COUNT(*) as columnExists 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('Notifications') 
      AND name = 'metadata'
    `);
    
    if (metadataCheck.recordset[0].columnExists === 0) {
      console.log('   Adding metadata column...');
      await pool.request().query(`
        ALTER TABLE Notifications ADD metadata NVARCHAR(MAX) NULL
      `);
      console.log('   ✅ Added metadata column');
    } else {
      console.log('   ✓ metadata column already exists');
    }
    
    // Check and add relatedType column
    const relatedTypeCheck = await pool.request().query(`
      SELECT COUNT(*) as columnExists 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('Notifications') 
      AND name = 'relatedType'
    `);
    
    if (relatedTypeCheck.recordset[0].columnExists === 0) {
      console.log('   Adding relatedType column...');
      await pool.request().query(`
        ALTER TABLE Notifications ADD relatedType VARCHAR(50) NULL
      `);
      console.log('   ✅ Added relatedType column');
    } else {
      console.log('   ✓ relatedType column already exists');
    }
    
    // Show updated structure
    console.log('\nStep 4: Updated table structure:');
    const updatedStructure = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Notifications'
      ORDER BY ORDINAL_POSITION
    `);
    
    updatedStructure.recordset.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\n========================================');
    console.log('✅ NOTIFICATIONS TABLE FIXED!');
    console.log('========================================');
    console.log('\nNext steps:');
    console.log('1. Restart your backend server');
    console.log('2. Create a new job and assign it to waff clerk 01');
    console.log('3. Login as waff clerk 01 and check notifications');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixNotificationsTable();
