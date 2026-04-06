/**
 * Utility script to recalculate and fix petty cash assignment status
 * Usage: node recalculate-assignment-status.js [assignmentId]
 * If no assignmentId provided, it will fix ALL settled assignments
 */

const sql = require('mssql');

const config = {
  server: 'localhost',
  port: 63951,
  database: 'SuperShineCargoDb',
  user: 'SUPER_SHINE_CARGO',
  password: '1234@SuperShineDB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function recalculateAssignment(assignmentId) {
  // Get sum of settlement items
  const sumResult = await sql.query`
    SELECT ISNULL(SUM(actualCost), 0) as totalSpent
    FROM PettyCashSettlementItems
    WHERE assignmentId = ${assignmentId}
  `;
  
  const actualSpent = parseFloat(sumResult.recordset[0].totalSpent);
  
  // Get assigned amount and current status
  const assignmentResult = await sql.query`
    SELECT assignmentId, assignedAmount, status, actualSpent as currentActualSpent, 
           balanceAmount as currentBalance, overAmount as currentOver
    FROM PettyCashAssignments
    WHERE assignmentId = ${assignmentId}
  `;
  
  if (assignmentResult.recordset.length === 0) {
    console.log(`❌ Assignment ${assignmentId} not found`);
    return null;
  }
  
  const assignment = assignmentResult.recordset[0];
  const assignedAmount = parseFloat(assignment.assignedAmount);
  
  // Calculate balance/over amounts
  const balanceAmount = Math.max(0, assignedAmount - actualSpent);
  const overAmount = Math.max(0, actualSpent - assignedAmount);
  
  // Determine correct status
  let newStatus = 'Settled';
  if (balanceAmount > 0) {
    newStatus = 'Balance To Be Return';
  } else if (overAmount > 0) {
    newStatus = 'Over Due';
  }
  
  // Check if update is needed
  const needsUpdate = 
    assignment.currentActualSpent !== actualSpent ||
    assignment.currentBalance !== balanceAmount ||
    assignment.currentOver !== overAmount ||
    assignment.status !== newStatus;
  
  if (needsUpdate) {
    console.log(`\n📝 Assignment ${assignmentId}:`);
    console.log(`   Assigned: ${assignedAmount}`);
    console.log(`   Actual Spent: ${assignment.currentActualSpent} → ${actualSpent}`);
    console.log(`   Balance: ${assignment.currentBalance} → ${balanceAmount}`);
    console.log(`   Over: ${assignment.currentOver} → ${overAmount}`);
    console.log(`   Status: "${assignment.status}" → "${newStatus}"`);
    
    // Update the assignment
    await sql.query`
      UPDATE PettyCashAssignments
      SET actualSpent = ${actualSpent},
          balanceAmount = ${balanceAmount},
          overAmount = ${overAmount},
          status = ${newStatus}
      WHERE assignmentId = ${assignmentId}
    `;
    
    console.log(`   ✅ Updated!`);
    return { updated: true, assignmentId, newStatus };
  } else {
    console.log(`✓ Assignment ${assignmentId} is already correct (${assignment.status})`);
    return { updated: false, assignmentId, newStatus: assignment.status };
  }
}

(async () => {
  try {
    await sql.connect(config);
    console.log('🔗 Connected to database\n');
    
    const assignmentId = process.argv[2];
    
    if (assignmentId) {
      // Fix specific assignment
      console.log(`Recalculating assignment ${assignmentId}...`);
      await recalculateAssignment(parseInt(assignmentId));
    } else {
      // Fix all settled assignments
      console.log('Recalculating ALL settled assignments...\n');
      
      const result = await sql.query`
        SELECT assignmentId
        FROM PettyCashAssignments
        WHERE status IN (
          'Settled', 
          'Balance To Be Return', 
          'Over Due'
        )
        ORDER BY assignmentId
      `;
      
      console.log(`Found ${result.recordset.length} assignments to check\n`);
      
      let updatedCount = 0;
      for (const row of result.recordset) {
        const result = await recalculateAssignment(row.assignmentId);
        if (result && result.updated) {
          updatedCount++;
        }
      }
      
      console.log(`\n✅ Done! Updated ${updatedCount} assignment(s)`);
    }
    
    await sql.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
})();
