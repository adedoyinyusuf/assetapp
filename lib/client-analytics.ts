// Client-safe analytics service - uses API calls instead of direct Prisma

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

export class ClientAnalyticsService {
  /**
   * Get comprehensive analytics data using API calls
   */
  static async getAnalyticsData(dateRange?: { start: Date; end: Date }): Promise<AnalyticsData> {
    try {
      const url = new URL('/api/analytics', window.location.origin);
      
      if (dateRange) {
        url.searchParams.set('startDate', dateRange.start.toISOString());
        url.searchParams.set('endDate', dateRange.end.toISOString());
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  static async exportData(data: AnalyticsData, format: 'csv' | 'json'): Promise<string> {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to export data: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  /**
   * Get mock analytics data for development/fallback
   */
  static getMockAnalyticsData(): AnalyticsData {
    return {
      assetMetrics: {
        totalAssets: 1250,
        activeAssets: 980,
        retiredAssets: 270,
        assetDistribution: {
          byCategory: [
            { category: 'Electronics', count: 45, percentage: 45 },
            { category: 'Furniture', count: 30, percentage: 30 },
            { category: 'Vehicles', count: 15, percentage: 15 },
            { category: 'Other', count: 10, percentage: 10 },
          ],
          byLocation: [
            { location: 'Lagos', count: 60, percentage: 60 },
            { location: 'Abuja', count: 25, percentage: 25 },
            { location: 'Port Harcourt', count: 10, percentage: 10 },
            { location: 'Other', count: 5, percentage: 5 },
          ],
          byAge: [
            { ageRange: '0-1 years', count: 200, percentage: 16 },
            { ageRange: '1-3 years', count: 400, percentage: 32 },
            { ageRange: '3-5 years', count: 350, percentage: 28 },
            { ageRange: '5-10 years', count: 250, percentage: 20 },
            { ageRange: '10+ years', count: 50, percentage: 4 },
          ],
        },
        assetUtilization: {
          underutilized: 250,
          optimallyUtilized: 750,
          overutilized: 250,
        },
      },
      financialMetrics: {
        totalAssetValue: 12500000,
        totalDepreciation: 2500000,
        netBookValue: 10000000,
        depreciationRate: 20,
        assetTurnover: 1.5,
        returnOnAssets: 12.5,
        costPerAsset: 10000,
        valueByCategory: [
          { category: 'Electronics', value: 5625000, percentage: 45 },
          { category: 'Furniture', value: 3750000, percentage: 30 },
          { category: 'Vehicles', value: 1875000, percentage: 15 },
          { category: 'Other', value: 1250000, percentage: 10 },
        ],
      },
      operationalMetrics: {
        maintenanceFrequency: 25,
        averageRepairTime: 3.5,
        assetAvailability: 95,
        movementFrequency: 150,
        disposalRate: 5,
        acquisitionRate: 45,
      },
      trendAnalysis: {
        assetGrowth: [
          { month: 'Jan', count: 1200, value: 12000000 },
          { month: 'Feb', count: 1210, value: 12100000 },
          { month: 'Mar', count: 1225, value: 12250000 },
          { month: 'Apr', count: 1240, value: 12400000 },
          { month: 'May', count: 1250, value: 12500000 },
          { month: 'Jun', count: 1250, value: 12500000 },
        ],
        depreciationTrends: [
          { month: 'Jan', depreciation: 2400000, value: 9600000 },
          { month: 'Feb', depreciation: 2420000, value: 9680000 },
          { month: 'Mar', depreciation: 2450000, value: 9800000 },
          { month: 'Apr', depreciation: 2480000, value: 9920000 },
          { month: 'May', depreciation: 2500000, value: 10000000 },
          { month: 'Jun', depreciation: 2500000, value: 10000000 },
        ],
        maintenanceTrends: [
          { month: 'Jan', incidents: 15, cost: 25000 },
          { month: 'Feb', incidents: 18, cost: 30000 },
          { month: 'Mar', incidents: 22, cost: 35000 },
          { month: 'Apr', incidents: 20, cost: 32000 },
          { month: 'May', incidents: 25, cost: 40000 },
          { month: 'Jun', incidents: 23, cost: 38000 },
        ],
        locationTrends: [
          { month: 'Jan', location: 'Lagos', count: 720 },
          { month: 'Feb', location: 'Lagos', count: 726 },
          { month: 'Mar', location: 'Lagos', count: 735 },
          { month: 'Apr', location: 'Lagos', count: 744 },
          { month: 'May', location: 'Lagos', count: 750 },
          { month: 'Jun', location: 'Lagos', count: 750 },
        ],
      },
      predictiveInsights: {
        maintenancePredictions: [
          { assetId: 1, assetName: 'Laptop Dell XPS', nextMaintenance: '2024-12-15', confidence: 85 },
          { assetId: 2, assetName: 'Projector Epson', nextMaintenance: '2024-11-20', confidence: 78 },
          { assetId: 3, assetName: 'Office Chair', nextMaintenance: '2025-01-10', confidence: 92 },
        ],
        replacementRecommendations: [
          { assetId: 4, assetName: 'Old Server', replacementDate: '2024-12-01', reason: 'End of useful life' },
          { assetId: 5, assetName: 'Printer HP', replacementDate: '2025-02-15', reason: 'High maintenance costs' },
        ],
        budgetForecasts: [
          { year: 2024, maintenanceBudget: 500000, replacementBudget: 1500000, totalBudget: 2000000 },
          { year: 2025, maintenanceBudget: 600000, replacementBudget: 1800000, totalBudget: 2400000 },
          { year: 2026, maintenanceBudget: 700000, replacementBudget: 2000000, totalBudget: 2700000 },
        ],
        riskAssessment: [
          { assetId: 6, assetName: 'Generator', riskLevel: 'high' as const, riskFactors: ['Age approaching useful life', 'High maintenance costs'] },
          { assetId: 7, assetName: 'Vehicle Fleet', riskLevel: 'medium' as const, riskFactors: ['High depreciation'] },
          { assetId: 8, assetName: 'Office Equipment', riskLevel: 'low' as const, riskFactors: [] },
        ],
      },
    };
  }
}
