/**
 * Check if backend server has latest code loaded
 * This checks if the server is using the updated code with notification support
 */

const http = require('http');

console.log('\n========================================');
console.log('=== BACKEND SERVER STATUS CHECK ===');
console.log('========================================\n');

// Try to connect to the backend server
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend server is RUNNING');
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Port: 5000`);
  console.log('\n⚠️  IMPORTANT: The server needs to be RESTARTED to load the new code!');
  console.log('\nTo restart the server:');
  console.log('1. Go to the terminal where the server is running');
  console.log('2. Press Ctrl+C to stop the server');
  console.log('3. Run: npm start');
  console.log('4. Wait for "Server running on port 5000" message');
  console.log('5. Then create a new petty cash assignment to test');
  console.log('\n========================================\n');
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log('❌ Backend server is NOT RUNNING');
    console.log('\nTo start the server:');
    console.log('1. Open a terminal');
    console.log('2. cd backend-api');
    console.log('3. npm start');
    console.log('4. Wait for "Server running on port 5000" message');
    console.log('5. Then create a new petty cash assignment to test');
  } else {
    console.log('❌ Error connecting to server:', error.message);
  }
  console.log('\n========================================\n');
});

req.on('timeout', () => {
  console.log('⚠️  Server connection timeout');
  console.log('The server might be starting up or having issues.');
  console.log('\n========================================\n');
  req.destroy();
});

req.end();
