/**
 * Test script to verify decoupled architecture setup
 * Run this after setting up both frontend and backend
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Decoupled Architecture Setup...\n');

let errors = [];
let warnings = [];
let success = [];

// Test 1: Check directory structure
console.log('📁 Checking directory structure...');
const requiredDirs = [
  'frontend',
  'frontend/src',
  'frontend/src/api',
  'frontend/src/api/services',
  'frontend/src/components',
  'frontend/public',
  'backend-api',
  'backend-api/src',
  'backend-api/src/config',
  'backend-api/src/routes',
  'backend-api/src/middleware'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    success.push(`✅ Directory exists: ${dir}`);
  } else {
    errors.push(`❌ Missing directory: ${dir}`);
  }
});

// Test 2: Check required files
console.log('\n📄 Checking required files...');
const requiredFiles = [
  'frontend/package.json',
  'frontend/.env',
  'frontend/src/api/client.js',
  'frontend/src/api/services/authService.js',
  'frontend/src/api/services/customerService.js',
  'frontend/src/api/services/jobService.js',
  'frontend/src/api/services/billingService.js',
  'frontend/src/api/services/pettyCashService.js',
  'frontend/public/logo.svg',
  'backend-api/package.json',
  'backend-api/.env',
  'backend-api/src/index.js',
  'backend-api/src/config/database.js',
  'backend-api/src/middleware/auth.js',
  'START_HERE.md',
  'DEMO_CHECKLIST.md',
  'DECOUPLED_ARCHITECTURE.md'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success.push(`✅ File exists: ${file}`);
  } else {
    errors.push(`❌ Missing file: ${file}`);
  }
});

// Test 3: Check frontend configuration
console.log('\n⚙️  Checking frontend configuration...');
try {
  const frontendEnv = fs.readFileSync('frontend/.env', 'utf8');
  if (frontendEnv.includes('REACT_APP_API_URL')) {
    success.push('✅ Frontend .env has REACT_APP_API_URL');
  } else {
    errors.push('❌ Frontend .env missing REACT_APP_API_URL');
  }
} catch (err) {
  errors.push('❌ Cannot read frontend/.env');
}

try {
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  if (frontendPkg.dependencies.react && frontendPkg.dependencies.axios) {
    success.push('✅ Frontend has required dependencies');
  } else {
    warnings.push('⚠️  Frontend may be missing dependencies');
  }
} catch (err) {
  errors.push('❌ Cannot read frontend/package.json');
}

// Test 4: Check backend configuration
console.log('\n⚙️  Checking backend configuration...');
try {
  const backendEnv = fs.readFileSync('backend-api/.env', 'utf8');
  const requiredEnvVars = ['PORT', 'DB_SERVER', 'DB_DATABASE', 'JWT_SECRET'];
  requiredEnvVars.forEach(envVar => {
    if (backendEnv.includes(envVar)) {
      success.push(`✅ Backend .env has ${envVar}`);
    } else {
      errors.push(`❌ Backend .env missing ${envVar}`);
    }
  });
} catch (err) {
  errors.push('❌ Cannot read backend-api/.env');
}

try {
  const backendPkg = JSON.parse(fs.readFileSync('backend-api/package.json', 'utf8'));
  if (backendPkg.dependencies.express && backendPkg.dependencies.mssql) {
    success.push('✅ Backend has required dependencies');
  } else {
    warnings.push('⚠️  Backend may be missing dependencies');
  }
} catch (err) {
  errors.push('❌ Cannot read backend-api/package.json');
}

// Test 5: Check API services
console.log('\n🔌 Checking API services...');
const apiServices = [
  'frontend/src/api/services/authService.js',
  'frontend/src/api/services/customerService.js',
  'frontend/src/api/services/jobService.js',
  'frontend/src/api/services/billingService.js',
  'frontend/src/api/services/pettyCashService.js'
];

apiServices.forEach(service => {
  try {
    const content = fs.readFileSync(service, 'utf8');
    if (content.includes('import apiClient') && content.includes('export')) {
      success.push(`✅ API service properly structured: ${path.basename(service)}`);
    } else {
      warnings.push(`⚠️  API service may have issues: ${path.basename(service)}`);
    }
  } catch (err) {
    errors.push(`❌ Cannot read ${service}`);
  }
});

// Test 6: Check logo integration
console.log('\n🎨 Checking logo integration...');
try {
  const loginContent = fs.readFileSync('frontend/src/components/Login.js', 'utf8');
  if (loginContent.includes('logo.svg')) {
    success.push('✅ Logo integrated in Login component');
  } else {
    warnings.push('⚠️  Logo may not be integrated in Login');
  }
  
  const navbarContent = fs.readFileSync('frontend/src/components/Navbar.js', 'utf8');
  if (navbarContent.includes('logo.svg')) {
    success.push('✅ Logo integrated in Navbar component');
  } else {
    warnings.push('⚠️  Logo may not be integrated in Navbar');
  }
} catch (err) {
  errors.push('❌ Cannot check logo integration');
}

// Test 7: Check documentation
console.log('\n📚 Checking documentation...');
const docs = [
  'START_HERE.md',
  'DEMO_CHECKLIST.md',
  'DECOUPLED_ARCHITECTURE.md',
  'frontend/README.md',
  'backend-api/README.md'
];

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    success.push(`✅ Documentation exists: ${doc}`);
  } else {
    warnings.push(`⚠️  Missing documentation: ${doc}`);
  }
});

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS');
console.log('='.repeat(60));

if (success.length > 0) {
  console.log('\n✅ SUCCESS (' + success.length + ' items)');
  success.forEach(msg => console.log('   ' + msg));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (' + warnings.length + ' items)');
  warnings.forEach(msg => console.log('   ' + msg));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS (' + errors.length + ' items)');
  errors.forEach(msg => console.log('   ' + msg));
}

console.log('\n' + '='.repeat(60));

if (errors.length === 0) {
  console.log('✅ SETUP COMPLETE! Ready for demo.');
  console.log('\nNext steps:');
  console.log('1. cd backend-api && npm install && npm start');
  console.log('2. cd frontend && npm install && npm start');
  console.log('3. Open http://localhost:3000');
  console.log('4. Login with superadmin / admin123');
  console.log('\nSee START_HERE.md for detailed instructions.');
} else {
  console.log('❌ SETUP INCOMPLETE. Please fix the errors above.');
  console.log('\nRefer to START_HERE.md for setup instructions.');
}

console.log('='.repeat(60) + '\n');

process.exit(errors.length > 0 ? 1 : 0);
