const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getConnection } = require('./src/config/database');

async function migrate() {
  try {
    const pool = await getConnection();
    
    // Execute each statement separately
    console.log('Adding parentAssignmentId column...');
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'parentAssignmentId'
      )
      BEGIN
        ALTER TABLE PettyCashAssignments ADD parentAssignmentId INT NULL;
        PRINT 'Added parentAssignmentId column';
      END
    `);
    
    console.log('Adding isMainAssignment column...');
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('PettyCashAssignments') AND name = 'isMainAssignment'
      )
      BEGIN
        ALTER TABLE PettyCashAssignments ADD isMainAssignment BIT NOT NULL DEFAULT 1;
        PRINT 'Added isMainAssignment column';
      END
    `);
    
    console.log('Backfilling existing records...');
    await pool.request().query(`
      UPDATE PettyCashAssignments
      SET isMainAssignment = 1
      WHERE parentAssignmentId IS NULL
    `);
    
    console.log('Adding foreign key constraint...');
    try {
      await pool.request().query(`
        IF NOT EXISTS (
          SELECT * FROM sys.foreign_keys 
          WHERE name = 'FK_PettyCashAssignments_Parent'
        )
        BEGIN
          ALTER TABLE PettyCashAssignments
          ADD CONSTRAINT FK_PettyCashAssignments_Parent
          FOREIGN KEY (parentAssignmentId) REFERENCES PettyCashAssignments(assignmentId);
        END
      `);
    } catch (err) {
      console.log('Foreign key constraint may already exist');
    }
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch(err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
