
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parallelize queries for performance
        const [
            totalAssets,
            totalValueResult,
            activeAssets,
            maintenanceNeeded,
            recentAssets,
            assetsByCategory,
            assetsByState,
            recentActivities
        ] = await Promise.all([
            // 1. Total Assets
            prisma.asset.count(),

            // 2. Total Value (sum of current value)
            prisma.asset.aggregate({
                _sum: {
                    currentValue: true
                }
            }),

            // 3. Active Assets
            prisma.asset.count({
                where: {
                    status: {
                        notIn: ['DISPOSED', 'MISSING']
                    }
                }
            }),

            // 4. Maintenance Needed
            prisma.asset.count({
                where: { status: 'MAINTENANCE' }
            }),

            // 5. Recent Assets (top 5)
            prisma.asset.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: {
                        select: { name: true }
                    },
                    state: {
                        select: { name: true }
                    }
                }
            }),

            // 6. Assets by Category
            prisma.asset.groupBy({
                by: ['categoryId'],
                _count: {
                    id: true
                }
            }),

            // 7. Assets by Location (State)
            prisma.asset.groupBy({
                by: ['stateId'],
                _count: {
                    id: true
                }
            }),

            // 8. Recent Activities
            prisma.auditLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { firstName: true, lastName: true, email: true }
                    }
                }
            })
        ]);

        // Post-process grouped data to get names (since groupBy doesn't include relations)
        // We need to fetch category names and state names

        // Get unique category IDs and State IDs from the grouped results
        const categoryIds = assetsByCategory.map((item: any) => item.categoryId);
        const stateIds = assetsByState.map((item: any) => item.stateId);

        const [categories, states] = await Promise.all([
            prisma.category.findMany({
                where: { id: { in: categoryIds } },
                select: { id: true, name: true }
            }),
            prisma.state.findMany({
                where: { id: { in: stateIds } },
                select: { id: true, name: true }
            })
        ]);

        // Map names back to the grouped data
        const categoryData = assetsByCategory.map((item: any) => {
            const category = categories.find((c: any) => c.id === item.categoryId);
            return {
                name: category?.name || 'Unknown',
                value: item._count.id
            };
        }).sort((a: any, b: any) => b.value - a.value); // Sort by count desc

        const locationData = assetsByState.map((item: any) => {
            const state = states.find((s: any) => s.id === item.stateId);
            return {
                name: state?.name || 'Unknown',
                value: item._count.id
            };
        }).sort((a: any, b: any) => b.value - a.value);


        // Format recent assets
        const formattedRecentAssets = recentAssets.map((asset: any) => ({
            id: asset.id.toString(),
            name: asset.name,
            status: asset.status.toLowerCase(),
            category: asset.category.name,
            location: asset.state.name,
            value: asset.currentValue,
            lastUpdated: asset.updatedAt
        }));

        // Format recent activities
        const formattedActivities = recentActivities.map((log: any) => {
            const userName = log.user
                ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
                : 'UnknownUser';

            return {
                id: log.id.toString(),
                type: 'info',
                title: log.action.replace(/_/g, ' '),
                description: `${log.entityType} ${log.entityId} was affected`,
                timestamp: log.createdAt,
                user: userName,
                status: 'info'
            };
        });

        return NextResponse.json({
            totalAssets,
            totalValue: totalValueResult._sum.currentValue || 0,
            activeAssets,
            maintenanceNeeded,
            recentAssets: formattedRecentAssets,
            recentActivities: formattedActivities,
            assetDistribution: {
                byCategory: categoryData,
                byLocation: locationData
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}
