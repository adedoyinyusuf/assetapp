import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Define types for the asset with relations
type AssetWithRelations = {
  id: number;
  name: string;
  description: string | null;
  purchaseValue: number;
  purchaseDate: Date;
  currentValue: number;
  usefulLife: number;
  salvageValue: number;
  category: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  state: {
    id: number;
    name: string;
  } | null;
  lga: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
    };
  } | null;
  movements: Array<{
    id: number;
    movementDate: Date;
    reason: string | null;
    movedBy: string | null;
    fromState: { name: string } | null;
    toState: { name: string } | null;
    fromLga: { name: string } | null;
    toLga: { name: string } | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

// Helper function to calculate depreciation
function calculateDepreciation(asset: {
  purchaseDate: Date | string;
  purchaseValue: number;
  salvageValue: number;
  usefulLife: number;
}) {
  const purchaseDate = new Date(asset.purchaseDate);
  const now = new Date();
  const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Calculate straight-line depreciation
  let annualDepreciation = 0;
  let totalDepreciation = 0;
  
  if (asset.usefulLife > 0) {
    annualDepreciation = (asset.purchaseValue - (asset.salvageValue || 0)) / asset.usefulLife;
    totalDepreciation = Math.min(
      annualDepreciation * yearsElapsed,
      asset.purchaseValue - (asset.salvageValue || 0)
    );
  }
  
  const currentValue = Math.max(
    asset.purchaseValue - totalDepreciation, 
    asset.salvageValue || 0
  );
  
  return {
    yearsElapsed,
    annualDepreciation,
    totalDepreciation,
    currentValue,
    depreciationPercentage: asset.purchaseValue > 0 
      ? (totalDepreciation / asset.purchaseValue) * 100 
      : 0,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all assets with related data
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        state: true,
        lga: {
          include: {
            state: true
          }
        },
        movements: {
          orderBy: {
            movementDate: 'desc',
          },
          take: 1,
          include: {
            fromState: true,
            toState: true,
            fromLga: true,
            toLga: true
          }
        },
      },
    }) as unknown as AssetWithRelations[];

    // Calculate summary statistics
    const totalAssets = assets.length;
    const totalPurchaseValue = assets.reduce((sum, asset) => sum + (asset.purchaseValue || 0), 0);
    const totalCurrentValue = assets.reduce((sum, asset) => {
      const { currentValue } = calculateDepreciation(asset);
      return sum + currentValue;
    }, 0);
    const totalDepreciation = totalPurchaseValue - totalCurrentValue;

    // Calculate depreciation percentage
    const depreciationPercentage = 
      totalPurchaseValue > 0 ? (totalDepreciation / totalPurchaseValue) * 100 : 0;

    // Group by category
    const categoryBreakdown = assets.reduce<Record<string, { count: number; totalValue: number; percentage: number }>>((acc, asset) => {
      const categoryName = asset.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = {
          count: 0,
          totalValue: 0,
          percentage: 0,
        };
      }
      acc[categoryName].count += 1;
      acc[categoryName].totalValue += calculateDepreciation(asset).currentValue;
      return acc;
    }, {});

    // Calculate percentages for each category
    Object.values(categoryBreakdown).forEach((category) => {
      category.percentage = totalCurrentValue > 0 ? (category.totalValue / totalCurrentValue) * 100 : 0;
    });

    // Group by state
    const stateBreakdown = assets.reduce<Record<string, { count: number; totalValue: number; percentage: number }>>((acc, asset) => {
      const stateName = asset.state?.name || 'Unknown';
      if (!acc[stateName]) {
        acc[stateName] = {
          count: 0,
          totalValue: 0,
          percentage: 0,
        };
      }
      acc[stateName].count += 1;
      acc[stateName].totalValue += calculateDepreciation(asset).currentValue;
      return acc;
    }, {});

    // Calculate percentages for each state
    Object.values(stateBreakdown).forEach((state) => {
      state.percentage = totalCurrentValue > 0 ? (state.totalValue / totalCurrentValue) * 100 : 0;
    });

    // Format assets for the response with calculated values
    const formattedAssets = assets.map((asset) => {
      const latestMovement = asset.movements[0];
      const { currentValue, totalDepreciation: assetDepreciation, depreciationPercentage } = calculateDepreciation(asset);
      
      return {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        purchaseValue: asset.purchaseValue,
        purchaseDate: asset.purchaseDate,
        currentValue,
        usefulLife: asset.usefulLife,
        salvageValue: asset.salvageValue,
        category: asset.category?.name || 'Uncategorized',
        state: asset.state?.name || 'Unknown',
        lga: asset.lga?.name || 'Unknown',
        latestMovement: latestMovement ? {
          from: {
            state: latestMovement.fromState?.name || 'Unknown',
            lga: latestMovement.fromLga?.name || 'Unknown'
          },
          to: {
            state: latestMovement.toState?.name || 'Unknown',
            lga: latestMovement.toLga?.name || 'Unknown'
          },
          date: latestMovement.movementDate,
          reason: latestMovement.reason || null,
          movedBy: latestMovement.movedBy || null
        } : null,
        depreciation: {
          total: assetDepreciation,
          percentage: depreciationPercentage,
          annual: (asset.purchaseValue - (asset.salvageValue || 0)) / (asset.usefulLife || 1)
        },
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      };
    });

    // Calculate value by status (using default status since it's not in the schema)
    const statusValue = {
      'Active': totalCurrentValue // Default all to active for now
    };

    // Sort assets by most depreciated first
    const mostDepreciated = [...formattedAssets]
      .sort((a, b) => (b.depreciation?.percentage || 0) - (a.depreciation?.percentage || 0))
      .slice(0, 5)
      .map(asset => ({
        id: asset.id,
        name: asset.name,
        currentValue: asset.currentValue,
        depreciation: asset.depreciation
      }));

    // Log the report generation
    await prisma.auditLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'GENERATE_REPORT',
        entityType: 'Report',
        oldValues: {},
        newValues: {
          reportType: 'Asset Summary',
          totalAssets,
          totalValue: totalCurrentValue,
          totalDepreciation
        },
        ipAddress: null,
        userAgent: null
      },
    });

    // Prepare response
    const response = {
      summary: {
        totalAssets,
        totalValue: totalPurchaseValue,
        totalDepreciation,
        netBookValue: totalCurrentValue,
        averageDepreciation: totalAssets > 0 ? totalDepreciation / totalAssets : 0,
        valueByStatus: statusValue,
        depreciationPercentage: parseFloat(depreciationPercentage.toFixed(2))
      },
      categoryBreakdown,
      stateBreakdown,
      mostDepreciated,
      generatedAt: new Date(),
      assets: formattedAssets
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
