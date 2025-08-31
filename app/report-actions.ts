import { prisma } from './db';

export interface AssetReport {
  totalCount: number;
  totalValue: number;
  byCategory: Array<{
    category: string;
    count: number;
    value: number;
    percentage: number;
  }>;
  byLocation: Array<{
    state: string;
    lga: string;
    count: number;
    value: number;
  }>;
  recentAdditions: Array<{
    id: number;
    name: string;
    purchaseValue: number;
    purchaseDate: string;
    category: string;
  }>;
  depreciationSummary: {
    totalDepreciation: number;
    averageDepreciation: number;
    mostDepreciated: Array<{
      id: number;
      name: string;
      depreciation: number;
    }>;
  };
}

export async function generateAssetReport(): Promise<AssetReport> {
  try {
    // 1. Get total count and value of all assets
    const totalStats = await prisma.$queryRaw<Array<{
      total_count: bigint;
      total_value: number;
    }>>`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(purchase_value), 0) as total_value
      FROM assets
      WHERE deleted_at IS NULL
    `;

    // 2. Get assets grouped by category
    const byCategory = await prisma.$queryRaw<Array<{
      category: string;
      count: bigint;
      value: number;
    }>>`
      SELECT 
        c.name as category,
        COUNT(a.id) as count,
        COALESCE(SUM(a.purchase_value), 0) as value
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      WHERE a.deleted_at IS NULL
      GROUP BY c.name
      ORDER BY value DESC
    `;

    // 3. Get assets grouped by location
    const byLocation = await prisma.$queryRaw<Array<{
      state: string;
      lga: string;
      count: bigint;
      value: number;
    }>>`
      SELECT 
        s.name as state,
        l.name as lga,
        COUNT(a.id) as count,
        COALESCE(SUM(a.purchase_value), 0) as value
      FROM assets a
      JOIN lgas l ON a.lga_id = l.id
      JOIN states s ON l.state_id = s.id
      WHERE a.deleted_at IS NULL
      GROUP BY s.name, l.name
      ORDER BY s.name, l.name
    `;

    // 4. Get recently added assets
    const recentAdditions = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      purchase_value: number;
      purchase_date: Date;
      category: string;
    }>>`
      SELECT 
        a.id,
        a.name,
        a.purchase_value,
        a.purchase_date,
        c.name as category
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      WHERE a.deleted_at IS NULL
      ORDER BY a.created_at DESC
      LIMIT 5
    `;

    // 5. Calculate depreciation summary
    const depreciationSummary = await prisma.$queryRaw<Array<{
      total_depreciation: number;
      average_depreciation: number;
    }>>`
      WITH asset_depreciation AS (
        SELECT 
          id,
          name,
          purchase_value,
          purchase_date,
          useful_life_years,
          (purchase_value * EXTRACT(YEAR FROM AGE(NOW(), purchase_date)) / GREATEST(useful_life_years, 1)) as depreciation
        FROM assets
        WHERE deleted_at IS NULL
      )
      SELECT 
        COALESCE(SUM(depreciation), 0) as total_depreciation,
        COALESCE(AVG(depreciation), 0) as average_depreciation
      FROM asset_depreciation
    `;

    // 6. Get most depreciated assets
    const mostDepreciated = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      depreciation: number;
    }>>`
      SELECT 
        id,
        name,
        (purchase_value * EXTRACT(YEAR FROM AGE(NOW(), purchase_date)) / GREATEST(useful_life_years, 1)) as depreciation
      FROM assets
      WHERE deleted_at IS NULL
      ORDER BY depreciation DESC
      LIMIT 5
    `;

    const totalCount = Number(totalStats[0]?.total_count || 0);
    const totalValue = Number(totalStats[0]?.total_value || 0);

    return {
      totalCount,
      totalValue,
      byCategory: byCategory.map(item => ({
        category: item.category,
        count: Number(item.count),
        value: Number(item.value),
        percentage: totalValue > 0 ? (Number(item.value) / totalValue) * 100 : 0
      })),
      byLocation: byLocation.map(item => ({
        state: item.state,
        lga: item.lga,
        count: Number(item.count),
        value: Number(item.value)
      })),
      recentAdditions: recentAdditions.map(item => ({
        id: item.id,
        name: item.name,
        purchaseValue: Number(item.purchase_value),
        purchaseDate: item.purchase_date.toISOString(),
        category: item.category
      })),
      depreciationSummary: {
        totalDepreciation: Number(depreciationSummary[0]?.total_depreciation || 0),
        averageDepreciation: Number(depreciationSummary[0]?.average_depreciation || 0),
        mostDepreciated: mostDepreciated.map(item => ({
          id: item.id,
          name: item.name,
          depreciation: Number(item.depreciation)
        }))
      }
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
      let csvContent = 'Category,Count,Value,Percentage\n';
      
      // Add category data
      report.byCategory.forEach(item => {
        csvContent += `"${item.category}",${item.count},${item.value},${item.percentage.toFixed(2)}%\n`;
      });
      
      // Add summary
      csvContent += `\nTotal Assets,${report.totalCount},${report.totalValue},100%\n`;
      
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
