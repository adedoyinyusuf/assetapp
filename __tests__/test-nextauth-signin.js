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

// Helper to fetch CSRF token
async function fetchCsrfToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/csrf',
      method: 'GET',
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.csrfToken);
        } catch (e) {
          reject('Failed to parse CSRF token');
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

// Test sign-in for each user using NextAuth.js
async function testNextAuthSignIn(user, csrfToken) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: user.email,
      password: user.password,
      csrfToken: csrfToken
    });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n=== Testing ${user.role} ===`);
        console.log(`Email: ${user.email}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);
        console.log(`Response Body: ${data.substring(0, 200)}...`);
        if (res.statusCode === 200 || res.statusCode === 302) {
          console.log('✅ Sign-in successful');
        } else {
          console.log('❌ Sign-in failed');
        }
        resolve({ user, statusCode: res.statusCode, response: data, headers: res.headers });
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

// Test the sign-in page to see if it's accessible
async function testSignInPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/signin',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n=== Testing Sign-in Page ===`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);
        console.log(`Page accessible: ${res.statusCode === 200 ? '✅ Yes' : '❌ No'}`);
        
        resolve({ statusCode: res.statusCode, response: data, headers: res.headers });
      });
    });

    req.on('error', (err) => {
      console.log(`\n=== Testing Sign-in Page ===`);
      console.log(`❌ Error: ${err.message}`);
      reject(err);
    });

    req.end();
  });
}

// Test all users
async function testAllUsers() {
  console.log('🚀 Starting NextAuth.js sign-in tests for all user roles...\n');
  let csrfToken;
  try {
    csrfToken = await fetchCsrfToken();
    console.log('Fetched CSRF token:', csrfToken);
  } catch (error) {
    console.log('❌ Failed to fetch CSRF token:', error);
    return;
  }
  for (const user of testUsers) {
    try {
      await testNextAuthSignIn(user, csrfToken);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ Failed to test ${user.role}: ${error.message}`);
    }
  }
  console.log('\n🏁 NextAuth.js sign-in tests completed!');
}

testAllUsers().catch(console.error);
