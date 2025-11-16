import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CampaignService } from '../../../lib/stock-verification/campaign-service';
import { prismaMock } from '../../__mocks__/prisma';

// Mock dependencies
jest.mock('@/lib/prisma.server', () => ({
  __esModule: true,
  prisma: prismaMock,
  default: prismaMock,
}));

describe('CampaignService', () => {
  let campaignService: CampaignService;
  const mockUserId = 1;

  beforeEach(() => {
    campaignService = new CampaignService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createCampaign', () => {
    const mockCampaignData = {
      name: 'Test Campaign',
      description: 'Test campaign description',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      stateIds: [1, 2],
      lgaIds: [10, 11],
      categoryIds: [5, 6],
      priority: 'HIGH' as const,
      instructions: 'Test instructions',
      metadata: { budget: 10000 },
    };

    test('should create campaign successfully', async () => {
      // Arrange
      const mockCreatedCampaign = {
        id: 1,
        ...mockCampaignData,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'create' } }],
      } as any);

      prismaMock.verificationCampaign.findFirst.mockResolvedValue(null);
      prismaMock.state.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      prismaMock.lGA.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }] as any);
      prismaMock.category.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }] as any);
      
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return await fn(prismaMock);
      });

      prismaMock.verificationCampaign.create.mockResolvedValue(mockCreatedCampaign as any);
      prismaMock.asset.count.mockResolvedValue(100);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      // Act
      const result = await campaignService.createCampaign(
        mockCampaignData,
        mockUserId,
        '127.0.0.1',
        'test-agent'
      );

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        name: 'Test Campaign',
        status: 'DRAFT',
      }));

      expect(prismaMock.verificationCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Campaign',
            status: 'DRAFT',
            createdBy: mockUserId,
          }),
        })
      );
    });

    test('should throw error for duplicate campaign name', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'create' } }],
      } as any);

      prismaMock.verificationCampaign.findFirst.mockResolvedValue({
        id: 999,
        name: 'Test Campaign',
      } as any);

      // Act & Assert
      await expect(
        campaignService.createCampaign(mockCampaignData, mockUserId)
      ).rejects.toThrow('Campaign name already exists');
    });

    test('should throw error for insufficient permissions', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [],
      } as any);

      // Act & Assert
      await expect(
        campaignService.createCampaign(mockCampaignData, mockUserId)
      ).rejects.toThrow('Insufficient permissions');
    });

    test('should validate referenced entities exist', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'create' } }],
      } as any);

      prismaMock.verificationCampaign.findFirst.mockResolvedValue(null);
      prismaMock.state.findMany.mockResolvedValue([{ id: 1 }] as any); // Missing state ID 2

      // Act & Assert
      await expect(
        campaignService.createCampaign(mockCampaignData, mockUserId)
      ).rejects.toThrow('One or more states not found');
    });

    test('should calculate target asset count', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'create' } }],
      } as any);

      prismaMock.verificationCampaign.findFirst.mockResolvedValue(null);
      prismaMock.state.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      prismaMock.lGA.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }] as any);
      prismaMock.category.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }] as any);
      prismaMock.asset.count.mockResolvedValue(150);

      prismaMock.$transaction.mockImplementation(async (fn) => {
        return await fn(prismaMock);
      });

      prismaMock.verificationCampaign.create.mockResolvedValue({
        id: 2,
        ...mockCampaignData,
        status: 'DRAFT',
        targetAssetCount: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
      } as any);

      // Act
      const result = await campaignService.createCampaign(
        mockCampaignData,
        mockUserId,
        '127.0.0.1',
        'test-agent'
      );

      // Assert
      expect(result.targetAssetCount).toBe(150);
      expect(prismaMock.asset.count).toHaveBeenCalled();
    });
  });

  describe('getCampaigns', () => {
    test('should filter by status and apply pagination', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'read' } }],
      } as any);

      prismaMock.verificationCampaign.findMany.mockResolvedValue([
        { id: 1, name: 'Campaign A', status: 'ACTIVE' },
        { id: 2, name: 'Campaign B', status: 'ACTIVE' },
      ] as any);

      prismaMock.verificationCampaign.count.mockResolvedValue(2);

      // Act
      const result = await campaignService.getCampaigns({ status: 'ACTIVE', page: 1, limit: 10 }, mockUserId);

      // Assert
      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('startCampaign', () => {
    const mockCampaignId = 1;

    test('should start campaign successfully', async () => {
      // Arrange
      const mockCampaign = {
        id: mockCampaignId,
        status: 'DRAFT',
        assignments: [{ id: 1, userId: 2 }],
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'manage' } }],
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue(mockCampaign as any);
      prismaMock.verificationCampaign.update.mockResolvedValue({
        ...mockCampaign,
        status: 'ACTIVE',
        startedAt: new Date(),
      } as any);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      // Act
      await campaignService.startCampaign(mockCampaignId, mockUserId);

      // Assert
      expect(prismaMock.verificationCampaign.update).toHaveBeenCalledWith({
        where: { id: mockCampaignId },
        data: expect.objectContaining({
          status: 'ACTIVE',
          startedAt: expect.any(Date),
        }),
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    test('should require assignments to start', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'manage' } }],
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'DRAFT',
        assignments: [],
      } as any);

      // Act & Assert
      await expect(
        campaignService.startCampaign(mockCampaignId, mockUserId)
      ).rejects.toThrow('Cannot start campaign without team assignments');
    });

    test('should only start when status is DRAFT or PLANNED', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'manage' } }],
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'ACTIVE',
        assignments: [{ id: 1, userId: 2 }],
      } as any);

      // Act & Assert
      await expect(
        campaignService.startCampaign(mockCampaignId, mockUserId)
      ).rejects.toThrow('Only draft or planned campaigns can be started');
    });
  });

  describe('completeCampaign', () => {
    const mockCampaignId = 1;

    test('should complete campaign successfully', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'manage' } }],
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'ACTIVE',
      } as any);

      prismaMock.verificationCampaign.update.mockResolvedValue({
        id: mockCampaignId,
        status: 'COMPLETED',
        completedAt: new Date(),
      } as any);

      prismaMock.auditLog.create.mockResolvedValue({} as any);

      // Act
      await campaignService.completeCampaign(mockCampaignId, mockUserId);

      // Assert
      expect(prismaMock.verificationCampaign.update).toHaveBeenCalledWith({
        where: { id: mockCampaignId },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    test('should require ACTIVE status to complete', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        permissions: [{ permission: { resource: 'campaign', action: 'manage' } }],
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'PLANNED',
      } as any);

      // Act & Assert
      await expect(
        campaignService.completeCampaign(mockCampaignId, mockUserId)
      ).rejects.toThrow('Only active campaigns can be completed');
    });
  });
});

// Additional test utilities and mocks
export const createMockCampaign = (overrides = {}) => ({
  id: 1,
  name: 'Test Campaign',
  description: 'Test Description',
  status: 'DRAFT',
  priority: 'MEDIUM',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  stateIds: [1, 2],
  lgaIds: [10, 11],
  categoryIds: [5, 6],
  instructions: 'Test instructions',
  metadata: {},
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (permissions: string[] = []) => ({
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  permissions: permissions.map(perm => {
    const [resource, action] = perm.split('.');
    return {
      permission: { resource, action },
    };
  }),
});