import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build date filter
        const dateFilter: any = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        // Fetch user context for scoping
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { role: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Build Access Filter
        const roleName = user.role.name.toUpperCase();
        let accessFilter: any = {};

        // Exclude Super Admin from filtering
        if (!['SUPER_ADMIN', 'SUPERADMIN'].includes(roleName)) {
            // Check Geographic Constraints
            // Note: We use raw property access here assuming schema update is active
            // Cast to any to avoid TS errors if types aren't fully synced in IDE
            const userAny = user as any;

            if (userAny.lgaId) {
                accessFilter = { asset: { lgaId: userAny.lgaId } };
            } else if (userAny.stateId) {
                accessFilter = { asset: { stateId: userAny.stateId } };
            }
            // If National Manager (no state/lga), accessFilter remains {}
        }

        // Get campaign statistics
        // Filter campaigns that have ANY relevance to the scope (optional optimization)
        // For now, we fetch all campaigns but scope the stats INSIDE them.
        const campaigns = await prisma.verificationCampaign.findMany({
            where: Object.keys(dateFilter).length > 0 ? {
                OR: [
                    { startDate: dateFilter },
                    { endDate: dateFilter },
                ],
            } : undefined,
            include: {
                _count: {
                    select: {
                        verifications: true,
                        assignments: true,
                    },
                },
            },
        });

        // Get verification statistics (SCOPED)
        const allVerifications = await prisma.assetVerification.findMany({
            where: {
                ...(Object.keys(dateFilter).length > 0 ? { verificationDate: dateFilter } : {}),
                ...accessFilter // Apply Geographic Scope
            },
            select: {
                status: true,
                physicalCondition: true,
            },
        });

        // Calculate statistics
        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
        const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED').length;

        const totalVerifications = allVerifications.length;
        const verifiedAssets = allVerifications.filter(v =>
            ['VERIFIED', 'APPROVED'].includes(v.status)
        ).length;
        const pendingVerifications = allVerifications.filter(v =>
            ['PENDING', 'IN_PROGRESS'].includes(v.status)
        ).length;
        const discrepanciesFound = allVerifications.filter(v =>
            v.status === 'DISCREPANCY_FOUND'
        ).length;
        const missingAssets = allVerifications.filter(v =>
            v.status === 'MISSING' || v.physicalCondition === 'MISSING'
        ).length;
        const damagedAssets = allVerifications.filter(v =>
            v.status === 'DAMAGED' || v.physicalCondition === 'DAMAGED'
        ).length;

        const verificationRate = totalVerifications > 0
            ? (verifiedAssets / totalVerifications) * 100
            : 0;
        const discrepancyRate = totalVerifications > 0
            ? (discrepanciesFound / totalVerifications) * 100
            : 0;

        // Prepare campaign reports
        const campaignReports = await Promise.all(
            campaigns.map(async (campaign) => {
                // Apply Scope to Campaign Verifications
                const verifications = await prisma.assetVerification.findMany({
                    where: {
                        campaignId: campaign.id,
                        ...accessFilter
                    },
                    select: { status: true },
                });

                const verifiedCount = verifications.filter(v =>
                    ['VERIFIED', 'APPROVED'].includes(v.status)
                ).length;
                const pendingCount = verifications.filter(v =>
                    ['PENDING', 'IN_PROGRESS'].includes(v.status)
                ).length;

                // Adjust target count? 
                // Currently database 'targetAssetCount' is static for the campaign.
                // Dynamic target for state would require counting assets in state for that campaign.
                // For now, we leave targetCount as is (Campaign Total) vs Local Verified.
                const targetCount = campaign.targetAssetCount || 0;
                const completionRate = targetCount > 0
                    ? (verifiedCount / targetCount) * 100
                    : 0;

                // Get discrepancy count for this campaign (SCOPED)
                const discrepancyCount = await prisma.verificationDiscrepancy.count({
                    where: {
                        verification: {
                            campaignId: campaign.id,
                            ...accessFilter // Apply Geographic Scope
                        },
                    },
                });

                return {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    startDate: campaign.startDate,
                    endDate: campaign.endDate,
                    targetAssetCount: targetCount,
                    verifiedCount,
                    pendingCount,
                    discrepancyCount,
                    completionRate,
                };
            })
        );

        const stats = {
            totalCampaigns,
            activeCampaigns,
            completedCampaigns,
            totalVerifications,
            verifiedAssets,
            pendingVerifications,
            discrepanciesFound,
            missingAssets,
            damagedAssets,
            verificationRate,
            discrepancyRate,
        };

        return NextResponse.json({
            success: true,
            stats,
            campaigns: campaignReports,
        });
    } catch (error: any) {
        console.error('Error fetching reports:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}
