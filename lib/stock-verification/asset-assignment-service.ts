import { prisma } from '@/lib/prisma';
// import { stockVerificationConfig } from '@/lib/config/stock-verification'; // Temporarily disabled
import { stockVerificationLogger } from './logging';
import { stockVerificationCache } from './performance';
import {
  AssetVerificationStatus,
  VerificationCampaignStatus,
  AssetStatus,
  Prisma
} from '@prisma/client';

/**
 * Asset Assignment System
 * Handles automatic assignment of assets to campaigns based on various criteria
 * including location, category, asset status, and business rules
 */

export interface AssignmentCriteria {
  campaignId: number;
  stateIds?: number[];
  lgaIds?: number[];
  categoryIds?: number[];
  assetStatusFilter?: AssetStatus[];
  maxAssets?: number;
  priorityRules?: PriorityRule[];
  excludeRecentlyVerified?: boolean;
  excludeRecentlyVerifiedDays?: number;
}

export interface PriorityRule {
  type: 'category' | 'value' | 'location' | 'age' | 'condition';
  field: string;
  weight: number;
  ascending: boolean;
}

export interface AssignmentResult {
  success: boolean;
  campaignId: number;
  assignedCount: number;
  skippedCount: number;
  totalEligible: number;
  assignedAssets: AssignedAsset[];
  errors?: string[];
  warnings?: string[];
}

export interface AssignedAsset {
  assetId: number;
  verificationId: number;
  assetName: string;
  category?: string;
  location?: string;
  assignedDate: Date;
  priority?: number;
}

export interface AssetEligibilityCheck {
  assetId: number;
  eligible: boolean;
  reason?: string;
  eligibilityScore?: number;
}

export interface BulkAssignmentRequest {
  campaignId: number;
  assignments: {
    verifierId: number;
    assetIds: number[];
    estimatedDuration?: number;
    priority?: number;
  }[];
  autoBalance?: boolean;
  workloadDistribution?: 'even' | 'capacity' | 'geographic' | 'expertise';
}

