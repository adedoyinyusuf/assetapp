import { prisma } from './db';

export interface AnalyticsData {
  assetMetrics: AssetMetrics;
  financialMetrics: FinancialMetrics;
  operationalMetrics: OperationalMetrics;
  trendAnalysis: TrendAnalysis;
  predictiveInsights: PredictiveInsights;
}

export interface AssetMetrics {
  totalAssets: number;
  activeAssets: number;
  retiredAssets: number;
  assetDistribution: {
    byCategory: Array<{ category: string; count: number; percentage: number }>;
    byLocation: Array<{ location: string; count: number; percentage: number }>;
    byAge: Array<{ ageRange: string; count: number; percentage: number }>;
  };
  assetUtilization: {
    underutilized: number;
    optimallyUtilized: number;
    overutilized: number;
  };
}

export interface FinancialMetrics {
  totalAssetValue: number;
  totalDepreciation: number;
  netBookValue: number;
  depreciationRate: number;
  assetTurnover: number;
  returnOnAssets: number;
  costPerAsset: number;
  valueByCategory: Array<{ category: string; value: number; percentage: number }>;
}

export interface OperationalMetrics {
  maintenanceFrequency: number;
  averageRepairTime: number;
  assetAvailability: number;
  movementFrequency: number;
  disposalRate: number;
  acquisitionRate: number;
}

export interface TrendAnalysis {
  assetGrowth: Array<{ month: string; count: number; value: number }>;
  depreciationTrends: Array<{ month: string; depreciation: number; value: number }>;
  maintenanceTrends: Array<{ month: string; incidents: number; cost: number }>;
  locationTrends: Array<{ month: string; location: string; count: number }>;
}

export interface PredictiveInsights {
  maintenancePredictions: Array<{ assetId: number; assetName: string; nextMaintenance: string; confidence: number }>;
  replacementRecommendations: Array<{ assetId: number; assetName: string; replacementDate: string; reason: string }>;
  budgetForecasts: Array<{ year: number; maintenanceBudget: number; replacementBudget: number; totalBudget: number }>;
  riskAssessment: Array<{ assetId: number; assetName: string; riskLevel: 'low' | 'medium' | 'high'; riskFactors: string[] }>;
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics data
   */
  static async getAnalyticsData(dateRange?: { start: Date; end: Date }): Promise<AnalyticsData> {
    const [assetMetrics, financialMetrics, operationalMetrics, trendAnalysis, predictiveInsights] = await Promise.all([
      this.getAssetMetrics(dateRange),
      this.getFinancialMetrics(dateRange),
      this.getOperationalMetrics(dateRange),
      this.getTrendAnalysis(dateRange),
      this.getPredictiveInsights(dateRange),
    ]);

    return {
      assetMetrics,
      financialMetrics,
      operationalMetrics,
      trendAnalysis,
      predictiveInsights,
    };
  }

  /**
   * Get asset-related metrics
   */
  static async getAssetMetrics(dateRange?: { start: Date; end: Date }): Promise<AssetMetrics> {
    const whereClause = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    } : {};

    const [totalAssets, activeAssets, retiredAssets] = await Promise.all([
      prisma.asset.count({ where: whereClause }),
      prisma.asset.count({ where: { ...whereClause, currentValue: { gt: 0 } } }),
      prisma.asset.count({ where: { ...whereClause, currentValue: { lte: 0 } } }),
    ]);

    // Asset distribution by category
    const categoryDistribution = await prisma.asset.groupBy({
      by: ['categoryId'],
      where: whereClause,
      _count: { id: true },
    });

    const categories = await prisma.category.findMany();
    const assetDistributionByCategory = categoryDistribution.map(item => {
      const category = categories.find(c => c.id === item.categoryId);
      return {
        category: category?.name || 'Unknown',
        count: item._count.id,
        percentage: (item._count.id / totalAssets) * 100,
      };
    });

    // Asset distribution by location
    const locationDistribution = await prisma.asset.groupBy({
      by: ['stateId'],
      where: whereClause,
      _count: { id: true },
    });

    const states = await prisma.state.findMany();
    const assetDistributionByLocation = locationDistribution.map(item => {
      const state = states.find(s => s.id === item.stateId);
      return {
        location: state?.name || 'Unknown',
        count: item._count.id,
        percentage: (item._count.id / totalAssets) * 100,
      };
    });

