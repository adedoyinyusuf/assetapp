import { BaseService, UnauthorizedError, NotFoundError } from './base-service';
import { CampaignService } from './campaign-service';
import { VerificationService } from './verification-service';
import { DiscrepancyService } from './discrepancy-service';
import { AssignmentService } from './assignment-service';

// =============================================================================
// COMPREHENSIVE REPORTING SERVICE CLASS
// =============================================================================

export class ReportingService extends BaseService {
  
  private campaignService: CampaignService;
  private verificationService: VerificationService;
  private discrepancyService: DiscrepancyService;
  private assignmentService: AssignmentService;

  constructor() {
    super();
    this.campaignService = new CampaignService();
    this.verificationService = new VerificationService();
    this.discrepancyService = new DiscrepancyService();
    this.assignmentService = new AssignmentService();
  }

  /**
   * Generate comprehensive campaign report
   */
  async generateCampaignReport(
    campaignId: number,
    options: {
      includeVerifications?: boolean;
      includeDiscrepancies?: boolean;
      includeTeamPerformance?: boolean;
      includeAssetDetails?: boolean;
      dateFrom?: string;
      dateTo?: string;
    },
    userId: number
  ): Promise<ComprehensiveCampaignReport> {
    try {
      // Check permissions
      const hasPermission = await this.checkUserAccess(userId, 'reports', 'generate');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to generate reports');
      }

      // Get campaign details
      const campaign = await this.campaignService.getCampaignById(campaignId, userId);
      
      // Initialize report structure
      const report: ComprehensiveCampaignReport = {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          createdAt: campaign.createdAt,
          completedAt: campaign.status === 'COMPLETED' ? campaign.endDate : null,
        },
        summary: {
          totalAssets: 0,
          totalVerifications: 0,
          completedVerifications: 0,
          totalDiscrepancies: 0,
          resolvedDiscrepancies: 0,
          teamMembers: 0,
          averageVerificationTime: 0,
          completionRate: 0,
          qualityScore: 0,
        },
        generatedAt: new Date(),
        generatedBy: userId,
        options,
      };

      // Get verification statistics
      const verificationStats = await this.verificationService.getVerificationStats(campaignId, userId);
      report.summary.totalVerifications = verificationStats.total;
      report.summary.completedVerifications = verificationStats.completed;
      report.summary.completionRate = verificationStats.completionRate;

      // Get discrepancy statistics
      const discrepancyStats = await this.discrepancyService.getDiscrepancyStats(campaignId, userId);
      report.summary.totalDiscrepancies = discrepancyStats.total;
      report.summary.resolvedDiscrepancies = discrepancyStats.resolved + discrepancyStats.closed;

      // Get team performance
      const teamPerformance = await this.assignmentService.getTeamPerformance(campaignId, userId);
      report.summary.teamMembers = teamPerformance.length;
      
      if (teamPerformance.length > 0) {
        report.summary.averageVerificationTime = Math.round(
          teamPerformance.reduce((sum, member) => sum + member.averageVerificationTime, 0) / 
          teamPerformance.length
        );
        report.summary.qualityScore = Math.round(
          teamPerformance.reduce((sum, member) => sum + member.qualityScore, 0) / 
          teamPerformance.length
        );
      }

      // Include optional sections
      if (options.includeVerifications) {
        report.verificationSummary = verificationStats;
      }

      if (options.includeDiscrepancies) {
        report.discrepancySummary = discrepancyStats;
      }

      if (options.includeTeamPerformance) {
        report.teamPerformance = teamPerformance;
      }

      if (options.includeAssetDetails) {
        report.assetBreakdown = await this.getAssetBreakdown(campaignId, userId);
      }

