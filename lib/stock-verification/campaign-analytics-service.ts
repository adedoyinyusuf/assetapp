import { prisma } from '@/lib/prisma';
// import { stockVerificationConfig } from '@/lib/config/stock-verification'; // Temporarily disabled
import { stockVerificationLogger } from './logging';
import { stockVerificationCache } from './performance';
import { 
  AssetVerificationStatus, 
  VerificationCampaignStatus,
  DiscrepancySeverity,
  AssignmentStatus
} from '@prisma/client';

/**
 * Campaign Analytics Service
 * Provides real-time campaign progress tracking, completion rates,
 * performance metrics, and comprehensive analytics
 */

export interface CampaignAnalytics {
  campaignId: number;
  basicMetrics: BasicCampaignMetrics;
  progressMetrics: ProgressMetrics;
  teamPerformance: TeamPerformanceMetrics[];
  qualityMetrics: QualityMetrics;
  timeMetrics: TimeMetrics;
  costMetrics: CostMetrics;
  geographicBreakdown: GeographicBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  trendData: TrendDataPoint[];
  alerts: AnalyticsAlert[];
  predictions: CampaignPredictions;
}

export interface BasicCampaignMetrics {
  totalAssets: number;
  assignedAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  missingAssets: number;
  damagedAssets: number;
  completionPercentage: number;
  assignmentPercentage: number;
}

export interface ProgressMetrics {
  dailyVerifications: DailyProgress[];
  weeklyProgress: WeeklyProgress[];
  milestones: Milestone[];
  velocity: VelocityMetrics;
  burndownChart: BurndownPoint[];
}

export interface DailyProgress {
  date: string;
  verified: number;
  assigned: number;
  target: number;
  cumulative: number;
}

export interface WeeklyProgress {
  week: string;
  startDate: Date;
  endDate: Date;
  verified: number;
  target: number;
  efficiency: number;
}

export interface VelocityMetrics {
  currentVelocity: number; // verifications per day
  averageVelocity: number;
  projectedCompletion: Date;
  velocityTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: Date;
  completionDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  progress: number;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
  actual: number;
}

export interface TeamPerformanceMetrics {
  userId: number;
  userName: string;
  role: string;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  averageTime: number;
  qualityScore: number;
  efficiency: number;
  productivityTrend: 'up' | 'down' | 'stable';
  lastActivity: Date;
}

export interface QualityMetrics {
  overallQualityScore: number;
  discrepancyRate: number;
  accuracyRate: number;
  discrepanciesByType: DiscrepancyBreakdown[];
  discrepanciesBySeverity: SeverityBreakdown[];
  qualityTrend: TrendDataPoint[];
}

export interface DiscrepancyBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export interface SeverityBreakdown {
  severity: DiscrepancySeverity;
  count: number;
  percentage: number;
}

export interface TimeMetrics {
  averageVerificationTime: number;
  totalTimeSpent: number;
  timeByCategory: CategoryTime[];
  timeByTeamMember: TeamMemberTime[];
  timeEfficiencyTrend: TrendDataPoint[];
}

export interface CategoryTime {
  categoryName: string;
  averageTime: number;
  totalVerifications: number;
}

export interface TeamMemberTime {
  userId: number;
  userName: string;
  averageTime: number;
  totalTime: number;
  efficiency: number;
}

export interface CostMetrics {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costPerVerification: number;
  projectedTotalCost: number;
  budgetUtilization: number;
  costByCategory: CategoryCost[];
  burnRate: number;
}

export interface CategoryCost {
  categoryName: string;
  allocated: number;
  spent: number;
  verifications: number;
}

export interface GeographicBreakdown {
  stateName: string;
  stateId: number;
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  completionRate: number;
  lgaBreakdown?: LgaBreakdown[];
}

export interface LgaBreakdown {
  lgaName: string;
  lgaId: number;
  totalAssets: number;
  verifiedAssets: number;
  completionRate: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  categoryId: number;
  totalAssets: number;
  verifiedAssets: number;
  averageValue: number;
  completionRate: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'progress' | 'quality' | 'team' | 'budget' | 'timeline';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledged: boolean;
  actionRequired: boolean;
  recommendedAction?: string;
}