    // Asset age distribution
    const assets = await prisma.asset.findMany({
      where: whereClause,
      select: { purchaseDate: true },
    });

    const now = new Date();
    const ageRanges = [
      { range: '0-1 years', min: 0, max: 1 },
      { range: '1-3 years', min: 1, max: 3 },
      { range: '3-5 years', min: 3, max: 5 },
      { range: '5-10 years', min: 5, max: 10 },
      { range: '10+ years', min: 10, max: Infinity },
    ];

    const assetDistributionByAge = ageRanges.map(range => {
      const count = assets.filter(asset => {
        const age = (now.getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        return age >= range.min && age < range.max;
      }).length;

      return {
        ageRange: range.range,
        count,
        percentage: (count / totalAssets) * 100,
      };
    });

    return {
      totalAssets,
      activeAssets,
      retiredAssets,
      assetDistribution: {
        byCategory: assetDistributionByCategory,
        byLocation: assetDistributionByLocation,
        byAge: assetDistributionByAge,
      },
      assetUtilization: {
        underutilized: Math.floor(totalAssets * 0.2), // Placeholder calculation
        optimallyUtilized: Math.floor(totalAssets * 0.6),
        overutilized: Math.floor(totalAssets * 0.2),
      },
    };
  }

  /**
   * Get financial metrics
   */
  static async getFinancialMetrics(dateRange?: { start: Date; end: Date }): Promise<FinancialMetrics> {
    const whereClause = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    } : {};

    const assets = await prisma.asset.findMany({
      where: whereClause,
      select: {
        purchaseValue: true,
        currentValue: true,
        categoryId: true,
      },
    });

    const totalAssetValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
    const totalCurrentValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalDepreciation = totalAssetValue - totalCurrentValue;
    const depreciationRate = totalAssetValue > 0 ? (totalDepreciation / totalAssetValue) * 100 : 0;

    // Value by category
    const categories = await prisma.category.findMany();
    const valueByCategory = categories.map(category => {
      const categoryAssets = assets.filter(asset => asset.categoryId === category.id);
      const categoryValue = categoryAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
      
      return {
        category: category.name,
        value: categoryValue,
        percentage: totalAssetValue > 0 ? (categoryValue / totalAssetValue) * 100 : 0,
      };
    }).filter(item => item.value > 0);

