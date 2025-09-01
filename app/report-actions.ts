import { prisma } from '@/lib/db';

interface Asset {
  id: string;
  name: string;
  purchaseValue: number;
  purchaseDate: string;
  usefulLife: number;
  salvageValue: number;
  category: string;
  state: string;
  lga: string;
  currentValue: number;
  totalDepreciation: number;
  depreciationPercentage: number;
  yearsElapsed: number;
}

interface PrismaAsset {
  id: number;
  name: string;
  purchaseValue: number;
  purchaseDate: Date;
  usefulLife: number;
  salvageValue: number;
  currentValue: number;
  category: {
    name: string;
  };
  lga: {
    name: string;
    state: {
      name: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportData {
  assets: Asset[];
  summary: {
    totalAssets: number;
    totalValue: number;
    totalDepreciation: number;
  };
  depreciationSummary: {
    totalDepreciation: number;
    averageDepreciation: number;
    mostDepreciated: Array<{
      id: string;
      name: string;
      depreciation: number;
    }>;
  };
  stateBreakdown: Array<{
    state: string;
    count: number;
    totalValue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalValue: number;
  }>;
}


export async function generateAssetReport(): Promise<ReportData> {
  try {
    // 1. Get all assets with their details
    const assets = await prisma.asset.findMany({
      include: {
        category: {
          select: { name: true }
        },
        lga: {
          include: {
            state: {
              select: { name: true }
            }
          }
        }
      }
    }) as unknown as PrismaAsset[];

    // 2. Calculate current values and depreciation
    const now = new Date();
    const processedAssets = assets.map(asset => {
      const purchaseDate = new Date(asset.purchaseDate);
      const yearsElapsed = (now.getFullYear() - purchaseDate.getFullYear()) + 
                         (now.getMonth() - purchaseDate.getMonth()) / 12;
      
      const annualDepreciation = (asset.purchaseValue - asset.salvageValue) / asset.usefulLife;
      const totalDepreciation = Math.min(
        yearsElapsed * annualDepreciation,
        asset.purchaseValue - asset.salvageValue
      );
      const currentValue = Math.max(
        asset.purchaseValue - totalDepreciation,
        asset.salvageValue
      );
      const depreciationPercentage = (totalDepreciation / asset.purchaseValue) * 100;

      return {
        id: String(asset.id),
        name: asset.name,
        purchaseValue: asset.purchaseValue,
        purchaseDate: asset.purchaseDate.toISOString(),
        usefulLife: asset.usefulLife,
        salvageValue: asset.salvageValue,
        category: asset.category.name,
        state: asset.lga.state.name,
        lga: asset.lga.name,
        currentValue,
        totalDepreciation,
        depreciationPercentage,
        yearsElapsed: Math.min(yearsElapsed, asset.usefulLife)
      };
    });

    // 3. Calculate summary
    const totalValue = processedAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
    const totalDepreciation = processedAssets.reduce(
      (sum, asset) => sum + asset.totalDepreciation, 0
    );

    // 4. Group by state
    const stateBreakdown = Object.values(
      processedAssets.reduce((acc, asset) => {
        if (!acc[asset.state]) {
          acc[asset.state] = { state: asset.state, count: 0, totalValue: 0 };
        }
        acc[asset.state].count += 1;
        acc[asset.state].totalValue += asset.purchaseValue;
        return acc;
      }, {} as Record<string, { state: string; count: number; totalValue: number }>)
    );

    // 5. Group by category
    const categoryBreakdown = Object.values(
      processedAssets.reduce((acc, asset) => {
        if (!acc[asset.category]) {
          acc[asset.category] = { category: asset.category, count: 0, totalValue: 0 };
        }
        acc[asset.category].count += 1;
        acc[asset.category].totalValue += asset.purchaseValue;
        return acc;
      }, {} as Record<string, { category: string; count: number; totalValue: number }>)
    );

    // 6. Get most depreciated assets
    const mostDepreciated = [...processedAssets]
      .sort((a, b) => b.depreciationPercentage - a.depreciationPercentage)
      .slice(0, 5)
      .map(asset => ({
        id: asset.id,
        name: asset.name,
        depreciation: asset.depreciationPercentage
      }));

    return {
      assets: processedAssets,
      summary: {
        totalAssets: processedAssets.length,
        totalValue,
        totalDepreciation
      },
      depreciationSummary: {
        totalDepreciation,
        averageDepreciation: processedAssets.length > 0 
          ? processedAssets.reduce((sum, a) => sum + a.depreciationPercentage, 0) / processedAssets.length
          : 0,
        mostDepreciated
      },
      stateBreakdown,
      categoryBreakdown
    };
  } catch (error) {
    console.error('Error generating asset report:', error);
    throw new Error('Failed to generate asset report');
  }
}

export async function exportAssetReport(format: 'csv' | 'pdf' = 'csv'): Promise<string> {
  try {
    const report = await generateAssetReport();
    
    if (format === 'csv') {
      // Generate CSV content
      let csvContent = 'ID,Name,Category,State,LGA,Purchase Value,Current Value,Depreciation %\n';
      
      // Add asset data
      report.assets.forEach(asset => {
        csvContent += `"${asset.id}","${asset.name}","${asset.category}","${asset.state}","${asset.lga}",${asset.purchaseValue},${asset.currentValue},${asset.depreciationPercentage.toFixed(2)}%\n`;
      });
      
      // Add summary
      csvContent += `\nTotal Assets,${report.summary.totalAssets},${report.summary.totalValue},100%\n`;
      
      return csvContent;
    } else {
      // For PDF, we'll return a URL to download the PDF
      // In a real implementation, you would use a PDF generation library
      // like pdfkit or puppeteer to generate the PDF
      throw new Error('PDF export not implemented yet');
    }
  } catch (error) {
    console.error('Error exporting asset report:', error);
    throw new Error('Failed to export asset report');
  }
}