export interface CampaignPredictions {
  estimatedCompletionDate: Date;
  confidenceInterval: {
    earliest: Date;
    latest: Date;
    confidence: number;
  };
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  probability: number;
  mitigation: string;
}

export interface Recommendation {
  type: 'resource' | 'process' | 'timeline' | 'quality';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: string;
}

export class CampaignAnalyticsService {
  /**
   * Get comprehensive campaign analytics
   */
  async getCampaignAnalytics(
    campaignId: number,
    userId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<CampaignAnalytics> {
    try {
      await stockVerificationLogger.info('Generating campaign analytics', {
        campaignId,
        userId,
        dateRange,
      });

      // Check cache first
      const cacheKey = `analytics:${campaignId}:${dateRange ? `${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}` : 'all'}`;
      if (false) {
        const cached = await stockVerificationCache.get<CampaignAnalytics>('analytics', cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Validate campaign exists
      const campaign = await prisma.verificationCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Generate all analytics components
      const [
        basicMetrics,
        progressMetrics,
        teamPerformance,
        qualityMetrics,
        timeMetrics,
        costMetrics,
        geographicBreakdown,
        categoryBreakdown,
        trendData,
        alerts,
        predictions
      ] = await Promise.all([
        this.getBasicMetrics(campaignId, dateRange),
        this.getProgressMetrics(campaignId, dateRange),
        this.getTeamPerformance(campaignId, dateRange),
        this.getQualityMetrics(campaignId, dateRange),
        this.getTimeMetrics(campaignId, dateRange),
        this.getCostMetrics(campaignId, campaign.budget ? Number(campaign.budget) : null, dateRange),
        this.getGeographicBreakdown(campaignId, dateRange),
        this.getCategoryBreakdown(campaignId, dateRange),
        this.getTrendData(campaignId, dateRange),
        this.generateAlerts(campaignId, dateRange),
        this.generatePredictions(campaignId, dateRange)
      ]);

      const analytics: CampaignAnalytics = {
        campaignId,
        basicMetrics,
        progressMetrics,
        teamPerformance,
        qualityMetrics,
        timeMetrics,
        costMetrics,
        geographicBreakdown,
        categoryBreakdown,
        trendData,
        alerts,
        predictions,
      };

      // Cache the result
      if (false) {
        await stockVerificationCache.set('analytics', cacheKey, analytics, {
          ttl: 300, // 5 minutes
          tags: [`campaign:${campaignId}`, 'analytics'],
        });
      }

      await stockVerificationLogger.info('Campaign analytics generated successfully', {
        campaignId,
        metricsCount: Object.keys(analytics).length,
      });

      return analytics;

    } catch (error) {
      await stockVerificationLogger.error('Failed to generate campaign analytics', error as Error, {
        campaignId,
        userId,
        dateRange,
      });
      throw error;
    }
  }

  /**
   * Get real-time progress update for dashboard
   */
  async getRealTimeProgress(campaignId: number): Promise<{
    basicMetrics: BasicCampaignMetrics;
    recentActivity: any[];
    activeUsers: number;
    todayStats: DailyProgress;
  }> {
    try {
      const [basicMetrics, recentActivity, activeUsers, todayStats] = await Promise.all([
        this.getBasicMetrics(campaignId),
        this.getRecentActivity(campaignId, 10),
        this.getActiveUsersCount(campaignId),
        this.getTodayProgress(campaignId)
      ]);

      return {
        basicMetrics,
        recentActivity,
        activeUsers,
        todayStats,
      };

    } catch (error) {
      await stockVerificationLogger.error('Failed to get real-time progress', error as Error, {
        campaignId,
      });
      throw error;
    }
  }

  /**
   * Export analytics data for reporting
   */
  async exportAnalytics(
    campaignId: number,
    format: 'json' | 'csv' | 'excel',
    userId: number
  ): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    try {
      const analytics = await this.getCampaignAnalytics(campaignId, userId);

      // Generate file based on format
      let fileName: string;
      let fileContent: any;

      switch (format) {
        case 'json':
          fileName = `campaign-${campaignId}-analytics.json`;
          fileContent = JSON.stringify(analytics, null, 2);
          break;
        case 'csv':
          fileName = `campaign-${campaignId}-analytics.csv`;
          fileContent = this.convertToCSV(analytics);
          break;
        case 'excel':
          fileName = `campaign-${campaignId}-analytics.xlsx`;
          fileContent = await this.convertToExcel(analytics);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Save file to storage (simplified - would use actual storage service)
      const downloadUrl = await this.saveExportFile(fileName, fileContent);

      await stockVerificationLogger.info('Analytics exported successfully', {
        campaignId,
        format,
        fileName,
        userId,
      });

      return {
        success: true,
        downloadUrl,
      };

    } catch (error) {
      await stockVerificationLogger.error('Failed to export analytics', error as Error, {
        campaignId,
        format,
        userId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async getBasicMetrics(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<BasicCampaignMetrics> {
    const whereClause: any = { campaignId };
    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const verificationStats = await prisma.assetVerification.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { _all: true },
    });

    const totalAssets = verificationStats.reduce((sum, stat) => sum + stat._count._all, 0);
    const verifiedAssets = verificationStats
      .filter(stat => ['VERIFIED', 'APPROVED'].includes(stat.status))
      .reduce((sum, stat) => sum + stat._count._all, 0);
    const pendingAssets = verificationStats
      .filter(stat => ['PENDING', 'IN_PROGRESS'].includes(stat.status))
      .reduce((sum, stat) => sum + stat._count._all, 0);
    const missingAssets = verificationStats
      .filter(stat => stat.status === 'MISSING')
      .reduce((sum, stat) => sum + stat._count._all, 0);
    const damagedAssets = verificationStats
      .filter(stat => stat.status === 'DAMAGED')
      .reduce((sum, stat) => sum + stat._count._all, 0);

    // Get campaign target count
    const campaign = await prisma.verificationCampaign.findUnique({
      where: { id: campaignId },
      select: { targetAssetCount: true },
    });

    const targetCount = campaign?.targetAssetCount || totalAssets;
    const assignedAssets = totalAssets;
    
    return {
      totalAssets: targetCount,
      assignedAssets,
      verifiedAssets,
      pendingAssets,
      missingAssets,
      damagedAssets,
      completionPercentage: targetCount > 0 ? Math.round((verifiedAssets / targetCount) * 100) : 0,
      assignmentPercentage: targetCount > 0 ? Math.round((assignedAssets / targetCount) * 100) : 0,
    };
  }

  private async getProgressMetrics(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<ProgressMetrics> {
    const dailyVerifications = await this.getDailyProgress(campaignId, dateRange);
    const weeklyProgress = await this.getWeeklyProgress(campaignId, dateRange);
    const velocity = await this.getVelocityMetrics(campaignId);
    const burndownChart = await this.getBurndownChart(campaignId);

    const milestones: Milestone[] = [
      {
        id: '25',
        name: '25% Complete',
        targetDate: new Date(),
        status: 'completed',
        progress: 100,
      },
      // Add more milestones based on campaign data
    ];

    return {
      dailyVerifications,
      weeklyProgress,
      milestones,
      velocity,
      burndownChart,
    };
  }

  private async getDailyProgress(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<DailyProgress[]> {
    // Get daily verification counts
    const dailyStats = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as verified,
        0 as assigned,
        0 as target,
        0 as cumulative
      FROM asset_verification 
      WHERE campaign_id = ${campaignId} 
        AND status IN ('VERIFIED', 'APPROVED')
        ${dateRange ? `AND created_at >= ${dateRange.startDate} AND created_at <= ${dateRange.endDate}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    let cumulative = 0;
    return dailyStats.map(stat => {
      cumulative += stat.verified;
      return {
        date: stat.date,
        verified: stat.verified,
        assigned: stat.assigned,
        target: stat.target, // Could be calculated based on campaign duration
        cumulative,
      };
    });
  }

  private async getWeeklyProgress(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<WeeklyProgress[]> {
    // Simplified weekly progress calculation
    const weeklyStats = await prisma.$queryRaw<any[]>`
      SELECT 
        YEAR(created_at) as year,
        WEEK(created_at) as week,
        MIN(DATE(created_at)) as start_date,
        MAX(DATE(created_at)) as end_date,
        COUNT(*) as verified
      FROM asset_verification 
      WHERE campaign_id = ${campaignId} 
        AND status IN ('VERIFIED', 'APPROVED')
        ${dateRange ? `AND created_at >= ${dateRange.startDate} AND created_at <= ${dateRange.endDate}` : ''}
      GROUP BY YEAR(created_at), WEEK(created_at)
      ORDER BY year, week
    `;

    return weeklyStats.map(stat => ({
      week: `${stat.year}-W${stat.week}`,
      startDate: new Date(stat.start_date),
      endDate: new Date(stat.end_date),
      verified: stat.verified,
      target: 100, // Would be calculated based on campaign schedule
      efficiency: Math.round((stat.verified / 100) * 100),
    }));
  }

  private async getVelocityMetrics(campaignId: number): Promise<VelocityMetrics> {
    // Get recent verification rate
    const last7Days = await prisma.assetVerification.count({
      where: {
        campaignId,
        status: { in: ['VERIFIED', 'APPROVED'] },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const currentVelocity = Math.round(last7Days / 7);
    
    // Get overall average
    const totalVerifications = await prisma.assetVerification.count({
      where: {
        campaignId,
        status: { in: ['VERIFIED', 'APPROVED'] },
      },
    });

    const campaign = await prisma.verificationCampaign.findUnique({
      where: { id: campaignId },
      select: { createdAt: true, endDate: true, targetAssetCount: true },
    });

    const daysSinceStart = Math.floor(
      (Date.now() - campaign!.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    const averageVelocity = daysSinceStart > 0 ? Math.round(totalVerifications / daysSinceStart) : 0;

    // Calculate projected completion
    const remaining = (campaign!.targetAssetCount || 0) - totalVerifications;
    const daysToComplete = currentVelocity > 0 ? Math.ceil(remaining / currentVelocity) : Infinity;
    const projectedCompletion = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);

    let velocityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (currentVelocity > averageVelocity * 1.1) velocityTrend = 'increasing';
    else if (currentVelocity < averageVelocity * 0.9) velocityTrend = 'decreasing';

    return {
      currentVelocity,
      averageVelocity,
      projectedCompletion,
      velocityTrend,
    };
  }

  private async getBurndownChart(campaignId: number): Promise<BurndownPoint[]> {
    // Simplified burndown chart - would need more sophisticated calculation
    const campaign = await prisma.verificationCampaign.findUnique({
      where: { id: campaignId },
      select: { targetAssetCount: true, startDate: true, endDate: true },
    });

    if (!campaign) return [];

    const totalDays = Math.floor(
      (campaign.endDate.getTime() - campaign.startDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    const dailyProgress = await this.getDailyProgress(campaignId);
    const points: BurndownPoint[] = [];

    let remaining = campaign.targetAssetCount || 0;
    const dailyIdealReduction = remaining / totalDays;

    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(campaign.startDate.getTime() + day * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayProgress = dailyProgress.find(p => p.date === dateStr);
      if (dayProgress) {
        remaining -= dayProgress.verified;
      }

      points.push({
        date: dateStr,
        remaining: Math.max(0, remaining),
        ideal: Math.max(0, (campaign.targetAssetCount || 0) - (day * dailyIdealReduction)),
        actual: Math.max(0, remaining),
      });
    }

    return points;
  }

  private async getTeamPerformance(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<TeamPerformanceMetrics[]> {
    const assignments = await prisma.verificationAssignment.findMany({
      where: { campaignId },
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

    const performance: TeamPerformanceMetrics[] = [];

    for (const assignment of assignments) {
      const whereClause: any = {
        campaignId,
        verifierId: assignment.userId,
      };

      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        };
      }

      const [assignedCount, completedCount, avgTime, lastActivity] = await Promise.all([
        prisma.assetVerification.count({
          where: { ...whereClause, status: { not: 'CANCELLED' } },
        }),
        prisma.assetVerification.count({
          where: { ...whereClause, status: { in: ['VERIFIED', 'APPROVED'] } },
        }),
        prisma.assetVerification.aggregate({
          where: { ...whereClause, verificationDuration: { not: null } },
          _avg: { verificationDuration: true },
        }),
        prisma.assetVerification.findFirst({
          where: { campaignId, verifierId: assignment.userId },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        }),
      ]);

      const pendingCount = assignedCount - completedCount;
      const averageTime = Math.round(avgTime._avg.verificationDuration || 0);
      const efficiency = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

      performance.push({
        userId: assignment.userId,
        userName: `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim(),
        role: assignment.role,
        assignedCount,
        completedCount,
        pendingCount,
        averageTime,
        qualityScore: 85, // Would calculate based on discrepancies
        efficiency,
        productivityTrend: 'stable', // Would calculate based on historical data
        lastActivity: lastActivity?.updatedAt || new Date(),
      });
    }

    return performance;
  }

  private async getQualityMetrics(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<QualityMetrics> {
    const whereClause: any = {
      verification: { campaignId },
    };

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const [discrepancies, totalVerifications] = await Promise.all([
      prisma.verificationDiscrepancy.findMany({
        where: whereClause,
        include: { verification: true },
      }),
      prisma.assetVerification.count({
        where: {
          campaignId,
          status: { in: ['VERIFIED', 'APPROVED'] },
          ...(dateRange ? { createdAt: whereClause.createdAt } : {}),
        },
      }),
    ]);

    const discrepancyRate = totalVerifications > 0 
      ? Math.round((discrepancies.length / totalVerifications) * 100)
      : 0;
    const accuracyRate = 100 - discrepancyRate;
    const overallQualityScore = Math.max(0, 100 - discrepancyRate * 2);

    // Group discrepancies by type and severity
    const discrepanciesByType: DiscrepancyBreakdown[] = [];
    const discrepanciesBySeverity: SeverityBreakdown[] = [];

    // Quality trend data (simplified)
    const qualityTrend: TrendDataPoint[] = [];

    return {
      overallQualityScore,
      discrepancyRate,
      accuracyRate,
      discrepanciesByType,
      discrepanciesBySeverity,
      qualityTrend,
    };
  }

  private async getTimeMetrics(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<TimeMetrics> {
    const whereClause: any = {
      campaignId,
      verificationDuration: { not: null },
    };

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    const timeStats = await prisma.assetVerification.aggregate({
      where: whereClause,
      _avg: { verificationDuration: true },
      _sum: { verificationDuration: true },
    });

    const averageVerificationTime = Math.round(timeStats._avg.verificationDuration || 0);
    const totalTimeSpent = timeStats._sum.verificationDuration || 0;

    return {
      averageVerificationTime,
      totalTimeSpent,
      timeByCategory: [], // Would calculate based on asset categories
      timeByTeamMember: [], // Would calculate based on team members
      timeEfficiencyTrend: [], // Would track over time
    };
  }

  private async getCostMetrics(
    campaignId: number,
    totalBudget: number | null,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<CostMetrics> {
    const budget = totalBudget || 0;
    const completedVerifications = await prisma.assetVerification.count({
      where: {
        campaignId,
        status: { in: ['VERIFIED', 'APPROVED'] },
        ...(dateRange ? {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          }
        } : {}),
      },
    });

    // Simplified cost calculation - would be more complex in real implementation
    const costPerVerification = completedVerifications > 0 ? budget * 0.7 / completedVerifications : 0;
    const spentAmount = completedVerifications * costPerVerification;
    const remainingBudget = Math.max(0, budget - spentAmount);
    const budgetUtilization = budget > 0 ? Math.round((spentAmount / budget) * 100) : 0;

    return {
      totalBudget: budget,
      spentAmount,
      remainingBudget,
      costPerVerification,
      projectedTotalCost: spentAmount * 1.2, // Add 20% buffer
      budgetUtilization,
      costByCategory: [],
      burnRate: spentAmount / Math.max(1, completedVerifications),
    };
  }

  private async getGeographicBreakdown(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<GeographicBreakdown[]> {
    // Get verifications grouped by state
    const stateStats = await prisma.$queryRaw<any[]>`
      SELECT 
        s.id as state_id,
        s.name as state_name,
        COUNT(av.id) as total_assets,
        SUM(CASE WHEN av.status IN ('VERIFIED', 'APPROVED') THEN 1 ELSE 0 END) as verified_assets,
        SUM(CASE WHEN av.status IN ('PENDING', 'IN_PROGRESS') THEN 1 ELSE 0 END) as pending_assets
      FROM asset_verification av
      JOIN asset a ON av.asset_id = a.id
      JOIN state s ON a.state_id = s.id
      WHERE av.campaign_id = ${campaignId}
        ${dateRange ? `AND av.created_at >= ${dateRange.startDate} AND av.created_at <= ${dateRange.endDate}` : ''}
      GROUP BY s.id, s.name
      ORDER BY s.name
    `;

    return stateStats.map(stat => ({
      stateName: stat.state_name,
      stateId: stat.state_id,
      totalAssets: stat.total_assets,
      verifiedAssets: stat.verified_assets,
      pendingAssets: stat.pending_assets,
      completionRate: stat.total_assets > 0 
        ? Math.round((stat.verified_assets / stat.total_assets) * 100)
        : 0,
      // lgaBreakdown would be calculated separately if needed
    }));
  }

  private async getCategoryBreakdown(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<CategoryBreakdown[]> {
    // Get verifications grouped by category
    const categoryStats = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(av.id) as total_assets,
        SUM(CASE WHEN av.status IN ('VERIFIED', 'APPROVED') THEN 1 ELSE 0 END) as verified_assets,
        AVG(COALESCE(a.current_value, 0)) as average_value
      FROM asset_verification av
      JOIN asset a ON av.asset_id = a.id
      LEFT JOIN category c ON a.category_id = c.id
      WHERE av.campaign_id = ${campaignId}
        ${dateRange ? `AND av.created_at >= ${dateRange.startDate} AND av.created_at <= ${dateRange.endDate}` : ''}
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;

    return categoryStats.map(stat => ({
      categoryName: stat.category_name || 'Uncategorized',
      categoryId: stat.category_id || 0,
      totalAssets: stat.total_assets,
      verifiedAssets: stat.verified_assets,
      averageValue: Math.round(stat.average_value || 0),
      completionRate: stat.total_assets > 0 
        ? Math.round((stat.verified_assets / stat.total_assets) * 100)
        : 0,
    }));
  }

  private async getTrendData(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<TrendDataPoint[]> {
    // Get daily verification trend
    const dailyStats = await this.getDailyProgress(campaignId, dateRange);
    
    return dailyStats.map(stat => ({
      date: stat.date,
      value: stat.cumulative,
      label: `${stat.verified} verifications`,
    }));
  }

  private async generateAlerts(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<AnalyticsAlert[]> {
    const alerts: AnalyticsAlert[] = [];

    // Check for various alert conditions
    const basicMetrics = await this.getBasicMetrics(campaignId, dateRange);
    const velocity = await this.getVelocityMetrics(campaignId);

    // Low progress alert
    if (basicMetrics.completionPercentage < 25) {
      alerts.push({
        id: `low-progress-${campaignId}`,
        type: 'warning',
        category: 'progress',
        title: 'Low Progress Alert',
        message: `Campaign completion is only ${basicMetrics.completionPercentage}%`,
        severity: 'medium',
        createdAt: new Date(),
        acknowledged: false,
        actionRequired: true,
        recommendedAction: 'Consider increasing team resources or adjusting timeline',
      });
    }

    // Slow velocity alert
    if (velocity.velocityTrend === 'decreasing') {
      alerts.push({
        id: `slow-velocity-${campaignId}`,
        type: 'warning',
        category: 'progress',
        title: 'Decreasing Velocity',
        message: 'Verification rate is decreasing over time',
        severity: 'medium',
        createdAt: new Date(),
        acknowledged: false,
        actionRequired: true,
        recommendedAction: 'Review team workload and remove blockers',
      });
    }

    return alerts;
  }

  private async generatePredictions(
    campaignId: number,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<CampaignPredictions> {
    const velocity = await this.getVelocityMetrics(campaignId);
    const basicMetrics = await this.getBasicMetrics(campaignId);

    const remaining = basicMetrics.totalAssets - basicMetrics.verifiedAssets;
    const daysToComplete = velocity.currentVelocity > 0 
      ? Math.ceil(remaining / velocity.currentVelocity)
      : Infinity;

    const estimatedCompletionDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);

    // Calculate confidence intervals (simplified)
    const confidenceRange = Math.ceil(daysToComplete * 0.2); // ±20%
    
    return {
      estimatedCompletionDate,
      confidenceInterval: {
        earliest: new Date(estimatedCompletionDate.getTime() - confidenceRange * 24 * 60 * 60 * 1000),
        latest: new Date(estimatedCompletionDate.getTime() + confidenceRange * 24 * 60 * 60 * 1000),
        confidence: 80,
      },
      riskFactors: [
        {
          factor: 'Resource Availability',
          impact: 'medium',
          probability: 0.3,
          mitigation: 'Ensure team members are available and not overallocated',
        },
      ],
      recommendations: [
        {
          type: 'resource',
          title: 'Team Optimization',
          description: 'Consider rebalancing workload among team members',
          priority: 'medium',
          estimatedImpact: 'Could improve completion time by 15%',
        },
      ],
    };
  }

  private async getRecentActivity(campaignId: number, limit: number = 10): Promise<any[]> {
    return await prisma.assetVerification.findMany({
      where: { campaignId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        asset: { select: { name: true } },
        verifier: { select: { firstName: true, lastName: true } },
      },
    });
  }

  private async getActiveUsersCount(campaignId: number): Promise<number> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return await prisma.assetVerification.findMany({
      where: {
        campaignId,
        updatedAt: { gte: last24Hours },
      },
      distinct: ['verifierId'],
    }).then(verifications => verifications.length);
  }

  private async getTodayProgress(campaignId: number): Promise<DailyProgress> {
    const today = new Date().toISOString().split('T')[0];
    const todayVerifications = await prisma.assetVerification.count({
      where: {
        campaignId,
        status: { in: ['VERIFIED', 'APPROVED'] },
        createdAt: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      date: today,
      verified: todayVerifications,
      assigned: 0, // Would calculate from today's assignments
      target: 0, // Would calculate from campaign schedule
      cumulative: 0, // Would calculate total to date
    };
  }

  private convertToCSV(analytics: CampaignAnalytics): string {
    // Simplified CSV conversion - would be more comprehensive
    const basicMetrics = analytics.basicMetrics;
    const csv = [
      'Metric,Value',
      `Total Assets,${basicMetrics.totalAssets}`,
      `Verified Assets,${basicMetrics.verifiedAssets}`,
      `Completion Percentage,${basicMetrics.completionPercentage}%`,
      // Add more metrics...
    ].join('\n');
    
    return csv;
  }

  private async convertToExcel(analytics: CampaignAnalytics): Promise<Buffer> {
    // Would use a library like xlsx to create Excel file
    // Simplified for now
    return Buffer.from(JSON.stringify(analytics));
  }

  private async saveExportFile(fileName: string, content: any): Promise<string> {
    // Simplified - would use actual storage service
    const filePath = `/tmp/${fileName}`;
    // Save file and return download URL
    return `${process.env.BASE_URL}/api/downloads/${fileName}`;
  }
}