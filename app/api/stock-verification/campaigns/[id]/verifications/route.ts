import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
// import { redis } from '@/lib/redis';
const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// GET /api/stock-verification/campaigns/[id]/verifications
// Get verifications for a specific campaign with filtering and pagination
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return Response.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Verify campaign exists and user has access
    const campaign = await prisma.verificationCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return Response.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const condition = searchParams.get('condition') || '';
    const verifierId = searchParams.get('verifierId') || '';
    const priority = searchParams.get('priority') || '';

    const skip = (page - 1) * limit;

    // Per-IP rate limiting for campaign verifications list
    /*
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limitRL = Number(process.env.SV_CAMPAIGN_VERIFICATIONS_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:campaign:${campaignId}:verifications:get:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limitRL) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) { // skip if redis unavailable }
    }
    */

    // Build where clause
    const where: any = {
      campaignId,
      ...(status && { status }),
      ...(condition && { physicalCondition: condition }),
      ...(verifierId && { verifierId: parseInt(verifierId) }),
      // ...(priority && { priority: parseInt(priority) }), // Removed: AssetVerification has no 'priority' field
      ...(search && {
        OR: [
          {
            asset: {
              name: { contains: search, mode: 'insensitive' }
            }
          },
          // Removed: serialNumber is not a field on Asset in schema
          // {
          //   asset: {
          //     serialNumber: { contains: search, mode: 'insensitive' }
          //   }
          // },
          {
            verifier: {
              firstName: { contains: search, mode: 'insensitive' }
            }
          },
          {
            verifier: {
              lastName: { contains: search, mode: 'insensitive' }
            }
          },
          {
            verifier: {
              email: { contains: search, mode: 'insensitive' }
            }
          }
        ]
      })
    };

    // Get verifications with related data
    const [verifications, totalCount] = await Promise.all([
      prisma.assetVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          // Removed invalid order by 'priority'
          { createdAt: 'desc' }
        ],
        include: {
          asset: {
            include: {
              category: { select: { name: true } },
              state: { select: { name: true } },
              lga: { select: { name: true } }
            }
          },
          verifier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          discrepancies: {
            select: {
              id: true,
              discrepancyType: true,
              severity: true
            }
          }
        }
      }),
      prisma.assetVerification.count({ where })
    ]);

    // Get verification statistics for the campaign
    const stats = await prisma.assetVerification.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { _all: true }
    });

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count._all;
      return acc;
    }, {} as Record<string, number>);

    const verificationStats = {
      total: stats.reduce((sum, stat) => sum + stat._count._all, 0),
      pending: statsMap.PENDING || 0,
      inProgress: statsMap.IN_PROGRESS || 0,
      verified: statsMap.VERIFIED || 0,
      discrepancies: statsMap.DISCREPANCY_FOUND || 0,
      missing: statsMap.MISSING || 0,
      damaged: statsMap.DAMAGED || 0,
      requiresReview: statsMap.REQUIRES_REVIEW || 0,
    };

    const totalPages = Math.ceil(totalCount / limit);

    return Response.json({
      success: true,
      data: verifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: verificationStats
    });

  } catch (error: any) {
    console.error('Error fetching campaign verifications:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch campaign verifications', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}