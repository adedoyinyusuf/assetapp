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

        // Get campaign statistics
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

        // Get verification statistics
        const allVerifications = await prisma.assetVerification.findMany({
            where: Object.keys(dateFilter).length > 0 ? {
                verificationDate: dateFilter,
            } : undefined,
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
                const verifications = await prisma.assetVerification.findMany({
                    where: { campaignId: campaign.id },
                    select: { status: true },
                });

                const verifiedCount = verifications.filter(v =>
                    ['VERIFIED', 'APPROVED'].includes(v.status)
                ).length;
                const pendingCount = verifications.filter(v =>
                    ['PENDING', 'IN_PROGRESS'].includes(v.status)
                ).length;

                const targetCount = campaign.targetAssetCount || 0;
                const completionRate = targetCount > 0
                    ? (verifiedCount / targetCount) * 100
                    : 0;

                // Get discrepancy count for this campaign
                const discrepancyCount = await prisma.verificationDiscrepancy.count({
                    where: {
                        verification: {
                            campaignId: campaign.id,
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
