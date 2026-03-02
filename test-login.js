// Test Login Endpoint
require('dotenv').config();
const http = require('http');

async function testLogin() {
  console.log('Testing login endpoint...\n');
  
  const postData = JSON.stringify({
    username: 'superadmin',
    password: 'admin123'
  });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('\nResponse:');
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
        
        if (res.statusCode === 200) {
          console.log('\n✅ Login successful!');
        } else {
          console.log('\n❌ Login failed!');
        }
      } catch (e) {
        console.log(data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request failed!');
    console.error('Error:', error.message);
    console.error('\nIs the backend server running on port 5000?');
  });
  
  req.write(postData);
  req.end();
}

testLogin();
