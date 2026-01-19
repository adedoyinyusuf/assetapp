import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { testClient } from '../../utils/test-client';
import { seedTestData, cleanupTestData } from '../../utils/test-data';
import { createTestUser, getTestSession } from '../../utils/test-auth';

// Mock dependencies
jest.mock('@/lib/prisma.server', () => {
  const { prismaMock } = require('../../__mocks__/prisma');
  return {
    __esModule: true,
    prisma: prismaMock,
    default: prismaMock,
  };
});

describe('Stock Verification Campaign API', () => {
  let testUser: any;
  let authHeaders: Record<string, string>;
  let testCampaign: any;

  beforeAll(async () => {
    await seedTestData();
    testUser = await createTestUser({
      email: 'campaign-test@example.com',
      permissions: ['campaign.create', 'campaign.read', 'campaign.update', 'campaign.delete', 'campaign.manage'],
    });
    authHeaders = await getTestSession(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Clean up any existing test campaigns
    await testClient.db.verificationCampaign.deleteMany({
      where: { name: { startsWith: 'Test Campaign' } },
    });
  });

  describe('POST /api/stock-verification/campaigns', () => {
    test('should create campaign with valid data', async () => {
      // Arrange
      const campaignData = {
        name: 'Test Campaign API',
        description: 'API test campaign',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        stateIds: [1, 2],
        lgaIds: [10, 11],
        categoryIds: [5, 6],
        instructions: 'Test campaign instructions',
      };

      // Act
      const response = await testClient.post('/api/stock-verification/campaigns')
        .set(authHeaders)
        .send(campaignData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Test Campaign API',
        status: 'DRAFT',
      });
      expect(response.body.data.id).toBeDefined();

      testCampaign = response.body.data;
    });

    test('should return 400 for invalid data', async () => {
      // Arrange
      const invalidData = {
        name: '', // Empty name should fail validation
        startDate: 'invalid-date',
      };

      // Act
      const response = await testClient.post('/api/stock-verification/campaigns')
        .set(authHeaders)
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    test('should return 409 for duplicate campaign name', async () => {
      // Arrange
      const campaignData = {
        name: 'Duplicate Campaign Name',
        description: 'First campaign',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        stateIds: [1],
        categoryIds: [5],
      };

      // Create first campaign
      await testClient.post('/api/stock-verification/campaigns')
        .set(authHeaders)
        .send(campaignData)
        .expect(201);

      // Act - Try to create second campaign with same name
      const response = await testClient.post('/api/stock-verification/campaigns')
        .set(authHeaders)
        .send({ ...campaignData, description: 'Second campaign' })
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    test('should return 401 for unauthenticated request', async () => {
      // Act
      const response = await testClient.post('/api/stock-verification/campaigns')
        .send({})
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    test('should return 403 for insufficient permissions', async () => {
      // Arrange
      const limitedUser = await createTestUser({
        email: 'limited-user@example.com',
        permissions: ['campaign.read'], // No create permission
      });
      const limitedHeaders = await getTestSession(limitedUser.id);

      // Act
      const response = await testClient.post('/api/stock-verification/campaigns')
        .set(limitedHeaders)
        .send({
          name: 'Test Campaign',
          stateIds: [1],
          categoryIds: [5],
        })
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/stock-verification/campaigns', () => {
    beforeEach(async () => {
      // Create test campaigns
      await testClient.db.verificationCampaign.createMany({
        data: [
          {
            name: 'Test Campaign 1',
            description: 'First test campaign',
            status: 'ACTIVE',
            createdBy: testUser.id,
            stateIds: [1, 2],
            categoryIds: [5, 6],
          },
          {
            name: 'Test Campaign 2',
            description: 'Second test campaign',
            status: 'DRAFT',
            createdBy: testUser.id,
            stateIds: [1],
            categoryIds: [5],
          },
        ],
      });
    });

    test('should return paginated campaign list', async () => {
      // Act
      const response = await testClient.get('/api/stock-verification/campaigns')
        .set(authHeaders)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    test('should filter by status', async () => {
      // Act
      const response = await testClient.get('/api/stock-verification/campaigns')
        .set(authHeaders)
        .query({ status: 'ACTIVE' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      response.body.data.forEach((campaign: any) => {
        expect(campaign.status).toBe('ACTIVE');
      });
    });

    test('should search campaigns', async () => {
      // Act
      const response = await testClient.get('/api/stock-verification/campaigns')
        .set(authHeaders)
        .query({ search: 'First test' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].description).toContain('First test');
    });

    test('should sort campaigns', async () => {
      // Act
      const response = await testClient.get('/api/stock-verification/campaigns')
        .set(authHeaders)
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      if (response.body.data.length > 1) {
        expect(response.body.data[0].name <= response.body.data[1].name).toBe(true);
      }
    });
  });

  describe('GET /api/stock-verification/campaigns/:id', () => {
    beforeEach(async () => {
      testCampaign = await testClient.db.verificationCampaign.create({
        data: {
          name: 'Test Campaign Details',
          description: 'Test campaign for details endpoint',
          status: 'ACTIVE',
          createdBy: testUser.id,
          stateIds: [1, 2],
          categoryIds: [5, 6],
        },
      });
    });

    test('should return campaign details', async () => {
      // Act
      const response = await testClient.get(`/api/stock-verification/campaigns/${testCampaign.id}`)
        .set(authHeaders)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testCampaign.id,
        name: 'Test Campaign Details',
        status: 'ACTIVE',
      });
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.assignments).toBeDefined();
    });

    test('should return 404 for non-existent campaign', async () => {
      // Act
      const response = await testClient.get('/api/stock-verification/campaigns/999999')
        .set(authHeaders)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should return 400 for invalid campaign ID', async () => {
      // Act
      const response = await testClient.get('/api/stock-verification/campaigns/invalid-id')
        .set(authHeaders)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid campaign ID');
    });
  });

  describe('PUT /api/stock-verification/campaigns/:id', () => {
    beforeEach(async () => {
      testCampaign = await testClient.db.verificationCampaign.create({
        data: {
          name: 'Test Campaign Update',
          description: 'Original description',
          status: 'DRAFT',
          createdBy: testUser.id,
          stateIds: [1],
          categoryIds: [5],
        },
      });
    });

    test('should update campaign successfully', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Campaign Name',
        description: 'Updated description',
      };

      // Act
      const response = await testClient.put(`/api/stock-verification/campaigns/${testCampaign.id}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testCampaign.id,
        name: 'Updated Campaign Name',
        description: 'Updated description',
      });
    });

    test('should prevent updating completed campaign', async () => {
      // Arrange - Mark campaign as completed
      await testClient.db.verificationCampaign.update({
        where: { id: testCampaign.id },
        data: { status: 'COMPLETED' },
      });

      // Act
      const response = await testClient.put(`/api/stock-verification/campaigns/${testCampaign.id}`)
        .set(authHeaders)
        .send({ name: 'Should not update' })
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('completed');
    });
  });

  describe('DELETE /api/stock-verification/campaigns/:id', () => {
    beforeEach(async () => {
      testCampaign = await testClient.db.verificationCampaign.create({
        data: {
          name: 'Test Campaign Delete',
          status: 'DRAFT',
          createdBy: testUser.id,
          stateIds: [1],
          categoryIds: [5],
        },
      });
    });

    test('should soft delete campaign', async () => {
      // Act
      const response = await testClient.delete(`/api/stock-verification/campaigns/${testCampaign.id}`)
        .set(authHeaders)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);

      // Verify campaign is marked as cancelled
      const updatedCampaign = await testClient.db.verificationCampaign.findUnique({
        where: { id: testCampaign.id },
      });
      expect(updatedCampaign?.status).toBe('CANCELLED');
    });

    test('should prevent deleting campaign with active verifications', async () => {
      // Arrange - Create an active verification
      await testClient.db.assetVerification.create({
        data: {
          campaignId: testCampaign.id,
          assetId: 1,
          verifierId: testUser.id,
          assignmentId: 1,
          status: 'IN_PROGRESS',
        },
      });

      // Act
      const response = await testClient.delete(`/api/stock-verification/campaigns/${testCampaign.id}`)
        .set(authHeaders)
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('active verifications');
    });
  });

  describe('POST /api/stock-verification/campaigns/:id/actions', () => {
    beforeEach(async () => {
      testCampaign = await testClient.db.verificationCampaign.create({
        data: {
          name: 'Test Campaign Actions',
          status: 'DRAFT',
          createdBy: testUser.id,
          stateIds: [1],
          categoryIds: [5],
        },
      });

      // Add a team assignment to make the campaign startable
      await testClient.db.verificationAssignment.create({
        data: {
          campaignId: testCampaign.id,
          userId: testUser.id,
          role: 'LEAD_VERIFIER',
          stateIds: [1],
          lgaIds: [],
          categoryIds: [5],
        },
      });
    });

    test('should start campaign', async () => {
      // Act
      const response = await testClient.post(`/api/stock-verification/campaigns/${testCampaign.id}/actions`)
        .set(authHeaders)
        .send({ action: 'start' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACTIVE');
    });

    test('should pause campaign', async () => {
      // Arrange - Start the campaign first
      await testClient.db.verificationCampaign.update({
        where: { id: testCampaign.id },
        data: { status: 'ACTIVE' },
      });

      // Act
      const response = await testClient.post(`/api/stock-verification/campaigns/${testCampaign.id}/actions`)
        .set(authHeaders)
        .send({ action: 'pause' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PAUSED');
    });

    test('should resume campaign', async () => {
      // Arrange - Set campaign as paused
      await testClient.db.verificationCampaign.update({
        where: { id: testCampaign.id },
        data: { status: 'PAUSED' },
      });

      // Act
      const response = await testClient.post(`/api/stock-verification/campaigns/${testCampaign.id}/actions`)
        .set(authHeaders)
        .send({ action: 'resume' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ACTIVE');
    });

    test('should complete campaign', async () => {
      // Arrange - Set campaign as active
      await testClient.db.verificationCampaign.update({
        where: { id: testCampaign.id },
        data: { status: 'ACTIVE' },
      });

      // Act
      const response = await testClient.post(`/api/stock-verification/campaigns/${testCampaign.id}/actions`)
        .set(authHeaders)
        .send({ action: 'complete' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
    });

    test('should return 400 for invalid action', async () => {
      // Act
      const response = await testClient.post(`/api/stock-verification/campaigns/${testCampaign.id}/actions`)
        .set(authHeaders)
        .send({ action: 'invalid-action' })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });
  });

  describe('Rate limiting and performance', () => {
    test('should handle concurrent requests', async () => {
      // Arrange
      const campaignData = {
        name: 'Concurrent Test Campaign',
        stateIds: [1],
        categoryIds: [5],
      };

      const requests = Array(5).fill(null).map((_, index) =>
        testClient.post('/api/stock-verification/campaigns')
          .set(authHeaders)
          .send({
            ...campaignData,
            name: `${campaignData.name} ${index}`,
          })
          .expect(201)
      );

      // Act
      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(`${campaignData.name} ${index}`);
      });
    });

    test('should handle large payload', async () => {
      // Arrange
      const largeMetadata = {
        description: 'A'.repeat(1000), // Large description
        instructions: 'B'.repeat(2000), // Large instructions
        metadata: {
          notes: 'C'.repeat(500),
          customField1: 'D'.repeat(300),
          customField2: 'E'.repeat(300),
        },
      };

      const campaignData = {
        name: 'Large Payload Campaign',
        stateIds: [1],
        categoryIds: [5],
        ...largeMetadata,
      };

      // Act
      const response = await testClient.post('/api/stock-verification/campaigns')
        .set(authHeaders)
        .send(campaignData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(largeMetadata.description);
    });
  });
});

// Helper functions for test setup
async function setupCampaignWithAssignments() {
  const campaign = await testClient.db.verificationCampaign.create({
    data: {
      name: 'Campaign with Assignments',
      status: 'DRAFT',
      createdBy: 1,
      stateIds: [1],
      categoryIds: [5],
    },
  });

  const assignment = await testClient.db.verificationAssignment.create({
    data: {
      campaignId: campaign.id,
      userId: 1,
      role: 'FIELD_VERIFIER',
      stateIds: [1],
      lgaIds: [],
      categoryIds: [5],
    },
  });

  return { campaign, assignment };
}

async function createTestVerifications(campaignId: number, count: number) {
  const verifications = [];
  for (let i = 0; i < count; i++) {
    const verification = await testClient.db.assetVerification.create({
      data: {
        campaignId,
        assetId: i + 1,
        verifierId: 1,
        assignmentId: 1,
        status: 'PENDING',
      },
    });
    verifications.push(verification);
  }
  return verifications;
}