export class AssetAssignmentService {
  /**
   * Automatically assign assets to a campaign based on criteria
   */
  async assignAssetsToCampaign(
    criteria: AssignmentCriteria,
    userId: number
  ): Promise<AssignmentResult> {
    try {
      await stockVerificationLogger.info('Starting asset assignment', {
        campaignId: String(criteria.campaignId),
        userId: String(userId),
        metadata: { criteria },
      });

      // Validate campaign exists and is in valid state
      const campaign = await prisma.verificationCampaign.findUnique({
        where: { id: criteria.campaignId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED' || campaign.status === 'ARCHIVED') {
        throw new Error('Cannot assign assets to completed, cancelled, or archived campaigns');
      }

      // Get eligible assets based on criteria
      const conditions: Prisma.AssetWhereInput[] = [];

      if (criteria.stateIds && criteria.stateIds.length > 0) {
        conditions.push({ stateId: { in: criteria.stateIds } });
      }
      if (criteria.lgaIds && criteria.lgaIds.length > 0) {
        conditions.push({ lgaId: { in: criteria.lgaIds } });
      }
      if (criteria.categoryIds && criteria.categoryIds.length > 0) {
        conditions.push({ categoryId: { in: criteria.categoryIds } });
      }
      if (criteria.assetStatusFilter && criteria.assetStatusFilter.length > 0) {
        conditions.push({ status: { in: criteria.assetStatusFilter } });
      }

      // Exclude assets already in this campaign
      conditions.push({
        verifications: {
          none: {
            campaignId: criteria.campaignId
          }
        }
      });

      if (criteria.excludeRecentlyVerified) {
        conditions.push({
          verifications: {
            none: {
              createdAt: {
                gte: new Date(Date.now() - (criteria.excludeRecentlyVerifiedDays || 30) * 24 * 60 * 60 * 1000)
              }
            }
          }
        });
      }

      const where: Prisma.AssetWhereInput = {
        AND: conditions
      };

      const eligibleAssets = await prisma.asset.findMany({
        where,
        include: {
          category: true,
          state: true,
          lga: true,
          verifications: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          }
        },
        take: criteria.maxAssets || 100, // Default batch size
      });

      if (eligibleAssets.length === 0) {
        return {
          success: true,
          campaignId: criteria.campaignId,
          assignedCount: 0,
          skippedCount: 0,
          totalEligible: 0,
          assignedAssets: [],
          warnings: ['No eligible assets found for the specified criteria'],
        };
      }

      // Apply priority rules if specified
      const prioritizedAssets = (!criteria.priorityRules || criteria.priorityRules.length === 0)
        ? eligibleAssets
        : eligibleAssets.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          for (const rule of criteria.priorityRules!) {
            const getAssetFieldValue = (asset: any, field: string): any => {
              const fieldPath = field.split('.');
              let value = asset;
              for (const key of fieldPath) {
                value = value?.[key];
                if (value === undefined || value === null) return 0;
              }
              return value;
            };

            const valueA = getAssetFieldValue(a, rule.field);
            const valueB = getAssetFieldValue(b, rule.field);

            if (typeof valueA === 'number' && typeof valueB === 'number') {
              const comparison = rule.ascending ? valueA - valueB : valueB - valueA;
              scoreA += comparison * rule.weight;
            }
          }

          return scoreB - scoreA; // Higher scores first
        });

      // Limit assets if maxAssets is specified
      const assetsToAssign = criteria.maxAssets
        ? prioritizedAssets.slice(0, criteria.maxAssets)
        : prioritizedAssets;

      // Create asset verifications (inlined)
      const assignedAssets: AssignedAsset[] = [];
      const errors: string[] = [];
      let assignedCount = 0;
      let skippedCount = 0;

      for (const asset of assetsToAssign) {
        try {
          const verification = await prisma.assetVerification.create({
            data: {
              campaignId: criteria.campaignId,
              assetId: asset.id,
              verifierId: 1, // TODO: Implement proper verifier assignment
              status: 'PENDING',
              verificationDate: new Date(),
              locationAccurate: true,
              photoUrls: [],
            }
          });

          assignedAssets.push({
            assetId: asset.id,
            verificationId: verification.id,
            assetName: asset.name,
            category: asset.category?.name,
            location: `${asset.state.name}${asset.lga ? `, ${asset.lga.name}` : ''}`,
            assignedDate: new Date(),
          });

          assignedCount++;

        } catch (error) {
          errors.push(`Failed to assign asset ${asset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          skippedCount++;
        }
      }

      const assignmentResults = {
        assignedAssets,
        assignedCount,
        skippedCount,
        errors: errors.length > 0 ? errors : undefined,
        warnings: undefined,
      };

      // Update campaign statistics
      // Inline update of campaign statistics
      try {
        const stats = await prisma.assetVerification.groupBy({
          by: ['status'],
          where: { campaignId: criteria.campaignId },
          _count: { _all: true }
        });

        const totalVerifications = stats.reduce((sum, stat) => sum + stat._count._all, 0);
        const verifiedCount = stats
          .filter(stat => stat.status === 'VERIFIED')
          .reduce((sum, stat) => sum + stat._count._all, 0);

        const verificationProgress = totalVerifications > 0
          ? Math.round((verifiedCount / totalVerifications) * 100)
          : 0;

        await prisma.verificationCampaign.update({
          where: { id: criteria.campaignId },
          data: {
            actualAssetCount: totalVerifications,
            verificationProgress,
          }
        });
      } catch (error) {
        await stockVerificationLogger.error('Failed to update campaign statistics', error as Error, {
          campaignId: String(criteria.campaignId),
          userId: String(userId),
        });
      }

      // Clear relevant caches
      if (false) {
        await stockVerificationCache.invalidateByTag(`campaign:${criteria.campaignId}`);
        await stockVerificationCache.invalidateByTag('campaigns');
      }

      await stockVerificationLogger.info('Asset assignment completed', {
        campaignId: String(criteria.campaignId),
        metadata: {
          assignedCount: assignmentResults.assignedCount,
          totalEligible: eligibleAssets.length,
        },
      });

      return {
        success: true,
        campaignId: criteria.campaignId,
        assignedCount: assignmentResults.assignedCount,
        skippedCount: assignmentResults.skippedCount,
        totalEligible: eligibleAssets.length,
        assignedAssets: assignmentResults.assignedAssets,
        errors: assignmentResults.errors,
        warnings: assignmentResults.warnings,
      };

    } catch (error) {
      await stockVerificationLogger.error('Failed to assign assets to campaign', error as Error, {
        campaignId: String(criteria.campaignId),
        userId: String(userId),
        metadata: { criteria },
      });
      throw error;
    }
  }

  /**
   * Check asset eligibility for campaign assignment
   */
  async checkAssetEligibility(
    assetId: number,
    campaignId: number
  ): Promise<AssetEligibilityCheck> {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
          category: true,
          state: true,
          lga: true,
          verifications: {
            where: {
              // removed invalid status filter; include latest verifications regardless of status
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }
        }
      });

      if (!asset) {
        return {
          assetId,
          eligible: false,
          reason: 'Asset not found',
        };
      }

      const campaign = await prisma.verificationCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return {
          assetId,
          eligible: false,
          reason: 'Campaign not found',
        };
      }

      // Check if already assigned to this campaign
      const existingVerification = await prisma.assetVerification.findFirst({
        where: {
          campaignId,
          assetId
        }
      });

      if (existingVerification) {
        return {
          assetId,
          eligible: false,
          reason: 'Already assigned to this campaign',
        };
      }

      // Check campaign scope constraints
      const eligibilityChecks = [];

      // State constraint
      if (campaign.assignedStates.length > 0 && !campaign.assignedStates.includes(asset.stateId)) {
        return {
          assetId,
          eligible: false,
          reason: 'Asset state not included in campaign scope',
        };
      }

      // LGA constraint
      if (campaign.assignedLgas.length > 0 && asset.lgaId && !campaign.assignedLgas.includes(asset.lgaId)) {
        return {
          assetId,
          eligible: false,
          reason: 'Asset LGA not included in campaign scope',
        };
      }

      // Category constraint
      if (campaign.assignedCategories.length > 0 && asset.categoryId && !campaign.assignedCategories.includes(asset.categoryId)) {
        return {
          assetId,
          eligible: false,
          reason: 'Asset category not included in campaign scope',
        };
      }

      // Check if recently verified (if configured)
      const recentVerification = asset.verifications.find(v =>
        v.createdAt > new Date(Date.now() - (stockVerificationConfig.assignment.excludeRecentlyVerifiedDays * 24 * 60 * 60 * 1000))
      );

      if (recentVerification && stockVerificationConfig.assignment.excludeRecentlyVerified) {
        return {
          assetId,
          eligible: false,
          reason: `Recently verified on ${recentVerification.createdAt.toDateString()}`,
        };
      }

      // Calculate eligibility score
      let eligibilityScore = 100;

      // Reduce score based on recent verifications
      const recentVerificationCount = asset.verifications.filter(v =>
        v.createdAt > new Date(Date.now() - (90 * 24 * 60 * 60 * 1000))
      ).length;
      eligibilityScore -= (recentVerificationCount * 10);

      // Increase score for high-value assets
      if (asset.currentValue && asset.currentValue > 1000000) {
        eligibilityScore += 20;
      }

      // Increase score for assets without recent verifications
      const lastVerification = asset.verifications[0];
      if (!lastVerification) {
        eligibilityScore += 30;
      } else {
        const daysSinceLastVerification = Math.floor(
          (Date.now() - lastVerification.createdAt.getTime()) / (24 * 60 * 60 * 1000)
        );
        if (daysSinceLastVerification > 365) {
          eligibilityScore += 25;
        } else if (daysSinceLastVerification > 180) {
          eligibilityScore += 15;
        }
      }

      return {
        assetId,
        eligible: true,
        eligibilityScore: Math.max(0, Math.min(100, eligibilityScore)),
      };

    } catch (error) {
      await stockVerificationLogger.error('Failed to check asset eligibility', error as Error, {
        assetId: String(assetId),
        campaignId: String(campaignId),
      });

      return {
        assetId,
        eligible: false,
        reason: 'Error checking eligibility',
      };
    }
  }

  /**
   * Bulk assign assets to multiple verifiers
   */
  async bulkAssignAssets(
    request: BulkAssignmentRequest,
    userId: number
  ): Promise<AssignmentResult> {
    try {
      await stockVerificationLogger.info('Starting bulk asset assignment', {
        campaignId: String(request.campaignId),
        userId: String(userId),
        assignmentCount: request.assignments.length,
      });

      // Validate campaign
      // Inline campaign validation to avoid method resolution issues
      {
        const campaign = await prisma.verificationCampaign.findUnique({
          where: { id: request.campaignId }
        });
        if (!campaign) {
          throw new Error('Campaign not found');
        }
        if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED' || campaign.status === 'ARCHIVED') {
          throw new Error('Cannot assign assets to completed, cancelled, or archived campaigns');
        }
      }

      // Validate all verifiers exist and are assigned to campaign (inlined)
      {
        const assignments = await prisma.verificationAssignment.findMany({
          where: {
            campaignId: request.campaignId,
            userId: { in: request.assignments.map(a => a.verifierId) },
            status: 'ACTIVE'
          }
        });
        const assignedVerifierIds = assignments.map(a => a.userId);
        const unassignedVerifiers = request.assignments.map(a => a.verifierId).filter(id => !assignedVerifierIds.includes(id));
        if (unassignedVerifiers.length > 0) {
          throw new Error(`Verifiers not assigned to campaign: ${unassignedVerifiers.join(', ')}`);
        }
      }

      const results: AssignmentResult = {
        success: true,
        campaignId: request.campaignId,
        assignedCount: 0,
        skippedCount: 0,
        totalEligible: 0,
        assignedAssets: [],
        errors: [],
        warnings: [],
      };

      // Process each assignment batch
      for (const assignment of request.assignments) {
        try {
          // Check asset eligibility
          const eligibilityChecks = await Promise.all(
            assignment.assetIds.map(assetId => this.checkAssetEligibility(assetId, request.campaignId))
          );

          const eligibleAssetIds = eligibilityChecks
            .filter(check => check.eligible)
            .map(check => check.assetId);

          const ineligibleCount = assignment.assetIds.length - eligibleAssetIds.length;
          results.skippedCount += ineligibleCount;

          if (eligibleAssetIds.length === 0) {
            results.warnings?.push(`No eligible assets found for verifier ${assignment.verifierId}`);
            continue;
          }

          // Create verifications for eligible assets
          const verifications = await prisma.assetVerification.createMany({
            data: eligibleAssetIds.map(assetId => ({
              campaignId: request.campaignId,
              assetId,
              verifierId: assignment.verifierId,
              status: 'PENDING' as AssetVerificationStatus,
              verificationDate: new Date(),
              locationAccurate: true,
              photoUrls: [],
              estimatedDuration: assignment.estimatedDuration,
              priority: assignment.priority,
            })),
            skipDuplicates: true,
          });

          results.assignedCount += verifications.count;

          // Get asset details for response
          const assignedAssetDetails = await prisma.asset.findMany({
            where: { id: { in: eligibleAssetIds } },
            include: {
              category: true,
              state: true,
              lga: true,
            }
          });

          const assignedAssets = assignedAssetDetails.map(asset => ({
            assetId: asset.id,
            verificationId: 0, // Will be set by database
            assetName: asset.name,
            category: asset.category?.name,
            location: `${asset.state.name}${asset.lga ? `, ${asset.lga.name}` : ''}`,
            assignedDate: new Date(),
            priority: assignment.priority,
          }));

          results.assignedAssets.push(...assignedAssets);

        } catch (error) {
          results.errors?.push(`Failed to assign assets to verifier ${assignment.verifierId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      results.totalEligible = results.assignedCount + results.skippedCount;

      // Update campaign statistics (inlined)
      try {
        const stats = await prisma.assetVerification.groupBy({
          by: ['status'],
          where: { campaignId: request.campaignId },
          _count: { _all: true }
        });
        const totalVerifications = stats.reduce((sum, stat) => sum + stat._count._all, 0);
        const verifiedCount = stats
          .filter(stat => stat.status === 'VERIFIED')
          .reduce((sum, stat) => sum + stat._count._all, 0);
        const verificationProgress = totalVerifications > 0
          ? Math.round((verifiedCount / totalVerifications) * 100)
          : 0;
        await prisma.verificationCampaign.update({
          where: { id: request.campaignId },
          data: {
            actualAssetCount: totalVerifications,
            verificationProgress,
          }
        });
      } catch (error) {
        await stockVerificationLogger.error('Failed to update campaign statistics', error as Error, {
          campaignId: String(request.campaignId),
          userId: String(userId),
        });
      }

      // Clear relevant caches
      if (false) {
        await stockVerificationCache.invalidateByTag(`campaign:${request.campaignId}`);
      }

      await stockVerificationLogger.info('Bulk asset assignment completed', {
        campaignId: String(request.campaignId),
        assignedCount: results.assignedCount,
        skippedCount: results.skippedCount,
        errorCount: results.errors?.length || 0,
      });

      return results;

    } catch (error) {
      await stockVerificationLogger.error('Failed bulk asset assignment', error as Error, {
        campaignId: String(request.campaignId),
        userId: String(userId),
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  /**
   * Auto-balance workload among verifiers
   */
  async autoBalanceWorkload(
    campaignId: number,
    userId: number,
    strategy: 'even' | 'capacity' | 'geographic' = 'even'
  ): Promise<{ success: boolean; rebalanced: number; message: string }> {
    try {
      // Get campaign assignments
      const assignments = await prisma.verificationAssignment.findMany({
        where: { campaignId, status: 'ACTIVE' },
        include: {
          user: {
            include: {
              verifierVerifications: {
                where: {
                  campaignId,
                  status: { in: ['PENDING', 'IN_PROGRESS'] }
                },
                select: { id: true }
              }
            }
          }
        }
      });

      if (assignments.length === 0) {
        return {
          success: false,
          rebalanced: 0,
          message: 'No active assignments found for this campaign'
        };
      }

      // Get unassigned verifications
      const unassignedVerifications = await prisma.assetVerification.findMany({
        where: {
          campaignId,
          status: 'PENDING'
        },
        include: {
          asset: {
            include: {
              state: true,
              lga: true,
            }
          }
        }
      });

      if (unassignedVerifications.length === 0) {
        return {
          success: true,
          rebalanced: 0,
          message: 'No unassigned verifications to balance'
        };
      }

      let rebalancedCount = 0;

      switch (strategy) {
        case 'even': {
          const verifiersCount = assignments.length;
          const verificationsPerVerifier = Math.floor(unassignedVerifications.length / verifiersCount);
          const remainder = unassignedVerifications.length % verifiersCount;
          let assignedCount = 0;
          let verificationIndex = 0;
          for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];
            const countToAssign = verificationsPerVerifier + (i < remainder ? 1 : 0);
            const verificationsToAssign = unassignedVerifications.slice(verificationIndex, verificationIndex + countToAssign);
            if (verificationsToAssign.length > 0) {
              await prisma.assetVerification.updateMany({
                where: { id: { in: verificationsToAssign.map(v => v.id) } },
                data: { verifierId: assignment.userId }
              });
              assignedCount += verificationsToAssign.length;
            }
            verificationIndex += countToAssign;
          }
          rebalancedCount = assignedCount;
          break;
        }
        case 'capacity': {
          let mutableAssignments: any[] = assignments.map((a: any) => ({
            ...a,
            _workload: (a.user?.verifierVerifications?.length ?? 0)
          }));
          mutableAssignments.sort((a: any, b: any) => a._workload - b._workload);
          let assignedCount = 0;
          for (const verification of unassignedVerifications) {
            const assignment = mutableAssignments[0];
            await prisma.assetVerification.update({ where: { id: verification.id }, data: { verifierId: assignment.userId } });
            assignment._workload++;
            mutableAssignments.sort((a: any, b: any) => a._workload - b._workload);
            assignedCount++;
          }
          rebalancedCount = assignedCount;
          break;
        }
        case 'geographic': {
          let assignedCount = 0;
          const verificationsByState = unassignedVerifications.reduce((groups, verification) => {
            const stateId = verification.asset.stateId;
            if (!groups[stateId]) { groups[stateId] = []; }
            groups[stateId].push(verification);
            return groups;
          }, {} as Record<number, any[]>);
          for (const [stateId, stateVerifications] of Object.entries(verificationsByState)) {
            let verifierIndex = 0;
            for (const verification of stateVerifications as any[]) {
              const assignment = assignments[verifierIndex];
              await prisma.assetVerification.update({ where: { id: verification.id }, data: { verifierId: assignment.userId } });
              assignedCount++;
              verifierIndex = (verifierIndex + 1) % assignments.length;
            }
          }
          rebalancedCount = assignedCount;
          break;
        }
      }

      await stockVerificationLogger.info('Workload rebalanced', {
        campaignId,
        strategy,
        rebalancedCount,
        userId,
      });

      return {
        success: true,
        rebalanced: rebalancedCount,
        message: `Successfully rebalanced ${rebalancedCount} verifications using ${strategy} strategy`
      };

    } catch (error) {
      await stockVerificationLogger.error('Failed to auto-balance workload', error as Error, {
        campaignId,
        userId,
        strategy,
      });
      throw error;
    }
  }

  /**
   * Remove assets from campaign
   */
  async removeAssetsFromCampaign(
    campaignId: number,
    assetIds: number[],
    userId: number,
    reason: string = 'Manual removal'
  ): Promise<{ success: boolean; removedCount: number; message: string }> {
    try {
      // Validate campaign
      await this.validateCampaignForAssignment(campaignId);

      // Only remove verifications that are still pending
      const result = await prisma.assetVerification.updateMany({
        where: {
          campaignId,
          assetId: { in: assetIds },
          status: 'PENDING'
        },
        data: {
          status: AssetVerificationStatus.REJECTED,
          notes: `Cancelled by user ${userId} at ${new Date().toISOString()}. Reason: ${reason}`
        }
      });

      // Update campaign statistics (inlined)
      try {
        const stats = await prisma.assetVerification.groupBy({
          by: ['status'],
          where: { campaignId },
          _count: { _all: true }
        });
        const totalVerifications = stats.reduce((sum, stat) => sum + stat._count._all, 0);
        const verifiedCount = stats
          .filter(stat => stat.status === 'VERIFIED')
          .reduce((sum, stat) => sum + stat._count._all, 0);
        const verificationProgress = totalVerifications > 0
          ? Math.round((verifiedCount / totalVerifications) * 100)
          : 0;
        await prisma.verificationCampaign.update({
          where: { id: campaignId },
          data: {
            actualAssetCount: totalVerifications,
            verificationProgress,
          }
        });
      } catch (error) {
        await stockVerificationLogger.error('Failed to update campaign statistics', error as Error, {
          campaignId,
        });
      }

      await stockVerificationLogger.info('Assets removed from campaign', {
        campaignId,
        removedCount: result.count,
        userId,
        reason,
      });

      return {
        success: true,
        removedCount: result.count,
        message: `Successfully removed ${result.count} assets from campaign`
      };

    } catch (error) {
      await stockVerificationLogger.error('Failed to remove assets from campaign', error as Error, {
        campaignId,
        assetIds,
        userId,
      });
      throw error;
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async validateCampaignForAssignment(campaignId: number) {
    const campaign = await prisma.verificationCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED' || campaign.status === 'ARCHIVED') {
      throw new Error('Cannot assign assets to completed, cancelled, or archived campaigns');
    }

    return campaign;
  }

  private async getEligibleAssets(criteria: AssignmentCriteria) {
    const where: Prisma.AssetWhereInput = {
      AND: [
        // State filter
        criteria.stateIds && criteria.stateIds.length > 0
          ? { stateId: { in: criteria.stateIds } }
          : {},

        // LGA filter
        criteria.lgaIds && criteria.lgaIds.length > 0
          ? { lgaId: { in: criteria.lgaIds } }
          : {},

        // Category filter
        criteria.categoryIds && criteria.categoryIds.length > 0
          ? { categoryId: { in: criteria.categoryIds } }
          : {},

        // Asset status filter
        criteria.assetStatusFilter && criteria.assetStatusFilter.length > 0
          ? { status: { in: criteria.assetStatusFilter } }
          : {},

        // Exclude assets already in this campaign
        {
          verifications: {
            none: {
              campaignId: criteria.campaignId
            }
          }
        },

        // Exclude recently verified assets if specified
        criteria.excludeRecentlyVerified ? {
          verifications: {
            none: {
              createdAt: {
                gte: new Date(Date.now() - (criteria.excludeRecentlyVerifiedDays || 30) * 24 * 60 * 60 * 1000)
              }
            }
          }
        } : {},
      ].filter(condition => Object.keys(condition).length > 0)
    };

    return await prisma.asset.findMany({
      where,
      include: {
        category: true,
        state: true,
        lga: true,
        verifications: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        }
      },
      take: criteria.maxAssets || stockVerificationConfig.assignment.maxAssignmentBatchSize,
    });
  }

  private async prioritizeAssets(assets: any[], priorityRules?: PriorityRule[]) {
    if (!priorityRules || priorityRules.length === 0) {
      return assets;
    }

    return assets.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      for (const rule of priorityRules) {
        let valueA = this.getAssetFieldValue(a, rule.field);
        let valueB = this.getAssetFieldValue(b, rule.field);

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          const comparison = rule.ascending ? valueA - valueB : valueB - valueA;
          scoreA += comparison * rule.weight;
        }
      }

      return scoreB - scoreA; // Higher scores first
    });
  }

  private getAssetFieldValue(asset: any, field: string): any {
    const fieldPath = field.split('.');
    let value = asset;

    for (const key of fieldPath) {
      value = value?.[key];
      if (value === undefined || value === null) {
        return 0;
      }
    }

    return value;
  }

  private async createAssetVerifications(
    campaignId: number,
    assets: any[],
    userId: number
  ) {
    const assignedAssets: AssignedAsset[] = [];
    const errors: string[] = [];
    let assignedCount = 0;
    let skippedCount = 0;

    for (const asset of assets) {
      try {
        const verification = await prisma.assetVerification.create({
          data: {
            campaignId,
            assetId: asset.id,
            verifierId: 1, // TODO: Implement proper verifier assignment
            status: 'PENDING',
            verificationDate: new Date(),
            locationAccurate: true,
            photoUrls: [],
          }
        });

        assignedAssets.push({
          assetId: asset.id,
          verificationId: verification.id,
          assetName: asset.name,
          category: asset.category?.name,
          location: `${asset.state.name}${asset.lga ? `, ${asset.lga.name}` : ''}`,
          assignedDate: new Date(),
        });

        assignedCount++;

      } catch (error) {
        errors.push(`Failed to assign asset ${asset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        skippedCount++;
      }
    }

    return {
      assignedAssets,
      assignedCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      warnings: undefined,
    };
  }

  private async updateCampaignStatistics(campaignId: number) {
    try {
      const stats = await prisma.assetVerification.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: { _all: true }
      });

      const totalVerifications = stats.reduce((sum, stat) => sum + stat._count._all, 0);
      const verifiedCount = stats
        .filter(stat => stat.status === 'VERIFIED')
        .reduce((sum, stat) => sum + stat._count._all, 0);

      const verificationProgress = totalVerifications > 0
        ? Math.round((verifiedCount / totalVerifications) * 100)
        : 0;

      await prisma.verificationCampaign.update({
        where: { id: campaignId },
        data: {
          actualAssetCount: totalVerifications,
          verificationProgress,
        }
      });

    } catch (error) {
      await stockVerificationLogger.error('Failed to update campaign statistics', error as Error, {
        campaignId,
      });
    }
  }

  private async validateVerifiers(campaignId: number, verifierIds: number[]) {
    const assignments = await prisma.verificationAssignment.findMany({
      where: {
        campaignId,
        userId: { in: verifierIds },
        status: 'ACTIVE'
      }
    });

    const assignedVerifierIds = assignments.map(a => a.userId);
    const unassignedVerifiers = verifierIds.filter(id => !assignedVerifierIds.includes(id));

    if (unassignedVerifiers.length > 0) {
      throw new Error(`Verifiers not assigned to campaign: ${unassignedVerifiers.join(', ')}`);
    }
  }

  private async balanceEvenly(assignments: any[], verifications: any[]): Promise<number> {
    const verifiersCount = assignments.length;
    const verificationsPerVerifier = Math.floor(verifications.length / verifiersCount);
    const remainder = verifications.length % verifiersCount;

    let assignedCount = 0;
    let verificationIndex = 0;

    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      const countToAssign = verificationsPerVerifier + (i < remainder ? 1 : 0);

      const verificationsToAssign = verifications.slice(verificationIndex, verificationIndex + countToAssign);

      if (verificationsToAssign.length > 0) {
        await prisma.assetVerification.updateMany({
          where: {
            id: { in: verificationsToAssign.map(v => v.id) }
          },
          data: {
            verifierId: assignment.userId
          }
        });

        assignedCount += verificationsToAssign.length;
      }

      verificationIndex += countToAssign;
    }

    return assignedCount;
  }

  private async balanceByCapacity(assignments: any[], verifications: any[]): Promise<number> {
    // Initialize and sort assignments by current workload (ascending)
    assignments.forEach((a: any) => { a._workload = (a.user?.verifierVerifications?.length ?? 0); });
    assignments.sort((a: any, b: any) => a._workload - b._workload);

    let assignedCount = 0;

    for (const verification of verifications) {
      // Assign to verifier with least current workload
      const assignment = assignments[0];

      await prisma.assetVerification.update({
        where: { id: verification.id },
        data: { verifierId: assignment.userId }
      });

      // Update the count for proper sorting in next iteration
      assignment._workload++;

      // Re-sort to maintain order
      assignments.sort((a: any, b: any) => a._workload - b._workload);

      assignedCount++;
    }

    return assignedCount;
  }

  private async balanceGeographically(assignments: any[], verifications: any[]): Promise<number> {
    let assignedCount = 0;

    // Group verifications by state
    const verificationsByState = verifications.reduce((groups, verification) => {
      const stateId = verification.asset.stateId;
      if (!groups[stateId]) {
        groups[stateId] = [];
      }
      groups[stateId].push(verification);
      return groups;
    }, {} as Record<number, any[]>);

    // Assign verifications state by state, distributing evenly among verifiers
    for (const [stateId, stateVerifications] of Object.entries(verificationsByState)) {
      let verifierIndex = 0;

      for (const verification of stateVerifications as any[]) {
        const assignment = assignments[verifierIndex];

        await prisma.assetVerification.update({
          where: { id: verification.id },
          data: { verifierId: assignment.userId }
        });

        assignedCount++;
        verifierIndex = (verifierIndex + 1) % assignments.length;
      }
    }

    return assignedCount;
  }
}