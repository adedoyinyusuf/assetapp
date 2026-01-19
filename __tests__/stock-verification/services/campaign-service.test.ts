import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CampaignService } from '../../../lib/stock-verification/campaign-service';
import { prismaMock } from '../../__mocks__/prisma';

// Mock dependencies
// Mock dependencies
jest.mock('@/lib/prisma.server', () => {
  const { prismaMock } = require('../../__mocks__/prisma');
  return {
    __esModule: true,
    prisma: prismaMock,
    default: prismaMock,
  };
});

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
      assignedStates: [1, 2],
      assignedLgas: [10, 11],
      assignedCategories: [5, 6],
      budget: 10000,
      instructions: 'Test instructions',
      metadata: { priority: 'HIGH' },
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
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'create' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findFirst.mockResolvedValue(null);
      prismaMock.state.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      prismaMock.lGA.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }] as any);
      prismaMock.category.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }] as any);

      prismaMock.$transaction.mockImplementation(async (fn: any) => {
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
            createdBy: mockUserId,
          }),
        })
      );
    });

    test('should validate referenced entities exist', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'create' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findFirst.mockResolvedValue(null);
      prismaMock.state.findMany.mockResolvedValue([{ id: 1 }] as any); // Missing state ID 2

      // Act & Assert
      await expect(
        campaignService.createCampaign(mockCampaignData, mockUserId)
      ).rejects.toThrow('One or more assigned states not found');
    });

    test('should calculate target asset count', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'create' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findFirst.mockResolvedValue(null);
      prismaMock.state.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      prismaMock.lGA.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }] as any);
      prismaMock.category.findMany.mockResolvedValue([{ id: 5 }, { id: 6 }] as any);
      prismaMock.asset.count.mockResolvedValue(150);

      prismaMock.$transaction.mockImplementation(async (fn: any) => {
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

    test('should throw UnauthorizedError if user has no permission', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: { permissions: [] }
      } as any);

      await expect(
        campaignService.createCampaign(mockCampaignData, mockUserId)
      ).rejects.toThrow('Insufficient permissions to create campaigns');
    });
  });

  describe('getCampaigns', () => {
    test('should filter by status and apply pagination', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'read' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findMany.mockResolvedValue([
        { id: 1, name: 'Campaign A', status: 'ACTIVE' },
        { id: 2, name: 'Campaign B', status: 'ACTIVE' },
      ] as any);

      prismaMock.verificationCampaign.count.mockResolvedValue(2);
      prismaMock.assetVerification.groupBy.mockResolvedValue([]);
      prismaMock.verificationDiscrepancy.count.mockResolvedValue(0);
      prismaMock.verificationCampaign.findUnique.mockResolvedValue({ targetAssetCount: 100 } as any);

      // Act
      const result = await campaignService.getCampaigns({
        status: ['ACTIVE'],
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }, mockUserId);

      // Assert
      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(2);
    });

    test('should throw UnauthorizedError if user has no permission', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: { permissions: [] }
      } as any);

      prismaMock.verificationAssignment.findMany.mockResolvedValue([]);

      await expect(
        campaignService.getCampaigns({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }, mockUserId)
      ).rejects.toThrow('Insufficient permissions to view campaigns');
    });
  });

  describe('getCampaignById', () => {
    const mockCampaignId = 1;

    test('should return campaign with stats and progress', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'read' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        name: 'Test Campaign',
        targetAssetCount: 100,
        _count: { verifications: 10, assignments: 2 },
      } as any);

      // Mock stats gathering
      prismaMock.assetVerification.groupBy.mockResolvedValue([
        { status: 'VERIFIED', _count: { _all: 50 } },
        { status: 'PENDING', _count: { _all: 50 } }
      ] as any);

      prismaMock.verificationDiscrepancy.count.mockResolvedValue(5);
      prismaMock.auditLog.findMany.mockResolvedValue([]);

      // Act
      const result = await campaignService.getCampaignById(mockCampaignId, mockUserId);

      // Assert
      expect(result.id).toBe(mockCampaignId);
      expect(result.verificationProgress).toBe(50); // 50/100 * 100
      expect(result.stats.verifiedAssets).toBe(50);
      expect(result._count.discrepancies).toBe(5);
    });

    test('should throw NotFoundError if campaign does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'read' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue(null);

      await expect(campaignService.getCampaignById(999, mockUserId))
        .rejects.toThrow('Campaign not found');
    });

    test('should throw UnauthorizedError if user has no permission', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: { permissions: [] }
      } as any);

      prismaMock.verificationAssignment.findFirst.mockResolvedValue(null);

      await expect(campaignService.getCampaignById(mockCampaignId, mockUserId))
        .rejects.toThrow('You are not assigned to this campaign');
    });
  });

  describe('updateCampaign', () => {
    const mockCampaignId = 1;
    const updateData = { name: 'Updated Name', status: 'DRAFT' as const };

    test('should update campaign successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'update' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'DRAFT'
      } as any);

      prismaMock.verificationCampaign.update.mockResolvedValue({
        id: mockCampaignId,
        name: 'Updated Name',
        status: 'DRAFT'
      } as any);

      const result = await campaignService.updateCampaign(mockCampaignId, updateData, mockUserId);

      expect(result.name).toBe('Updated Name');
      expect(prismaMock.verificationCampaign.update).toHaveBeenCalled();
    });

    test('should prevent updating completed campaigns', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'update' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'COMPLETED'
      } as any);

      await expect(campaignService.updateCampaign(mockCampaignId, updateData, mockUserId))
        .rejects.toThrow('Cannot update completed or cancelled campaigns');
    });

    test('should throw UnauthorizedError if user has no permission', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: { permissions: [] }
      } as any);

      await expect(campaignService.updateCampaign(mockCampaignId, updateData, mockUserId))
        .rejects.toThrow('Insufficient permissions to update campaigns');
    });
  });

  describe('deleteCampaign', () => {
    const mockCampaignId = 1;

    test('should soft delete campaign via cancellation', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'delete' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'DRAFT'
      } as any);

      prismaMock.assetVerification.count.mockResolvedValue(0);

      await campaignService.deleteCampaign(mockCampaignId, mockUserId);

      expect(prismaMock.verificationCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCampaignId },
          data: { status: 'CANCELLED' }
        })
      );
    });

    test('should prevent deletion if active verifications exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'delete' } }]
        }
      } as any);

      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId,
        status: 'ACTIVE'
      } as any);

      prismaMock.assetVerification.count.mockResolvedValue(5);

      await expect(campaignService.deleteCampaign(mockCampaignId, mockUserId))
        .rejects.toThrow('Cannot delete campaign with active verifications');
    });

    test('should throw UnauthorizedError if user has no permission', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: { permissions: [] }
      } as any);

      await expect(campaignService.deleteCampaign(mockCampaignId, mockUserId))
        .rejects.toThrow('Insufficient permissions to delete campaigns');
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
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'manage' } }]
        }
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
        }),
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });

    test('should require assignments to start', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'manage' } }]
        }
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

    test('should throw UnauthorizedError if user has no permission', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: { permissions: [] }
      } as any);

      await expect(campaignService.startCampaign(mockCampaignId, mockUserId))
        .rejects.toThrow('Insufficient permissions to start campaigns');
    });
  });

  describe('lifecycle transitions', () => {
    const mockCampaignId = 1;

    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: {
          permissions: [{ permission: { resource: 'campaign', action: 'manage' } }]
        }
      } as any);
    });

    test('pauseCampaign should set status to PAUSED', async () => {
      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId, status: 'ACTIVE'
      } as any);

      await campaignService.pauseCampaign(mockCampaignId, mockUserId);

      expect(prismaMock.verificationCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'PAUSED' }
        })
      );
    });

    test('resumeCampaign should set status to ACTIVE', async () => {
      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId, status: 'PAUSED'
      } as any);

      await campaignService.resumeCampaign(mockCampaignId, mockUserId);

      expect(prismaMock.verificationCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'ACTIVE' }
        })
      );
    });

    test('completeCampaign should set status to COMPLETED', async () => {
      prismaMock.verificationCampaign.findUnique.mockResolvedValue({
        id: mockCampaignId, status: 'ACTIVE'
      } as any);

      await campaignService.completeCampaign(mockCampaignId, mockUserId);

      expect(prismaMock.verificationCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'COMPLETED' }
        })
      );
    });

    test('should throw UnauthorizedError if user has no permission', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUserId,
        isActive: true,
        role: { permissions: [] }
      } as any);

      // Test one of the management actions
      await expect(campaignService.pauseCampaign(mockCampaignId, mockUserId))
        .rejects.toThrow('Insufficient permissions to pause campaigns');
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
  assignedStates: [1, 2],
  assignedLgas: [10, 11],
  assignedCategories: [5, 6],
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