    return {
      totalAssetValue,
      totalDepreciation,
      netBookValue: totalCurrentValue,
      depreciationRate,
      assetTurnover: 0, // Placeholder - would need business logic
      returnOnAssets: 0, // Placeholder - would need business logic
      costPerAsset: assets.length > 0 ? totalAssetValue / assets.length : 0,
      valueByCategory,
    };
  }

  /**
   * Get operational metrics
   */
  static async getOperationalMetrics(dateRange?: { start: Date; end: Date }): Promise<OperationalMetrics> {
    const whereClause = dateRange ? {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    } : {};

    const [movements, assetCount] = await Promise.all([
      prisma.assetMovement.count({ where: whereClause }),
      prisma.asset.count({ where: whereClause }),
    ]);

    return {
      maintenanceFrequency: 0, // Placeholder - would need maintenance table
      averageRepairTime: 0, // Placeholder - would need maintenance table
      assetAvailability: 95, // Placeholder - would need availability tracking
      movementFrequency: movements,
      disposalRate: 0, // Placeholder - would need disposal tracking
      acquisitionRate: assetCount, // New assets in period
    };
  }

  /**
   * Get trend analysis
   */
  static async getTrendAnalysis(_dateRange?: { start: Date; end: Date }): Promise<TrendAnalysis> {
    // Placeholder implementation - would need more complex date aggregation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    return {
      assetGrowth: months.map((month) => ({
        month,
        count: Math.floor(Math.random() * 100) + 50,
        value: Math.floor(Math.random() * 1000000) + 500000,
      })),
      depreciationTrends: months.map((month) => ({
        month,
        depreciation: Math.floor(Math.random() * 100000) + 50000,
        value: Math.floor(Math.random() * 1000000) + 500000,
      })),
      maintenanceTrends: months.map((month) => ({
        month,
        incidents: Math.floor(Math.random() * 20) + 5,
        cost: Math.floor(Math.random() * 50000) + 10000,
      })),
      locationTrends: months.map((month) => ({
        month,
        location: 'Lagos',
        count: Math.floor(Math.random() * 50) + 25,
      })),
    };
  }

  /**
   * Get predictive insights
   */
  static async getPredictiveInsights(_dateRange?: { start: Date; end: Date }): Promise<PredictiveInsights> {
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        purchaseDate: true,
        usefulLife: true,
        currentValue: true,
        purchaseValue: true,
      },
    });

    const now = new Date();
    const maintenancePredictions = assets.slice(0, 5).map(asset => {
      const age = (now.getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      const nextMaintenance = new Date(asset.purchaseDate);
      nextMaintenance.setFullYear(nextMaintenance.getFullYear() + Math.floor(age) + 1);
      
      return {
        assetId: asset.id,
        assetName: asset.name,
        nextMaintenance: nextMaintenance.toISOString().split('T')[0],
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      };
    });

    const replacementRecommendations = assets
      .filter(asset => {
        const age = (now.getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        return age > asset.usefulLife * 0.8; // Assets approaching end of useful life
      })
      .slice(0, 3)
      .map(asset => ({
        assetId: asset.id,
        assetName: asset.name,
        replacementDate: new Date(asset.purchaseDate.getTime() + asset.usefulLife * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'End of useful life',
      }));

    const budgetForecasts = [2024, 2025, 2026].map(year => ({
      year,
      maintenanceBudget: Math.floor(Math.random() * 500000) + 200000,
      replacementBudget: Math.floor(Math.random() * 1000000) + 500000,
      totalBudget: 0, // Will be calculated
    })).map(forecast => ({
      ...forecast,
      totalBudget: forecast.maintenanceBudget + forecast.replacementBudget,
    }));

    const riskAssessment = assets.slice(0, 5).map(asset => {
      const age = (now.getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      const depreciationRate = asset.purchaseValue > 0 ? (asset.purchaseValue - asset.currentValue) / asset.purchaseValue : 0;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const riskFactors: string[] = [];

      if (age > asset.usefulLife * 0.7) {
        riskLevel = 'high';
        riskFactors.push('Age approaching useful life');
      }
      if (depreciationRate > 0.8) {
        riskLevel = riskLevel === 'low' ? 'medium' : 'high';
        riskFactors.push('High depreciation');
      }
      if (asset.currentValue < asset.purchaseValue * 0.2) {
        riskLevel = riskLevel === 'low' ? 'medium' : 'high';
        riskFactors.push('Low current value');
      }

      return {
        assetId: asset.id,
        assetName: asset.name,
        riskLevel,
        riskFactors,
      };
    });

    return {
      maintenancePredictions,
      replacementRecommendations,
      budgetForecasts,
      riskAssessment,
    };
  }

  /**
   * Export analytics data
   */
  static async exportAnalyticsData(format: 'csv' | 'json' | 'pdf', dateRange?: { start: Date; end: Date }) {
    const data = await this.getAnalyticsData(dateRange);
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'pdf':
        return this.convertToPDF(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private static convertToCSV(data: AnalyticsData): string {
    // Implementation for CSV conversion
    const csvRows = [];
    
    // Asset Metrics
    csvRows.push(['Asset Metrics']);
    csvRows.push(['Total Assets', data.assetMetrics.totalAssets]);
    csvRows.push(['Active Assets', data.assetMetrics.activeAssets]);
    csvRows.push(['Retired Assets', data.assetMetrics.retiredAssets]);
    csvRows.push([]);
    
    // Financial Metrics
    csvRows.push(['Financial Metrics']);
    csvRows.push(['Total Asset Value', data.financialMetrics.totalAssetValue]);
    csvRows.push(['Total Depreciation', data.financialMetrics.totalDepreciation]);
    csvRows.push(['Net Book Value', data.financialMetrics.netBookValue]);
    
    return csvRows.map(row => row.join(',')).join('\n');
  }

  private static convertToPDF(_data: AnalyticsData): string {
    // Implementation for PDF conversion
    // This would typically use a library like jsPDF or puppeteer
    return 'PDF generation not implemented';
  }
}

export default AnalyticsService;
