const https = require('https');
const http = require('http');

// Test users with their credentials
const testUsers = [
  {
    email: 'super.admin@npopc.gov.ng',
    password: 'password',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'admin@npopc.gov.ng',
    password: 'password',
    role: 'ADMIN'
  },
  {
    email: 'manager@npopc.gov.ng',
    password: 'password',
    role: 'MANAGER'
  },
  {
    email: 'operator@npopc.gov.ng',
    password: 'password',
    role: 'OPERATOR'
  },
  {
    email: 'viewer@npopc.gov.ng',
    password: 'password',
    role: 'VIEWER'
  }
];

// Test sign-in for each user
async function testSignIn(user) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: user.email,
      password: user.password
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signin',
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
        console.log(`\n=== Testing ${user.role} ===`);
        console.log(`Email: ${user.email}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Sign-in successful');
        } else {
          console.log('❌ Sign-in failed');
        }
        
        resolve({ user, statusCode: res.statusCode, response: data });
      });
    });

    req.on('error', (err) => {
      console.log(`\n=== Testing ${user.role} ===`);
      console.log(`Email: ${user.email}`);
      console.log(`❌ Error: ${err.message}`);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Test all users
async function testAllUsers() {
  console.log('🚀 Starting sign-in tests for all user roles...\n');
  
  for (const user of testUsers) {
    try {
      await testSignIn(user);
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ Failed to test ${user.role}: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Sign-in tests completed!');
}

// Run the tests
testAllUsers().catch(console.error);
