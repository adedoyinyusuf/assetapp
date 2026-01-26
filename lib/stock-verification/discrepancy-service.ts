import { VerificationDiscrepancy, DiscrepancyType, DiscrepancySeverity, DiscrepancyStatus, Prisma } from '@prisma/client';
import { BaseService, PaginatedResponse, NotFoundError, UnauthorizedError, ValidationError, ConflictError } from './base-service';
import { CreateDiscrepancyRequest, UpdateDiscrepancyRequest, DiscrepancyQueryParams } from './validation';

// =============================================================================
// DISCREPANCY MANAGEMENT SERVICE CLASS
// =============================================================================

export class DiscrepancyService extends BaseService {

  /**
   * Create a new discrepancy
   */
  async createDiscrepancy(
    data: CreateDiscrepancyRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DiscrepancyWithDetails> {
    try {
      // Check if user has permission to create discrepancies
      const hasPermission = await this.checkUserAccess(userId, 'discrepancy', 'create');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to create discrepancies');
      }

      // Validate verification exists and user has access to it
      const verification = await this.db.assetVerification.findUnique({
        where: { id: data.verificationId },
        include: {
          campaign: true,
          asset: { include: { category: true, state: true, lga: true } }
        },
      });

      if (!verification) {
        throw new NotFoundError('Verification not found');
      }

      // Check if user is assigned to this campaign or has supervisor role
      const hasAccess = await this.checkCampaignAccess(userId, verification.campaignId);
      if (!hasAccess) {
        throw new UnauthorizedError('No access to this verification campaign');
      }

      // Auto-determine severity if not provided
      const severity = data.severity || this.determineSeverity(data.discrepancyType, data.description);

      // Generate unique discrepancy reference
      const reference = await this.generateDiscrepancyReference(verification.campaignId);

      // Create discrepancy
      const discrepancy = await this.db.verificationDiscrepancy.create({
        data: {
          verificationId: data.verificationId,
          discrepancyType: data.discrepancyType,
          description: data.description,
          severity,
          status: 'REPORTED',
          reportedBy: userId,
          expectedValue: data.expectedValue,
          actualValue: data.actualValue,
          financialImpact: data.financialImpact,
          actionRequired: data.actionRequired,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          assignedTo: data.assignedTo,
          tags: data.tags || [],
          attachments: [],
          priority: data.priority ?? 3,
        },
        include: {
          verification: {
            include: {
              asset: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  state: true,
                  lga: true,
                },
              },
            },
          },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Update verification status if this is the first discrepancy
      await this.updateVerificationForDiscrepancy(data.verificationId, severity);

      // Create audit log
      await this.createAuditLog(
        userId,
        'CREATE_DISCREPANCY',
        'VerificationDiscrepancy',
        discrepancy.id,
        null,
        discrepancy,
        ipAddress,
        userAgent
      );

      return discrepancy;
    } catch (error) {
      this.handleError(error, 'DiscrepancyService.createDiscrepancy');
    }
  }

  /**
   * Get paginated discrepancies
   */
  async getDiscrepancies(
    params: DiscrepancyQueryParams,
    userId: number
  ): Promise<PaginatedResponse<DiscrepancyWithDetails>> {
    try {
      // Check if user has permission to read discrepancies
      const hasPermission = await this.checkUserAccess(userId, 'discrepancy', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view discrepancies');
      }

      const { page = 1, limit = 20, ...filters } = params;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.VerificationDiscrepancyWhereInput = {
        ...(filters.campaignId && { verification: { campaignId: filters.campaignId } }),
        ...(filters.verificationId && { verificationId: filters.verificationId }),
        ...(filters.reportedBy && { reportedBy: filters.reportedBy }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
        ...(filters.type && { discrepancyType: { in: filters.type } }),
        ...(filters.severity && { severity: { in: filters.severity } }),
        ...(filters.status && { status: { in: filters.status } }),
        ...(filters.dueDateFrom && {
          dueDate: { gte: new Date(filters.dueDateFrom) },
        }),
        ...(filters.dueDateTo && {
          dueDate: { lte: new Date(filters.dueDateTo) },
        }),
      };

      // Apply user access restrictions
      const userAccessWhere = await this.buildUserAccessFilter(userId, 'discrepancy');
      const finalWhere = { ...where, ...userAccessWhere };

      const [discrepancies, total] = await Promise.all([
        this.db.verificationDiscrepancy.findMany({
          where: finalWhere,
          include: {
            verification: {
              include: {
                asset: {
                  include: {
                    category: true,
                    state: true,
                    lga: true,
                  },
                },
                campaign: true,
              },
            },
            reporter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            resolver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },

          },
          orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder) || [
            { severity: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        this.db.verificationDiscrepancy.count({ where: finalWhere }),
      ]);

      return this.createPaginatedResponse(discrepancies, total, page, limit);
    } catch (error) {
      this.handleError(error, 'DiscrepancyService.getDiscrepancies');
    }
  }

  /**
   * Get discrepancy by ID
   */
  async getDiscrepancyById(
    discrepancyId: number,
    userId: number
  ): Promise<DiscrepancyWithDetails> {
    try {
      // Check if user has permission to read discrepancies
      const hasPermission = await this.checkUserAccess(userId, 'discrepancy', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view discrepancy');
      }

      const discrepancy = await this.db.verificationDiscrepancy.findUnique({
        where: { id: discrepancyId },
        include: {
          verification: {
            include: {
              asset: {
                include: {
                  category: true,
                  state: true,
                  lga: true,
                },
              },
              campaign: true,
            },
          },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!discrepancy) {
        throw new NotFoundError('Discrepancy not found');
      }

      return discrepancy;
    } catch (error) {
      this.handleError(error, 'DiscrepancyService.getDiscrepancyById');
    }
  }

  /**
   * Update discrepancy
   */
  async updateDiscrepancy(
    discrepancyId: number,
    data: UpdateDiscrepancyRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DiscrepancyWithDetails> {
    try {
      // Check if user has permission to update discrepancies
      const hasPermission = await this.checkUserAccess(userId, 'discrepancy', 'update');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to update discrepancy');
      }

      // Get existing discrepancy
      const existingDiscrepancy = await this.db.verificationDiscrepancy.findUnique({
        where: { id: discrepancyId },
        include: { verification: { select: { campaignId: true } } },
      });

      if (!existingDiscrepancy) {
        throw new NotFoundError('Discrepancy not found');
      }

      // Validate status transitions
      if (data.status && !this.isValidStatusTransition(existingDiscrepancy.status, data.status)) {
        throw new ValidationError(`Invalid status transition from ${existingDiscrepancy.status} to ${data.status}`);
      }

      // Validate assignee if provided
      if (data.assignedTo) {
        await this.validateEntityExists('user', data.assignedTo, 'Assignee not found');

        // Check if assignee has access to the campaign
        const hasAccess = await this.checkCampaignAccess(
          data.assignedTo,
          existingDiscrepancy.verification.campaignId
        );
        if (!hasAccess) {
          throw new ValidationError('Assignee does not have access to this campaign');
        }
      }

      // Prepare update data
      const updateData: any = {
        ...(data.status && { status: data.status }),
        ...(data.resolutionNotes && { resolutionNotes: data.resolutionNotes }),
        ...(data.actionRequired && { actionRequired: data.actionRequired }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.tags && { tags: data.tags }),
        ...(data.financialImpact !== undefined && { financialImpact: data.financialImpact }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      };

      // Set resolution fields if status is being resolved
      if (data.status === 'RESOLVED') {
        updateData.resolvedBy = userId;
        updateData.resolutionDate = new Date();
      }

      // Update discrepancy
      const updatedDiscrepancy = await this.db.verificationDiscrepancy.update({
        where: { id: discrepancyId },
        data: updateData,
        include: {
          verification: {
            include: {
              asset: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  state: true,
                  lga: true,
                },
              },
              campaign: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          resolver: {
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
        'UPDATE_DISCREPANCY',
        'VerificationDiscrepancy',
        discrepancyId,
        existingDiscrepancy,
        updatedDiscrepancy,
        ipAddress,
        userAgent
      );

      return updatedDiscrepancy;
    } catch (error) {
      this.handleError(error, 'DiscrepancyService.updateDiscrepancy');
    }
  }

  /**
   * Assign discrepancy to user
   */
  async assignDiscrepancy(
    discrepancyId: number,
    assigneeId: number,
    userId: number,
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DiscrepancyWithDetails> {
    return this.updateDiscrepancy(
      discrepancyId,
      {
        assignedTo: assigneeId,
        status: 'INVESTIGATING',
        resolutionNotes: notes,
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  /**
   * Resolve discrepancy with optional asset updates
   */
  async resolveDiscrepancy(
    discrepancyId: number,
    resolutionNotes: string,
    userId: number,
    action?: string,
    actionData?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DiscrepancyWithDetails> {
    const discrepancy = await this.db.verificationDiscrepancy.findUnique({
      where: { id: discrepancyId },
      include: { verification: true }
    });

    if (!discrepancy) throw new NotFoundError('Discrepancy not found');

    // Perform side-effects based on action
    if (action) {
      const assetId = discrepancy.verification.assetId;

      if (action === 'UPDATE_ASSET_LOCATION') {
        const newStateId = actionData?.stateId ?? discrepancy.verification.actualStateId;
        const newLgaId = actionData?.lgaId ?? discrepancy.verification.actualLgaId;

        if (newStateId || newLgaId) {
          await this.db.asset.update({
            where: { id: assetId },
            data: {
              stateId: newStateId,
              lgaId: newLgaId
            }
          });
        }
      } else if (action === 'UPDATE_ASSET_STATUS' && actionData?.status) {
        await this.db.asset.update({
          where: { id: assetId },
          data: { status: actionData.status }
        });
      } else if (action === 'MARK_AS_DAMAGED') {
        await this.db.asset.update({
          where: { id: assetId },
          data: { status: 'MAINTENANCE' }
        });
      } else if (action === 'DISPOSE_ASSET') {
        await this.db.asset.update({
          where: { id: assetId },
          data: { status: 'DISPOSED' }
        });
      }
    }

    // Append action to notes for record keeping
    const finalNotes = action ? `${resolutionNotes} [Action Taken: ${action}]` : resolutionNotes;

    return this.updateDiscrepancy(
      discrepancyId,
      {
        status: 'RESOLVED',
        resolutionNotes: finalNotes,
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  /**
   * Close discrepancy
   */
  async closeDiscrepancy(
    discrepancyId: number,
    userId: number,
    closureNotes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<DiscrepancyWithDetails> {
    return this.updateDiscrepancy(
      discrepancyId,
      {
        status: 'CLOSED',
        resolutionNotes: closureNotes,
      },
      userId,
      ipAddress,
      userAgent
    );
  }

  /**
   * Get discrepancy statistics
   */
  async getDiscrepancyStats(
    campaignId: number,
    userId: number
  ): Promise<DiscrepancyStats> {
    try {
      // Check if user has permission to view analytics
      const hasPermission = await this.checkUserAccess(userId, 'analytics', 'view');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view statistics');
      }

      const statusStats = await this.db.verificationDiscrepancy.groupBy({
        by: ['status'],
        where: { verification: { campaignId } },
        _count: { status: true },
      });

      const typeStats = await this.db.verificationDiscrepancy.groupBy({
        by: ['discrepancyType'],
        where: { verification: { campaignId } },
        _count: { discrepancyType: true },
      });

      const severityStats = await this.db.verificationDiscrepancy.groupBy({
        by: ['severity'],
        where: { verification: { campaignId } },
        _count: { severity: true },
      });

      // Get resolution time statistics
      const resolvedDiscrepancies = await this.db.verificationDiscrepancy.findMany({
        where: {
          verification: { campaignId },
          status: 'RESOLVED',
        },
        select: {
          createdAt: true,
          resolutionDate: true,
        },
      });

      const resolutionTimes = resolvedDiscrepancies
        .filter(d => !!d.resolutionDate)
        .map(d => {
          const reported = new Date(d.createdAt!);
          const resolved = new Date(d.resolutionDate!);
          return Math.ceil((resolved.getTime() - reported.getTime()) / (1000 * 60 * 60)); // hours
        });

      const total = statusStats.reduce((sum, stat) => sum + stat._count.status, 0);
      const open = statusStats.find(s => s.status === 'REPORTED')?._count.status || 0;
      const inProgress = statusStats.find(s => s.status === 'INVESTIGATING')?._count.status || 0;
      const resolved = statusStats.find(s => s.status === 'RESOLVED')?._count.status || 0;
      const closed = statusStats.find(s => s.status === 'CLOSED')?._count.status || 0;

      return {
        total,
        open,
        inProgress,
        resolved,
        closed,
        critical: severityStats.find(s => s.severity === 'CRITICAL')?._count.severity || 0,
        high: severityStats.find(s => s.severity === 'HIGH')?._count.severity || 0,
        medium: severityStats.find(s => s.severity === 'MEDIUM')?._count.severity || 0,
        low: severityStats.find(s => s.severity === 'LOW')?._count.severity || 0,
        resolutionRate: total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0,
        averageResolutionTime: resolutionTimes.length > 0
          ? Math.round(resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length)
          : 0,
        typeBreakdown: typeStats.map(stat => ({
          type: stat.discrepancyType,
          count: stat._count.discrepancyType,
        })),
      };
    } catch (error) {
      this.handleError(error, 'DiscrepancyService.getDiscrepancyStats');
    }
  }

  /**
   * Generate discrepancy report
   */
  async generateDiscrepancyReport(
    campaignId: number,
    filters: {
      dateFrom?: string;
      dateTo?: string;
      severity?: DiscrepancySeverity[];
      status?: DiscrepancyStatus[];
      type?: DiscrepancyType[];
      assigneeId?: number;
    },
    userId: number
  ): Promise<DiscrepancyReport> {
    try {
      // Check if user has permission to generate reports
      const hasPermission = await this.checkUserAccess(userId, 'reports', 'generate');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to generate reports');
      }

      // Build where clause
      const where: Prisma.VerificationDiscrepancyWhereInput = {
        verification: { campaignId },
        ...(filters.dateFrom && {
          createdAt: { gte: new Date(filters.dateFrom) },
        }),
        ...(filters.dateTo && {
          createdAt: { lte: new Date(filters.dateTo) },
        }),
        ...(filters.severity?.length && { severity: { in: filters.severity } }),
        ...(filters.status?.length && { status: { in: filters.status } }),
        ...(filters.type?.length && { discrepancyType: { in: filters.type } }),
        ...(filters.assigneeId && { assignedTo: filters.assigneeId }),
      };

      const discrepancies = await this.db.verificationDiscrepancy.findMany({
        where,
        include: {
          verification: {
            include: {
              asset: {
                include: {
                  category: true,
                  state: true,
                  lga: true,
                },
              },
            },
          },
          reporter: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          resolver: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      // Generate summary statistics
      const summary = {
        totalDiscrepancies: discrepancies.length,
        byStatus: this.groupBy(discrepancies, 'status'),
        bySeverity: this.groupBy(discrepancies, 'severity'),
        byType: this.groupBy(discrepancies, 'discrepancyType'),
        byCategory: this.groupBy(
          discrepancies.map(d => ({ ...d, category: d.verification.asset.category?.name || 'Unknown' })),
          'category'
        ),
        byState: this.groupBy(
          discrepancies.map(d => ({ ...d, state: d.verification.asset.state?.name || 'Unknown' })),
          'state'
        ),
      };

      return {
        campaignId,
        filters,
        generatedAt: new Date(),
        generatedBy: userId,
        summary,
        discrepancies: discrepancies.map(d => ({
          reference: `DSC-${campaignId}-${d.id}`,
          assetTag: String(d.verification.asset.id),
          assetName: d.verification.asset.name,
          category: d.verification.asset.category?.name || 'Unknown',
          state: d.verification.asset.state?.name || 'Unknown',
          lga: d.verification.asset.lga?.name || 'Unknown',
          type: d.discrepancyType,
          severity: d.severity,
          status: d.status,
          title: `Discrepancy: ${d.discrepancyType}`,
          description: d.description,
          reportedAt: d.createdAt,
          reportedBy: `${d.reporter.firstName} ${d.reporter.lastName}`,
          assignedTo: d.assignee ? `${d.assignee.firstName} ${d.assignee.lastName}` : null,
          resolvedBy: d.resolver ? `${d.resolver.firstName} ${d.resolver.lastName}` : null,
          resolvedAt: d.resolutionDate,
          resolutionNotes: d.resolutionNotes,
        })),
      };
    } catch (error) {
      this.handleError(error, 'DiscrepancyService.generateDiscrepancyReport');
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async generateDiscrepancyReference(campaignId: number): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await this.db.verificationDiscrepancy.count({
      where: {
        verification: { campaignId },
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });

    return `DSC-${campaignId}-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  private determineSeverity(type: DiscrepancyType, description: string): DiscrepancySeverity {
    // Auto-determine severity based on type and keywords in description
    const criticalKeywords = ['missing', 'stolen', 'destroyed', 'critical', 'urgent', 'emergency'];
    const highKeywords = ['damaged', 'broken', 'incorrect', 'mismatch', 'wrong'];
    const descLower = description.toLowerCase();

    if (type === 'MISSING_ASSET' || criticalKeywords.some(keyword => descLower.includes(keyword))) {
      return 'CRITICAL';
    }

    if (type === 'LOCATION_MISMATCH' || type === 'CONDITION_DISCREPANCY' ||
      highKeywords.some(keyword => descLower.includes(keyword))) {
      return 'HIGH';
    }

    if (type === 'DATA_MISMATCH' || type === 'VALUE_DISCREPANCY' || type === 'CATEGORY_MISMATCH' ||
      type === 'QUANTITY_VARIANCE' || type === 'DUPLICATE_ASSET' || type === 'UNAUTHORIZED_ASSET' ||
      type === 'OBSOLETE_ASSET') {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private isValidStatusTransition(currentStatus: DiscrepancyStatus, newStatus: DiscrepancyStatus): boolean {
    const validTransitions: Record<DiscrepancyStatus, DiscrepancyStatus[]> = {
      REPORTED: ['ACKNOWLEDGED', 'INVESTIGATING', 'ESCALATED', 'CLOSED'],
      ACKNOWLEDGED: ['INVESTIGATING', 'RESOLVED', 'ESCALATED'],
      INVESTIGATING: ['PENDING_APPROVAL', 'RESOLVED', 'ESCALATED', 'CLOSED'],
      PENDING_APPROVAL: ['APPROVED', 'RESOLVED', 'ESCALATED'],
      APPROVED: ['RESOLVED', 'ESCALATED'],
      RESOLVED: ['CLOSED', 'INVESTIGATING'],
      CLOSED: [],
      ESCALATED: ['INVESTIGATING', 'APPROVED', 'RESOLVED', 'CLOSED'],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private async updateVerificationForDiscrepancy(
    verificationId: number,
    severity: DiscrepancySeverity
  ): Promise<void> {
    // If this is a critical discrepancy, flag the verification status
    if (severity === 'CRITICAL') {
      await this.db.assetVerification.update({
        where: { id: verificationId },
        data: {
          status: 'REQUIRES_REVIEW',
        },
      });
    } else {
      await this.db.assetVerification.update({
        where: { id: verificationId },
        data: {
          status: 'DISCREPANCY_FOUND',
        },
      });
    }
  }

  private async checkCampaignAccess(userId: number, campaignId: number): Promise<boolean> {
    const assignment = await this.db.verificationAssignment.findFirst({
      where: {
        userId,
        campaignId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    });

    return assignment !== null;
  }

  private groupBy<T extends Record<string, any>>(
    array: T[],
    key: keyof T
  ): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface DiscrepancyWithDetails extends VerificationDiscrepancy {
  verification: {
    asset: {
      id: number;
      name: string;
      description: string | null;
      category: any;
      state?: any;
      lga?: any;
    };
    campaign?: any;
  };
  reporter: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  assignee?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  resolver?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface DiscrepancyStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolutionRate: number;
  averageResolutionTime: number;
  typeBreakdown: Array<{
    type: DiscrepancyType;
    count: number;
  }>;
}

export interface DiscrepancyReport {
  campaignId: number;
  filters: any;
  generatedAt: Date;
  generatedBy: number;
  summary: {
    totalDiscrepancies: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byState: Record<string, number>;
  };
  discrepancies: Array<{
    reference: string;
    assetTag: string;
    assetName: string | null;
    category: string;
    state: string;
    lga: string;
    type: DiscrepancyType;
    severity: DiscrepancySeverity;
    status: DiscrepancyStatus;
    title: string;
    description: string;
    reportedAt: Date;
    reportedBy: string;
    assignedTo: string | null;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    resolutionNotes: string | null;
  }>;
}