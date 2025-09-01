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
const TEST_ROLE_NAME = `TEST_ROLE_${Date.now()}`;
const UPDATED_ROLE_NAME = `UPDATED_${TEST_ROLE_NAME}`;

async function runTests() {
  console.log('Starting Role Management API tests...');
  let testRoleId;
  
  try {
    // 1. Test GET /api/admin/roles
    console.log('\n1. Testing GET /api/admin/roles...');
    const roles = await fetchJson('http://localhost:3000/api/admin/roles');
    console.log(`✅ Retrieved ${roles.data.length} roles`);
    console.log('Pagination:', roles.pagination);

    // 2. Test POST /api/admin/roles
    console.log('\n2. Testing role creation...');
    const newRole = await fetchJson('http://localhost:3000/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: TEST_ROLE_NAME,
        description: 'Test role for API testing',
        permissions: [], // No permissions for this test
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Created test role:', newRole);
    testRoleId = newRole.id;

    // 3. Test GET /api/admin/roles with search
    console.log('\n3. Testing role search...');
    const searchResults = await fetchJson(
      `http://localhost:3000/api/admin/roles?search=${encodeURIComponent(TEST_ROLE_NAME)}`
    );
    console.log(`✅ Found ${searchResults.data.length} matching roles`);

    // 4. Test PUT /api/admin/roles to update role
    console.log('\n4. Testing role update...');
    const updatedRole = await fetchJson('http://localhost:3000/api/admin/roles', {
      method: 'PUT',
      body: JSON.stringify({
        id: testRoleId,
        name: UPDATED_ROLE_NAME,
        description: 'Updated test role description',
        permissions: [],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Updated role:', updatedRole);

    // 5. Test DELETE /api/admin/roles
    console.log('\n5. Testing role deletion...');
    await fetchJson(`http://localhost:3000/api/admin/roles?id=${testRoleId}`, {
      method: 'DELETE',
    });
    
    // Verify role was deleted
    const deletedRole = await prisma.userRole.findUnique({
      where: { id: testRoleId },
    });
    
    if (!deletedRole) {
      console.log('✅ Role was deleted successfully');
    } else {
      throw new Error('Role was not deleted properly');
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
      // Delete test roles
      await prisma.userRole.deleteMany({
        where: { 
          name: {
            in: [TEST_ROLE_NAME, UPDATED_ROLE_NAME],
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
