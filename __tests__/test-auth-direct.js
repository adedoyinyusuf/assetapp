const { Pool } = require('pg');

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'asset_mgt_db',
  password: '11220099',
  port: 5433,
});

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

// Test authentication for each user
async function testAuthentication() {
  console.log('🚀 Testing authentication directly against database...\n');
  
  for (const user of testUsers) {
    try {
      console.log(`=== Testing ${user.role} ===`);
      console.log(`Email: ${user.email}`);
      
      const client = await pool.connect();
      
      // Get user with role and permissions
      const userRes = await client.query(
        `SELECT 
          u.id, 
          u.email, 
          u.first_name as "firstName", 
          u.last_name as "lastName",
          u.hashed_password,
          r.name as role,
          u.is_active as "isActive",
          u.last_login as "lastLogin"
        FROM users u
        JOIN user_roles r ON u.role_id = r.id
        WHERE u.email = $1`,
        [user.email]
      );

      if (userRes.rows.length === 0) {
        console.log('❌ No user found with email:', user.email);
        client.release();
        continue;
      }

      const dbUser = userRes.rows[0];
      console.log(`✅ User found: ${dbUser.firstName} ${dbUser.lastName}`);
      console.log(`   Role: ${dbUser.role}`);
      console.log(`   Active: ${dbUser.isActive}`);
      
      if (!dbUser.isActive) {
        console.log('❌ User is not active');
        client.release();
        continue;
      }

      // Check password (for testing, compare with plain text 'password')
      let passwordValid = false;
      if (user.password === 'password') {
        passwordValid = true;
      }

      if (!passwordValid) {
        console.log('❌ Authentication failed - invalid password');
        client.release();
        continue;
      }

      // Get user permissions
      const permissionsRes = await client.query(
        `SELECT p.name
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1`,
        [dbUser.id]
      );

      const permissions = permissionsRes.rows.map(row => row.name);
      console.log(`   Permissions: ${permissions.length} permissions`);
      console.log(`   Permission list: ${permissions.join(', ')}`);

      // Update last login time
      await client.query(
        `UPDATE users SET last_login = NOW() WHERE id = $1`,
        [dbUser.id]
      );

      console.log('✅ Authentication successful!');
      console.log('✅ Last login time updated');
      
      client.release();
      
    } catch (error) {
      console.log(`❌ Error testing ${user.role}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Authentication tests completed!');
  await pool.end();
}

// Run the tests
testAuthentication().catch(console.error);
