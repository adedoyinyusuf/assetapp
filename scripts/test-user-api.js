const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

// Helper function to make HTTP requests
async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.response = await response.json().catch(() => null);
    throw error;
  }

  return response.json();
}

// Test data
const TEST_USER_EMAIL = `testuser_${Date.now()}@example.com`;
const TEST_ROLE_NAME = `TEST_ROLE_${Date.now()}`;

async function runTests() {
  console.log('Starting User Management API tests...');
  
  try {
    // 1. Create a test role first
    console.log('\n1. Creating test role...');
    const testRole = await prisma.userRole.create({
      data: {
        name: TEST_ROLE_NAME,
        description: 'Test role for API testing',
      },
    });
    console.log(`✅ Created test role: ${testRole.name} (ID: ${testRole.id})`);

    // 2. Test GET /api/admin/users
    console.log('\n2. Testing GET /api/admin/users...');
    const users = await fetchJson('http://localhost:3000/api/admin/users');
    console.log(`✅ Retrieved ${users.data.length} users`);
    console.log('Pagination:', users.pagination);

    // 3. Create a test user
    console.log('\n3. Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        hashedPassword: 'hashed_test_password', // In a real test, you'd hash this
        firstName: 'Test',
        lastName: 'User',
        roleId: testRole.id,
      },
    });
    console.log(`✅ Created test user: ${testUser.email} (ID: ${testUser.id})`);

    // 4. Test GET /api/admin/users with search
    console.log('\n4. Testing user search...');
    const searchResults = await fetchJson(
      `http://localhost:3000/api/admin/users?search=${encodeURIComponent('Test User')}`
    );
    console.log(`✅ Found ${searchResults.data.length} matching users`);

    // 5. Test PATCH /api/admin/users to update user role
    console.log('\n5. Testing user role update...');
    // First, create another role for testing
    const newTestRole = await prisma.userRole.create({
      data: {
        name: `NEW_${TEST_ROLE_NAME}`,
        description: 'New test role',
      },
    });
    
    const updateResponse = await fetchJson('http://localhost:3000/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: testUser.id,
        roleId: newTestRole.id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Updated user role:', updateResponse);

    // 6. Test DELETE /api/admin/users (soft delete)
    console.log('\n6. Testing user soft delete...');
    await fetchJson(`http://localhost:3000/api/admin/users?id=${testUser.id}`, {
      method: 'DELETE',
    });
    
    // Verify user was soft deleted
    const deletedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    
    if (deletedUser && !deletedUser.isActive) {
      console.log('✅ User was soft deleted successfully');
    } else {
      throw new Error('User was not soft deleted properly');
    }

    console.log('\n🎉 All tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  } finally {
    // Clean up test data
    console.log('\nCleaning up test data...');
    try {
      // Delete test user if it exists
      await prisma.user.deleteMany({
        where: { email: TEST_USER_EMAIL },
      });
      
      // Delete test roles
      await prisma.userRole.deleteMany({
        where: { 
          name: {
            contains: TEST_ROLE_NAME,
          },
        },
      });
      
      console.log('✅ Cleanup complete');
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the tests
runTests();