      return report;
    } catch (error) {
      this.handleError(error, 'ReportingService.generateCampaignReport');
    }
  }

  /**
   * Generate executive dashboard data
   */
  async generateExecutiveDashboard(
    filters: {
      dateFrom?: string;
      dateTo?: string;
      stateIds?: number[];
      categoryIds?: number[];
    },
    userId: number
  ): Promise<ExecutiveDashboard> {
    try {
      // Check permissions
      const hasPermission = await this.checkUserAccess(userId, 'analytics', 'view');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view executive dashboard');
      }

      // Build date filters
      const dateFilter: any = {};
      if (filters.dateFrom) {
        dateFilter.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        dateFilter.lte = new Date(filters.dateTo);
      }

      // Get campaign overview
      const campaigns = await this.db.verificationCampaign.findMany({
        where: {
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        include: {
          _count: {
            select: {
              verifications: true,
              assignments: true,
            },
          },
        },
      });

      // Calculate aggregated metrics
      // moved below after discrepancyStats declaration

      // Get verification completion stats
      const verificationStats = await this.db.assetVerification.groupBy({
        by: ['status'],
        where: {
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _count: { status: true },
      });

      const completedVerifications = verificationStats
        .filter(stat => ['VERIFIED', 'APPROVED'].includes(stat.status))
        .reduce((sum, stat) => sum + stat._count.status, 0);

      // Get discrepancy severity breakdown
      const discrepancyStats = await this.db.verificationDiscrepancy.groupBy({
        by: ['severity', 'status'],
        where: {
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _count: { id: true },
      });

      // Calculate aggregated metrics (after fetching discrepancyStats)
      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
      const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED').length;
      const totalVerifications = campaigns.reduce((sum, c) => sum + c._count.verifications, 0);
      const totalDiscrepancies = discrepancyStats.reduce((sum, s) => sum + s._count.id, 0);
      const totalAssignments = campaigns.reduce((sum, c) => sum + c._count.assignments, 0);

      // Get top performing states/categories
      const topStates = await this.getTopPerformingStates(filters, 5);
      const topCategories = await this.getTopPerformingCategories(filters, 5);

      return {
        overview: {
          totalCampaigns,
          activeCampaigns,
          completedCampaigns,
          totalVerifications,
          completedVerifications,
          totalDiscrepancies,
          totalAssignments,
          overallCompletionRate: totalVerifications > 0 
            ? Math.round((completedVerifications / totalVerifications) * 100) 
            : 0,
          criticalDiscrepancies: discrepancyStats
            .filter(stat => stat.severity === 'CRITICAL')
            .reduce((sum, stat) => sum + stat._count.id, 0),
        },
        campaignTrends: await this.getCampaignTrends(filters),
        verificationTrends: await this.getVerificationTrends(filters),
        discrepancyBreakdown: this.formatDiscrepancyBreakdown(discrepancyStats),
        topPerformers: {
          states: topStates,
          categories: topCategories,
        },
        generatedAt: new Date(),
        generatedBy: userId,
        filters,
      };
    } catch (error) {
      this.handleError(error, 'ReportingService.generateExecutiveDashboard');
    }
  }

  /**
   * Generate performance analytics report
   */
  async generatePerformanceReport(
    campaignId: number,
    userId: number
  ): Promise<PerformanceReport> {
    try {
      // Check permissions
      const hasPermission = await this.checkUserAccess(userId, 'analytics', 'view');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view performance analytics');
      }

      // Get campaign details
      const campaign = await this.campaignService.getCampaignById(campaignId, userId);
      
      // Get team performance metrics
      const teamPerformance = await this.assignmentService.getTeamPerformance(campaignId, userId);
      
      // Get verification analytics
      const verificationAnalytics = await this.getVerificationAnalytics(campaignId);
      
      // Get discrepancy patterns
      const discrepancyPatterns = await this.getDiscrepancyPatterns(campaignId);
      
      // Get productivity trends
      const productivityTrends = await this.getProductivityTrends(campaignId);

      return {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          duration: campaign.endDate && campaign.startDate 
            ? Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
        teamPerformance: {
          summary: {
            totalMembers: teamPerformance.length,
            averageEfficiency: Math.round(
              teamPerformance.reduce((sum, member) => sum + member.efficiency, 0) / 
              Math.max(teamPerformance.length, 1)
            ),
            averageQuality: Math.round(
              teamPerformance.reduce((sum, member) => sum + member.qualityScore, 0) / 
              Math.max(teamPerformance.length, 1)
            ),
            totalCompletedVerifications: teamPerformance.reduce((sum, member) => sum + member.completedVerifications, 0),
          },
          individual: teamPerformance,
        },
        verificationAnalytics,
        discrepancyPatterns,
        productivityTrends,
        recommendations: this.generateRecommendations(teamPerformance, discrepancyPatterns),
        generatedAt: new Date(),
        generatedBy: userId,
      };
    } catch (error) {
      this.handleError(error, 'ReportingService.generatePerformanceReport');
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async getAssetBreakdown(campaignId: number, userId: number): Promise<AssetBreakdown> {
    const breakdown = await this.db.asset.groupBy({
      by: ['categoryId', 'stateId'],
      where: {
        verifications: {
          some: { campaignId },
        },
      },
      _count: { id: true },
    });

    return {
      byCategory: await this.enrichWithNames(breakdown, 'categoryId', 'category'),
      byState: await this.enrichWithNames(breakdown, 'stateId', 'state'),
      total: breakdown.reduce((sum, item) => sum + item._count.id, 0),
    };
  }

  private async enrichWithNames(
    breakdown: any[],
    idField: string,
    tableName: string
  ): Promise<{ name: string; count: number }[]> {
    const grouped = breakdown.reduce((acc, item) => {
      const id = item[idField];
      acc[id] = (acc[id] || 0) + item._count.id;
      return acc;
    }, {} as Record<number, number>);

    const ids = Object.keys(grouped).map(id => parseInt(id)).filter(id => !isNaN(id));
    
    const entities = await (this.db as any)[tableName].findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    return entities.map((entity: any) => ({
      name: entity.name,
      count: grouped[entity.id] || 0,
    }));
  }

  private async getTopPerformingStates(filters: any, limit: number): Promise<TopPerformer[]> {
    const states = await this.db.state.findMany({
      include: {
        assets: {
          include: {
            verifications: {
              where: {
                status: { in: ['VERIFIED', 'APPROVED'] },
                ...(filters.dateFrom && { createdAt: { gte: new Date(filters.dateFrom) } }),
                ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
              },
            },
          },
        },
      },
      take: limit,
    });

    return states
      .map(state => ({
        name: state.name,
        completedVerifications: state.assets.reduce(
          (sum, asset) => sum + asset.verifications.length, 0
        ),
        totalAssets: state.assets.length,
      }))
      .sort((a, b) => b.completedVerifications - a.completedVerifications)
      .slice(0, limit);
  }

  private async getTopPerformingCategories(filters: any, limit: number): Promise<TopPerformer[]> {
    const categories = await this.db.category.findMany({
      include: {
        assets: {
          include: {
            verifications: {
              where: {
                status: { in: ['VERIFIED', 'APPROVED'] },
                ...(filters.dateFrom && { createdAt: { gte: new Date(filters.dateFrom) } }),
                ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
              },
            },
          },
        },
      },
      take: limit,
    });

    return categories
      .map(category => ({
        name: category.name,
        completedVerifications: category.assets.reduce(
          (sum, asset) => sum + asset.verifications.length, 0
        ),
        totalAssets: category.assets.length,
      }))
      .sort((a, b) => b.completedVerifications - a.completedVerifications)
      .slice(0, limit);
  }

  private async getCampaignTrends(filters: any): Promise<TrendData[]> {
    const campaigns = await this.db.verificationCampaign.findMany({
      where: {
        ...(filters.dateFrom && { createdAt: { gte: new Date(filters.dateFrom) } }),
        ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, status: true },
    });

    // Group by month
    const monthlyData = campaigns.reduce((acc, campaign) => {
      const month = campaign.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, active: 0, completed: 0 };
      }
      acc[month].total++;
      if (campaign.status === 'ACTIVE') acc[month].active++;
      if (campaign.status === 'COMPLETED') acc[month].completed++;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(monthlyData).map(([month, data]) => ({
      period: month,
      ...data,
    }));
  }

  private async getVerificationTrends(filters: any): Promise<TrendData[]> {
    const verifications = await this.db.assetVerification.findMany({
      where: {
        ...(filters.dateFrom && { createdAt: { gte: new Date(filters.dateFrom) } }),
        ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, status: true },
    });

    // Group by week
    const weeklyData = verifications.reduce((acc, verification) => {
      const week = this.getWeekKey(verification.createdAt);
      if (!acc[week]) {
        acc[week] = { total: 0, completed: 0, pending: 0 };
      }
      acc[week].total++;
      if (['VERIFIED', 'APPROVED'].includes(verification.status)) {
        acc[week].completed++;
      } else {
        acc[week].pending++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(weeklyData).map(([week, data]) => ({
      period: week,
      ...data,
    }));
  }

  private formatDiscrepancyBreakdown(stats: any[]): DiscrepancyBreakdown {
    return {
      bySeverity: stats.reduce((acc, stat) => {
        if (!acc[stat.severity]) acc[stat.severity] = 0;
        acc[stat.severity] += stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      byStatus: stats.reduce((acc, stat) => {
        if (!acc[stat.status]) acc[stat.status] = 0;
        acc[stat.status] += stat._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async getVerificationAnalytics(campaignId: number): Promise<VerificationAnalytics> {
    const verifications = await this.db.assetVerification.findMany({
      where: { campaignId },
      select: {
        status: true,
        verificationDuration: true,
        physicalCondition: true,
        createdAt: true,
      },
    });

    const avgDuration = verifications
      .filter(v => v.verificationDuration)
      .reduce((sum, v) => sum + (v.verificationDuration || 0), 0) / 
      Math.max(verifications.filter(v => v.verificationDuration).length, 1);

    return {
      totalVerifications: verifications.length,
      averageDuration: Math.round(avgDuration),
      conditionDistribution: this.groupBy(verifications.filter(v => v.physicalCondition), 'physicalCondition'),
      dailyProgress: await this.getDailyProgress(campaignId),
    };
  }

  private async getDiscrepancyPatterns(campaignId: number): Promise<DiscrepancyPatterns> {
    const discrepancies = await this.db.verificationDiscrepancy.findMany({
      where: { verification: { campaignId } },
      include: {
        verification: {
          include: {
            asset: {
              include: { category: true, state: true },
            },
          },
        },
      },
    });

    return {
      commonTypes: this.groupBy(discrepancies, 'discrepancyType'),
      byCategory: this.groupBy(
        discrepancies.map(d => ({ ...d, category: d.verification.asset.category?.name || 'Unknown' })),
        'category'
      ),
      byState: this.groupBy(
        discrepancies.map(d => ({ ...d, state: d.verification.asset.state?.name || 'Unknown' })),
        'state'
      ),
      resolutionTimes: await this.getAverageResolutionTimes(discrepancies),
    };
  }

  private async getProductivityTrends(campaignId: number): Promise<ProductivityTrend[]> {
    const verifications = await this.db.assetVerification.findMany({
      where: { campaignId },
      select: {
        createdAt: true,
        verifierId: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by week and verifier
    const weeklyData = verifications.reduce((acc, verification) => {
      const week = this.getWeekKey(verification.createdAt);
      if (!acc[week]) acc[week] = { total: 0, completed: 0, unique_verifiers: new Set() };
      
      acc[week].total++;
      acc[week].unique_verifiers.add(verification.verifierId);
      
      if (['VERIFIED', 'APPROVED'].includes(verification.status)) {
        acc[week].completed++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(weeklyData).map(([week, data]) => ({
      period: week,
      totalVerifications: data.total,
      completedVerifications: data.completed,
      activeVerifiers: data.unique_verifiers.size,
      averagePerVerifier: Math.round(data.total / data.unique_verifiers.size),
    }));
  }

  private generateRecommendations(
    teamPerformance: any[],
    discrepancyPatterns: DiscrepancyPatterns
  ): string[] {
    const recommendations: string[] = [];

    // Team performance recommendations
    const lowPerformers = teamPerformance.filter(member => member.efficiency < 50);
    if (lowPerformers.length > 0) {
      recommendations.push(
        `Consider additional training for ${lowPerformers.length} team member(s) with efficiency below 50%`
      );
    }

    const highErrorRate = teamPerformance.filter(member => member.qualityScore < 70);
    if (highErrorRate.length > 0) {
      recommendations.push(
        `Review quality control processes - ${highErrorRate.length} team member(s) have quality scores below 70%`
      );
    }

    // Discrepancy pattern recommendations
    const topDiscrepancyType = Object.entries(discrepancyPatterns.commonTypes)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (topDiscrepancyType && topDiscrepancyType[1] > 5) {
      recommendations.push(
        `Focus on ${topDiscrepancyType[0]} issues - this is the most common discrepancy type with ${topDiscrepancyType[1]} occurrences`
      );
    }

    return recommendations;
  }

  private async getDailyProgress(campaignId: number): Promise<{ date: string; completed: number }[]> {
    const verifications = await this.db.assetVerification.findMany({
      where: {
        campaignId,
        status: { in: ['VERIFIED', 'APPROVED'] },
      },
      select: { verificationDate: true },
      orderBy: { verificationDate: 'asc' },
    });

    const dailyData = verifications.reduce((acc, verification) => {
      if (!verification.verificationDate) return acc;
      
      const date = verification.verificationDate.toISOString().slice(0, 10);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyData).map(([date, completed]) => ({
      date,
      completed,
    }));
  }

  private getAverageResolutionTimes(discrepancies: any[]): Record<string, number> {
    const resolved = discrepancies.filter(d => d.resolutionDate && d.createdAt);

    return resolved.reduce((acc, discrepancy) => {
      const hours = Math.ceil(
        (new Date(discrepancy.resolutionDate!).getTime() - new Date(discrepancy.createdAt).getTime()) /
        (1000 * 60 * 60)
      );
      
      const type = discrepancy.discrepancyType as string;
      if (!acc[type]) acc[type] = { total: 0, count: 0 };
      acc[type].total += hours;
      acc[type].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
  }

  private getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().slice(0, 10);
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

export interface ComprehensiveCampaignReport {
  campaign: {
    id: number;
    name: string;
    description: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    completedAt: Date | null;
  };
  summary: {
    totalAssets: number;
    totalVerifications: number;
    completedVerifications: number;
    totalDiscrepancies: number;
    resolvedDiscrepancies: number;
    teamMembers: number;
    averageVerificationTime: number;
    completionRate: number;
    qualityScore: number;
  };
  verificationSummary?: any;
  discrepancySummary?: any;
  teamPerformance?: any[];
  assetBreakdown?: AssetBreakdown;
  generatedAt: Date;
  generatedBy: number;
  options: any;
}

export interface ExecutiveDashboard {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalVerifications: number;
    completedVerifications: number;
    totalDiscrepancies: number;
    totalAssignments: number;
    overallCompletionRate: number;
    criticalDiscrepancies: number;
  };
  campaignTrends: TrendData[];
  verificationTrends: TrendData[];
  discrepancyBreakdown: DiscrepancyBreakdown;
  topPerformers: {
    states: TopPerformer[];
    categories: TopPerformer[];
  };
  generatedAt: Date;
  generatedBy: number;
  filters: any;
}

export interface PerformanceReport {
  campaign: {
    id: number;
    name: string;
    status: string;
    duration: number | null;
  };
  teamPerformance: {
    summary: {
      totalMembers: number;
      averageEfficiency: number;
      averageQuality: number;
      totalCompletedVerifications: number;
    };
    individual: any[];
  };
  verificationAnalytics: VerificationAnalytics;
  discrepancyPatterns: DiscrepancyPatterns;
  productivityTrends: ProductivityTrend[];
  recommendations: string[];
  generatedAt: Date;
  generatedBy: number;
}

export interface AssetBreakdown {
  byCategory: { name: string; count: number }[];
  byState: { name: string; count: number }[];
  total: number;
}

export interface TrendData {
  period: string;
  [key: string]: any;
}

export interface DiscrepancyBreakdown {
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface TopPerformer {
  name: string;
  completedVerifications: number;
  totalAssets: number;
}

export interface VerificationAnalytics {
  totalVerifications: number;
  averageDuration: number;
  conditionDistribution: Record<string, number>;
  dailyProgress: { date: string; completed: number }[];
}

export interface DiscrepancyPatterns {
  commonTypes: Record<string, number>;
  byCategory: Record<string, number>;
  byState: Record<string, number>;
  resolutionTimes: Record<string, number>;
}

export interface ProductivityTrend {
  period: string;
  totalVerifications: number;
  completedVerifications: number;
  activeVerifiers: number;
  averagePerVerifier: number;
}