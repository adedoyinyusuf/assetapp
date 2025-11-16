import { VerificationCampaignStatus, VerificationCampaign, Prisma } from '@prisma/client';
import { BaseService, PaginatedResponse, NotFoundError, UnauthorizedError, ValidationError, ConflictError } from './base-service';
import { 
  CreateCampaignRequest, 
  UpdateCampaignRequest, 
  CampaignQueryParams,
  CreateAssignmentRequest 
} from './validation';
import { calculateVerificationProgress, calculateDaysBetween } from './utils';

// =============================================================================
// CAMPAIGN SERVICE CLASS
// =============================================================================

export class CampaignService extends BaseService {
  
  /**
   * Create a new verification campaign
   */
  async createCampaign(
    data: CreateCampaignRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerificationCampaign> {
    try {
      // Check if user has permission to create campaigns
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'create');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to create campaigns');
      }

      // Validate referenced entities exist
      await this.validateEntitiesExist('state', data.assignedStates, 'One or more assigned states not found');
      
      if (data.assignedLgas.length > 0) {
        await this.validateEntitiesExist('lga', data.assignedLgas, 'One or more assigned LGAs not found');
      }
      
      if (data.assignedCategories.length > 0) {
        await this.validateEntitiesExist('category', data.assignedCategories, 'One or more assigned categories not found');
      }

      // Calculate target asset count based on scope
      const targetAssetCount = await this.calculateTargetAssetCount(
        data.assignedStates,
        data.assignedLgas,
        data.assignedCategories
      );

      // Create the campaign
      const campaign = await this.db.verificationCampaign.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          assignedStates: data.assignedStates,
          assignedLgas: data.assignedLgas,
          assignedCategories: data.assignedCategories,
          budget: data.budget,
          instructions: data.instructions,
          metadata: data.metadata,
          targetAssetCount,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create audit log
      await this.createAuditLog(
        userId,
        'CREATE_CAMPAIGN',
        'VerificationCampaign',
        campaign.id,
        null,
        campaign,
        ipAddress,
        userAgent
      );

      return campaign;
    } catch (error) {
      this.handleError(error, 'CampaignService.createCampaign');
    }
  }

  /**
   * Get campaigns with filtering and pagination
   */
  async getCampaigns(
    params: CampaignQueryParams,
    userId: number
  ): Promise<PaginatedResponse<VerificationCampaignWithStats>> {
    try {
      // Check if user has permission to read campaigns
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view campaigns');
      }

      const {
        page,
        limit,
        status,
        startDate,
        endDate,
        createdBy,
        stateIds,
        lgaIds,
        search,
        sortBy,
        sortOrder
      } = params;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.VerificationCampaignWhereInput = {
        AND: [
          // Status filter
          status && status.length > 0 ? { status: { in: status } } : {},
          
          // Date range filter
          this.createDateRangeFilter(startDate, endDate, 'startDate'),
          
          // Creator filter
          createdBy ? { createdBy } : {},
          
          // State filter
          stateIds && stateIds.length > 0 
            ? { assignedStates: { hasSome: stateIds } } 
            : {},
          
          // LGA filter
          lgaIds && lgaIds.length > 0 
            ? { assignedLgas: { hasSome: lgaIds } } 
            : {},
          
          // Search filter
          this.createSearchFilter(search, ['name', 'description']),
        ],
      };

      // Get total count
      const total = await this.db.verificationCampaign.count({ where });

      // Get campaigns with related data
      const campaigns = await this.db.verificationCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.createOrderBy(sortBy, sortOrder),
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              verifications: true,
              assignments: true,
            },
          },
        },
      });

      // Enrich campaigns with statistics
      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const stats = await this.getCampaignStatistics(campaign.id);
          return {
            ...campaign,
            stats,
          };
        })
      );

      return {
        data: campaignsWithStats,
        pagination: this.createPagination(page, limit, total),
      };
    } catch (error) {
      this.handleError(error, 'CampaignService.getCampaigns');
    }
  }

  /**
   * Get a single campaign by ID with full details
   */
  async getCampaignById(campaignId: number, userId: number): Promise<CampaignDetailResponse> {
    try {
      // Check if user has permission to read campaigns
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view campaign');
      }

      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          verifications: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              asset: {
                select: {
                  id: true,
                  name: true,
                },
              },
              verifier: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      // Get comprehensive statistics
      const stats = await this.getCampaignStatistics(campaignId);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(campaignId);

      return {
        ...campaign,
        stats,
        recentActivity,
      };
    } catch (error) {
      this.handleError(error, 'CampaignService.getCampaignById');
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(
    campaignId: number,
    data: UpdateCampaignRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerificationCampaign> {
    try {
      // Check if user has permission to update campaigns
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'update');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to update campaigns');
      }

      // Get existing campaign
      const existingCampaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!existingCampaign) {
        throw new NotFoundError('Campaign not found');
      }

      // Validate that campaign can be updated
      if (existingCampaign.status === 'COMPLETED' || existingCampaign.status === 'CANCELLED') {
        throw new ValidationError('Cannot update completed or cancelled campaigns');
      }

      // Validate referenced entities if they're being updated
      if (data.assignedStates) {
        await this.validateEntitiesExist('state', data.assignedStates, 'One or more assigned states not found');
      }
      
      if (data.assignedLgas && data.assignedLgas.length > 0) {
-        await this.validateEntitiesExist('lga', data.assignedLgas, 'One or more assigned LGAs not found');
+        await this.validateEntitiesExist('lga', data.assignedLgas, 'One or more assigned LGAs not found');
      }
      
      if (data.assignedCategories && data.assignedCategories.length > 0) {
        await this.validateEntitiesExist('category', data.assignedCategories, 'One or more assigned categories not found');
      }

      // Recalculate target asset count if scope changed
      let targetAssetCount = existingCampaign.targetAssetCount;
      if (data.assignedStates || data.assignedLgas || data.assignedCategories) {
        targetAssetCount = await this.calculateTargetAssetCount(
          data.assignedStates || existingCampaign.assignedStates,
          data.assignedLgas || existingCampaign.assignedLgas,
          data.assignedCategories || existingCampaign.assignedCategories
        );
      }

      // Update the campaign
      const updatedCampaign = await this.db.verificationCampaign.update({
        where: { id: campaignId },
        data: {
          name: data.name,
          description: data.description,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          status: data.status,
          assignedStates: data.assignedStates,
          assignedLgas: data.assignedLgas,
          assignedCategories: data.assignedCategories,
          budget: data.budget,
          instructions: data.instructions,
          metadata: data.metadata,
          targetAssetCount,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create audit log
      await this.createAuditLog(
        userId,
        'UPDATE_CAMPAIGN',
        'VerificationCampaign',
        campaignId,
        existingCampaign,
        updatedCampaign,
        ipAddress,
        userAgent
      );

      return updatedCampaign;
    } catch (error) {
      this.handleError(error, 'CampaignService.updateCampaign');
    }
  }

  /**
   * Delete (cancel) a campaign
   */
  async deleteCampaign(
    campaignId: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Check if user has permission to delete campaigns
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'delete')
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to delete campaigns')
      }

      // Get existing campaign
      const existingCampaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
      })

      if (!existingCampaign) {
        throw new NotFoundError('Campaign not found')
      }

      // Prevent deletion if there are active verifications in the campaign
      const activeCount = await this.db.assetVerification.count({
        where: { campaignId, status: { in: ['IN_PROGRESS', 'PENDING'] } },
      })
      if (activeCount > 0) {
        throw new ConflictError('Cannot delete campaign with active verifications')
      }

      // Soft delete by marking as cancelled
      const cancelledCampaign = await this.db.verificationCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'CANCELLED',
        },
      })

      // Create audit log
      await this.createAuditLog(
        userId,
        'DELETE_CAMPAIGN',
        'VerificationCampaign',
        campaignId,
        existingCampaign,
        cancelledCampaign,
        ipAddress,
        userAgent
      )
    } catch (error) {
      this.handleError(error, 'CampaignService.deleteCampaign')
    }
  }

  /**
   * Start a campaign
   */
  async startCampaign(
    campaignId: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'manage')
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to start campaigns')
      }

      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
        include: { assignments: true },
      })

      if (!campaign) {
        throw new NotFoundError('Campaign not found')
      }

      // Require at least one assignment to start
      if (!campaign.assignments || campaign.assignments.length === 0) {
        throw new ValidationError('Cannot start campaign without team assignments')
      }

      // Allow starting from DRAFT or PLANNED
      if (campaign.status !== 'DRAFT' && campaign.status !== 'PLANNED') {
        throw new ValidationError('Only draft or planned campaigns can be started')
      }

      await this.db.verificationCampaign.update({
        where: { id: campaignId },
        data: { status: 'ACTIVE', startedAt: new Date() },
      })

      await this.createAuditLog(
        userId,
        'START_CAMPAIGN',
        'VerificationCampaign',
        campaignId,
        { status: campaign.status },
        { status: 'ACTIVE' },
        ipAddress,
        userAgent
      )
    } catch (error) {
      this.handleError(error, 'CampaignService.startCampaign')
    }
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(
    campaignId: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'manage');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to complete campaigns');
      }

      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      if (campaign.status !== 'ACTIVE') {
        throw new ValidationError('Only active campaigns can be completed');
      }

      await this.db.verificationCampaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await this.createAuditLog(
        userId,
        'COMPLETE_CAMPAIGN',
        'VerificationCampaign',
        campaignId,
        { status: campaign.status },
        { status: 'COMPLETED' },
        ipAddress,
        userAgent
      );
    } catch (error) {
      this.handleError(error, 'CampaignService.completeCampaign');
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(
    campaignId: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'manage');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to pause campaigns');
      }

      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      if (campaign.status !== 'ACTIVE') {
        throw new ValidationError('Only active campaigns can be paused');
      }

      await this.db.verificationCampaign.update({
        where: { id: campaignId },
        data: { status: 'PAUSED' },
      });

      await this.createAuditLog(
        userId,
        'PAUSE_CAMPAIGN',
        'VerificationCampaign',
        campaignId,
        { status: campaign.status },
        { status: 'PAUSED' },
        ipAddress,
        userAgent
      );
    } catch (error) {
      this.handleError(error, 'CampaignService.pauseCampaign');
    }
  }

  /**
   * Resume a campaign
   */
  async resumeCampaign(
    campaignId: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'manage');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to resume campaigns');
      }

      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      if (campaign.status !== 'PAUSED') {
        throw new ValidationError('Only paused campaigns can be resumed');
      }

      await this.db.verificationCampaign.update({
        where: { id: campaignId },
        data: { status: 'ACTIVE' },
      });

      await this.createAuditLog(
        userId,
        'RESUME_CAMPAIGN',
        'VerificationCampaign',
        campaignId,
        { status: campaign.status },
        { status: 'ACTIVE' },
        ipAddress,
        userAgent
      );
    } catch (error) {
      this.handleError(error, 'CampaignService.resumeCampaign');
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async calculateTargetAssetCount(
    stateIds: number[],
    lgaIds: number[],
    categoryIds: number[]
  ): Promise<number> {
    const where: Prisma.AssetWhereInput = {
      AND: [
        stateIds.length > 0 ? { stateId: { in: stateIds } } : {},
        lgaIds.length > 0 ? { lgaId: { in: lgaIds } } : {},
        categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {},
      ],
    };

    return await this.db.asset.count({ where });
  }

  private async getCampaignStatistics(campaignId: number): Promise<CampaignStatistics> {
    // Get verification counts by status
    const verificationCounts = await this.db.assetVerification.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { _all: true },
    });

    // Get discrepancy count
    const discrepancyCount = await this.db.verificationDiscrepancy.count({
      where: {
        verification: {
          campaignId,
        },
      },
    });

    // Calculate totals
    const totalVerifications = verificationCounts.reduce((sum, item) => sum + item._count._all, 0);
    const verifiedCount = verificationCounts
      .filter(item => ['VERIFIED', 'APPROVED'].includes(item.status))
      .reduce((sum, item) => sum + item._count._all, 0);

    const pendingCount = verificationCounts
      .filter(item => ['PENDING', 'IN_PROGRESS'].includes(item.status))
      .reduce((sum, item) => sum + item._count._all, 0);

    const missingCount = verificationCounts
      .filter(item => item.status === 'MISSING')
      .reduce((sum, item) => sum + item._count._all, 0);

    const damagedCount = verificationCounts
      .filter(item => item.status === 'DAMAGED')
      .reduce((sum, item) => sum + item._count._all, 0);

    // Get campaign target count
    const campaign = await this.db.verificationCampaign.findUnique({
      where: { id: campaignId },
      select: { targetAssetCount: true },
    });

    const targetCount = campaign?.targetAssetCount || 0;

    return {
      totalAssets: targetCount,
      verifiedAssets: verifiedCount,
      pendingAssets: pendingCount,
      missingAssets: missingCount,
      damagedAssets: damagedCount,
      discrepancyCount,
      totalValue: 0, // TODO: Calculate from asset values
      verifiedValue: 0, // TODO: Calculate from verified asset values
      averageVerificationTime: 0, // TODO: Calculate from verification durations
      teamProductivity: {}, // TODO: Calculate per-user productivity
    };
  }

  private async getRecentActivity(campaignId: number): Promise<ActivityLog[]> {
    const activities = await this.db.auditLog.findMany({
      where: {
        entityType: 'VerificationCampaign',
        entityId: campaignId,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: this.formatActivityDescription(activity.action),
      user: activity.user ? {
        id: activity.user.id,
        name: `${activity.user.firstName} ${activity.user.lastName}`,
      } : null,
      timestamp: activity.createdAt,
    }));
  }

  private formatActivityDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'CREATE_CAMPAIGN': 'Campaign created',
      'UPDATE_CAMPAIGN': 'Campaign updated',
      'START_CAMPAIGN': 'Campaign started',
      'COMPLETE_CAMPAIGN': 'Campaign completed',
      'DELETE_CAMPAIGN': 'Campaign cancelled',
    };

    return descriptions[action] || action;
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface VerificationCampaignWithStats extends VerificationCampaign {
  creator: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  stats: CampaignStatistics;
  _count: {
    verifications: number;
    assignments: number;
  };
}

export interface CampaignDetailResponse extends VerificationCampaign {
  creator: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  assignments: Array<{
    id: number;
    userId: number;
    role: string;
    user: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  }>;
  verifications: Array<{
    id: number;
    status: string;
    asset: {
      id: number;
      name: string;
    };
    verifier: {
      id: number;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
  stats: CampaignStatistics;
  recentActivity: ActivityLog[];
}

export interface CampaignStatistics {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  missingAssets: number;
  damagedAssets: number;
  discrepancyCount: number;
  totalValue: number;
  verifiedValue: number;
  averageVerificationTime: number;
  teamProductivity: Record<number, ProductivityMetrics>;
}

export interface ProductivityMetrics {
  userId: number;
  completedVerifications: number;
  averageTime: number;
  qualityScore: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  user: {
    id: number;
    name: string;
  } | null;
  timestamp: Date;
}