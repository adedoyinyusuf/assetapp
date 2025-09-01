# API Test Scripts

This directory contains test scripts for verifying the functionality of the User and Role Management APIs.

## Prerequisites

1. Node.js (v14 or later)
2. Running instance of the application (on http://localhost:3000 by default)
3. Database connection properly configured

## Test Scripts

### 1. User Management API Tests (`test-user-api.js`)

This script tests the following endpoints:
- GET /api/admin/users - List all users with pagination and search
- PATCH /api/admin/users - Update a user's role
- DELETE /api/admin/users - Soft delete a user

### 2. Role Management API Tests (`test-role-api.js`)

This script tests the following endpoints:
- GET /api/admin/roles - List all roles with pagination and search
- POST /api/admin/roles - Create a new role
- PUT /api/admin/roles - Update an existing role
- DELETE /api/admin/roles - Delete a role

## Running the Tests

1. Start your application in development mode:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run the test scripts:
   ```bash
   # Install required dependencies if not already installed
   npm install @prisma/client node-fetch

   # Run User Management API tests
   node scripts/test-user-api.js

   # Run Role Management API tests
   node scripts/test-role-api.js
   ```

## Test Data

- Test scripts create temporary test data (users and roles) with unique names based on timestamps
- All test data is automatically cleaned up after the tests complete, regardless of success or failure

## Expected Output

- Each test step will print a success (✅) or failure (❌) indicator
- Detailed error messages will be shown if any test fails
- The script will exit with a non-zero status code if any test fails

## Notes

- These tests require a running instance of the application
- The tests assume the database is properly set up with all required tables
- The tests are designed to be idempotent and can be run multiple times
- Test data is isolated using unique names to avoid conflicts with existing data
