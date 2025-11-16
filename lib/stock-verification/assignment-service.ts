import { VerificationAssignment, AssignmentStatus, VerificationRole, Prisma } from '@prisma/client';
import { BaseService, PaginatedResponse, NotFoundError, UnauthorizedError, ValidationError } from './base-service';
import { CreateAssignmentRequest, UpdateAssignmentRequest } from './validation';

// =============================================================================
// TEAM ASSIGNMENT SERVICE CLASS
// =============================================================================

export class AssignmentService extends BaseService {

  /**
   * Create a new team assignment
   */
  async createAssignment(
    campaignId: number,
    data: CreateAssignmentRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerificationAssignmentWithUser> {
    try {
      // Check if user has permission to create assignments
      const hasPermission = await this.checkUserAccess(userId, 'assignment', 'create');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to create assignments');
      }

      // Validate campaign exists and is active
      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
        throw new ValidationError('Cannot assign users to completed or cancelled campaigns');
      }

      // Validate user exists and is active
      await this.validateEntityExists('user', data.userId, 'User not found');

      // Check if user is already assigned to this campaign
      const existingAssignment = await this.db.verificationAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId,
            userId: data.userId,
          },
        },
      });

      if (existingAssignment) {
        throw new ValidationError('User is already assigned to this campaign');
      }

      // Validate referenced entities
      await this.validateEntitiesExist('state', data.stateIds, 'One or more assigned states not found');
      
      if (data.lgaIds.length > 0) {
        await this.validateEntitiesExist('lga', data.lgaIds, 'One or more assigned LGAs not found');
      }
      
      if (data.categoryIds.length > 0) {
        await this.validateEntitiesExist('category', data.categoryIds, 'One or more assigned categories not found');
      }

      // Create the assignment
      const assignment = await this.db.verificationAssignment.create({
        data: {
          campaignId,
          userId: data.userId,
          role: data.role,
          stateIds: data.stateIds,
          lgaIds: data.lgaIds,
          categoryIds: data.categoryIds,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          dailyTarget: data.dailyTarget,
          totalTarget: data.totalTarget,
          instructions: data.instructions,
          permissions: data.permissions,
          reportingTo: data.reportingTo,
          mobileAccess: data.mobileAccess,
          offlineAccess: data.offlineAccess,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          supervisor: {
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
        'CREATE_ASSIGNMENT',
        'VerificationAssignment',
        assignment.id,
        null,
        assignment,
        ipAddress,
        userAgent
      );

      return assignment;
    } catch (error) {
      this.handleError(error, 'AssignmentService.createAssignment');
    }
  }

  /**
   * Get assignments for a campaign
   */
  async getAssignments(
    campaignId: number,
    userId: number
  ): Promise<VerificationAssignmentWithUser[]> {
    try {
      // Check if user has permission to read assignments
      const hasPermission = await this.checkUserAccess(userId, 'assignment', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view assignments');
      }

      // Validate campaign exists
      await this.validateEntityExists('verificationCampaign', campaignId, 'Campaign not found');

      const assignments = await this.db.verificationAssignment.findMany({
        where: { campaignId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          supervisor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return assignments;
    } catch (error) {
      this.handleError(error, 'AssignmentService.getAssignments');
    }
  }

  /**
   * Get a specific assignment by ID
   */
  async getAssignmentById(
    assignmentId: number,
    userId: number
  ): Promise<VerificationAssignmentWithUser> {
    try {
      // Check if user has permission to read assignments
      const hasPermission = await this.checkUserAccess(userId, 'assignment', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view assignment');
      }

      const assignment = await this.db.verificationAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          supervisor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
      });

      if (!assignment) {
        throw new NotFoundError('Assignment not found');
      }

      return assignment;
    } catch (error) {
      this.handleError(error, 'AssignmentService.getAssignmentById');
    }
  }

  /**
   * Update an assignment
   */
  async updateAssignment(
    assignmentId: number,
    data: UpdateAssignmentRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerificationAssignmentWithUser> {
    try {
      // Check if user has permission to update assignments
      const hasPermission = await this.checkUserAccess(userId, 'assignment', 'update');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to update assignments');
      }

      // Get existing assignment
      const existingAssignment = await this.db.verificationAssignment.findUnique({
        where: { id: assignmentId },
        include: { campaign: true },
      });

      if (!existingAssignment) {
        throw new NotFoundError('Assignment not found');
      }

      // Validate that assignment can be updated
      if (existingAssignment.campaign.status === 'COMPLETED' || 
          existingAssignment.campaign.status === 'CANCELLED') {
        throw new ValidationError('Cannot update assignments for completed or cancelled campaigns');
      }

      // Validate referenced entities if they're being updated
      if (data.stateIds) {
        await this.validateEntitiesExist('state', data.stateIds, 'One or more assigned states not found');
      }
      
      if (data.lgaIds && data.lgaIds.length > 0) {
        await this.validateEntitiesExist('lga', data.lgaIds, 'One or more assigned LGAs not found');
      }
      
      if (data.categoryIds && data.categoryIds.length > 0) {
        await this.validateEntitiesExist('category', data.categoryIds, 'One or more assigned categories not found');
      }

      // Update the assignment
      const updatedAssignment = await this.db.verificationAssignment.update({
        where: { id: assignmentId },
        data: {
          role: data.role,
          stateIds: data.stateIds,
          lgaIds: data.lgaIds,
          categoryIds: data.categoryIds,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          dailyTarget: data.dailyTarget,
          totalTarget: data.totalTarget,
          completedCount: data.completedCount,
          status: data.status,
          instructions: data.instructions,
          permissions: data.permissions,
          reportingTo: data.reportingTo,
          mobileAccess: data.mobileAccess,
          offlineAccess: data.offlineAccess,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          supervisor: {
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
        'UPDATE_ASSIGNMENT',
        'VerificationAssignment',
        assignmentId,
        existingAssignment,
        updatedAssignment,
        ipAddress,
        userAgent
      );

      return updatedAssignment;
    } catch (error) {
      this.handleError(error, 'AssignmentService.updateAssignment');
    }
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(
    assignmentId: number,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Check if user has permission to delete assignments
      const hasPermission = await this.checkUserAccess(userId, 'assignment', 'delete');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to delete assignments');
      }

      // Get existing assignment
      const existingAssignment = await this.db.verificationAssignment.findUnique({
        where: { id: assignmentId },
        include: { campaign: true },
      });

      if (!existingAssignment) {
        throw new NotFoundError('Assignment not found');
      }

      // Validate that assignment can be deleted
      if (existingAssignment.campaign.status === 'COMPLETED') {
        throw new ValidationError('Cannot delete assignments from completed campaigns');
      }

      // Check if user has any verifications in progress
      const activeVerifications = await this.db.assetVerification.count({
        where: {
          campaignId: existingAssignment.campaignId,
          verifierId: existingAssignment.userId,
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
      });

      if (activeVerifications > 0) {
        throw new ValidationError('Cannot delete assignment with active verifications');
      }

      // Delete the assignment
      await this.db.verificationAssignment.delete({
        where: { id: assignmentId },
      });

      // Create audit log
      await this.createAuditLog(
        userId,
        'DELETE_ASSIGNMENT',
        'VerificationAssignment',
        assignmentId,
        existingAssignment,
        null,
        ipAddress,
        userAgent
      );
    } catch (error) {
      this.handleError(error, 'AssignmentService.deleteAssignment');
    }
  }

  /**
   * Get user assignments (assignments for a specific user)
   */
  async getUserAssignments(
    targetUserId: number,
    userId: number
  ): Promise<UserAssignmentSummary[]> {
    try {
      // Check if user has permission to read assignments
      const hasPermission = await this.checkUserAccess(userId, 'assignment', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view assignments');
      }

      const assignments = await this.db.verificationAssignment.findMany({
        where: { userId: targetUserId },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return assignments.map(assignment => ({
        id: assignment.id,
        campaignId: assignment.campaignId,
        campaignName: assignment.campaign.name,
        campaignStatus: assignment.campaign.status,
        role: assignment.role,
        status: assignment.status,
        dailyTarget: assignment.dailyTarget,
        totalTarget: assignment.totalTarget,
        completedCount: assignment.completedCount,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        mobileAccess: assignment.mobileAccess,
        offlineAccess: assignment.offlineAccess,
      }));
    } catch (error) {
      this.handleError(error, 'AssignmentService.getUserAssignments');
    }
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformance(campaignId: number, userId: number): Promise<TeamPerformanceMetrics[]> {
    try {
      // Check if user has permission to view analytics
      const hasPermission = await this.checkUserAccess(userId, 'analytics', 'view');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view team performance');
      }

      // Get assignments with verification counts
      const assignments = await this.db.verificationAssignment.findMany({
        where: { campaignId },
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
      });

      // Calculate performance metrics for each team member
      const performanceMetrics = await Promise.all(
        assignments.map(async (assignment) => {
          const verifications = await this.db.assetVerification.findMany({
            where: {
              campaignId,
              verifierId: assignment.userId,
            },
            select: {
              status: true,
              verificationDuration: true,
              createdAt: true,
              discrepancies: {
                select: { id: true },
              },
            },
          });

          const completedCount = verifications.filter(v => 
            ['VERIFIED', 'APPROVED'].includes(v.status)
          ).length;

          const averageDuration = verifications
            .filter(v => v.verificationDuration)
            .reduce((sum, v) => sum + (v.verificationDuration || 0), 0) / 
            Math.max(verifications.length, 1);

          const discrepancyCount = verifications.reduce((sum, v) => 
            sum + v.discrepancies.length, 0
          );

          const qualityScore = verifications.length > 0 
            ? Math.max(0, 100 - ((discrepancyCount / verifications.length) * 20))
            : 0;

          const efficiency = assignment.totalTarget 
            ? Math.min(100, (completedCount / assignment.totalTarget) * 100)
            : 0;

          return {
            userId: assignment.userId,
            userName: `${assignment.user.firstName} ${assignment.user.lastName}`,
            role: assignment.role,
            totalAssigned: verifications.length,
            completedVerifications: completedCount,
            pendingVerifications: verifications.filter(v => 
              ['PENDING', 'IN_PROGRESS'].includes(v.status)
            ).length,
            discrepancyCount,
            averageVerificationTime: Math.round(averageDuration),
            qualityScore: Math.round(qualityScore),
            efficiency: Math.round(efficiency),
            dailyTarget: assignment.dailyTarget || 0,
            totalTarget: assignment.totalTarget || 0,
          };
        })
      );

      return performanceMetrics;
    } catch (error) {
      this.handleError(error, 'AssignmentService.getTeamPerformance');
    }
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface VerificationAssignmentWithUser extends VerificationAssignment {
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  supervisor?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  campaign?: {
    id: number;
    name: string;
    status: string;
  };
}

export interface UserAssignmentSummary {
  id: number;
  campaignId: number;
  campaignName: string;
  campaignStatus: string;
  role: VerificationRole;
  status: AssignmentStatus;
  dailyTarget: number | null;
  totalTarget: number | null;
  completedCount: number;
  startDate: Date | null;
  endDate: Date | null;
  mobileAccess: boolean;
  offlineAccess: boolean;
}

export interface TeamPerformanceMetrics {
  userId: number;
  userName: string;
  role: VerificationRole;
  totalAssigned: number;
  completedVerifications: number;
  pendingVerifications: number;
  discrepancyCount: number;
  averageVerificationTime: number;
  qualityScore: number;
  efficiency: number;
  dailyTarget: number;
  totalTarget: number;
}