/**
 * Test Script for Parent-Child Petty Cash Assignments API
 * 
 * This script tests the new parent-child assignment endpoints
 * Run with: node test-parent-child-api.js
 */

const API_BASE = 'http://localhost:5000';

// Replace with a valid token from your system
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';

async function testAPI() {
  console.log('🧪 Testing Parent-Child Petty Cash Assignments API\n');

  try {
    // Test 1: Get Aggregated Assignments
    console.log('Test 1: GET /api/petty-cash-assignments/aggregated');
    const response1 = await fetch(`${API_BASE}/api/petty-cash-assignments/aggregated`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Success! Found', data1.length, 'aggregated groups');
      if (data1.length > 0) {
        console.log('   Sample:', {
          jobId: data1[0].jobId,
          assignedTo: data1[0].assignedToName,
          totalAmount: data1[0].totalAssignedAmount,
          assignmentCount: data1[0].assignments.length
        });
      }
    } else {
      console.log('❌ Failed:', response1.status, response1.statusText);
    }
    console.log('');

    // Test 2: Get Assignments with Children
    console.log('Test 2: GET /api/petty-cash-assignments/with-children');
    const response2 = await fetch(`${API_BASE}/api/petty-cash-assignments/with-children`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Success! Found', data2.length, 'main assignments');
      if (data2.length > 0) {
        console.log('   Sample:', {
          assignmentId: data2[0].assignmentId,
          jobId: data2[0].jobId,
          totalAmount: data2[0].totalAssignedAmount,
          subAssignmentCount: data2[0].subAssignmentCount
        });
      }
    } else {
      console.log('❌ Failed:', response2.status, response2.statusText);
    }
    console.log('');

    // Test 3: Create Sub-Assignment (requires a valid parent assignment ID)
    console.log('Test 3: POST /api/petty-cash-assignments/:id/sub-assignment');
    console.log('⚠️  Skipped - Requires valid parent assignment ID');
    console.log('   To test manually:');
    console.log('   POST', `${API_BASE}/api/petty-cash-assignments/1/sub-assignment`);
    console.log('   Body: { "assignedAmount": 5000, "notes": "Test sub-assignment" }');
    console.log('');

    // Test 4: Get Sub-Assignments (requires a valid parent assignment ID)
    console.log('Test 4: GET /api/petty-cash-assignments/:id/sub-assignments');
    console.log('⚠️  Skipped - Requires valid parent assignment ID');
    console.log('   To test manually:');
    console.log('   GET', `${API_BASE}/api/petty-cash-assignments/1/sub-assignments`);
    console.log('');

    console.log('✅ API Tests Complete!\n');
    console.log('📝 Notes:');
    console.log('   - Update AUTH_TOKEN in this script with a valid token');
    console.log('   - Tests 3 & 4 require manual testing with valid IDs');
    console.log('   - Check backend logs for detailed information');

  } catch (error) {
    console.error('❌ Error running tests:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm start)');
    console.log('   2. Database migration has been executed');
    console.log('   3. AUTH_TOKEN is valid');
  }
}

// Run tests
testAPI();
