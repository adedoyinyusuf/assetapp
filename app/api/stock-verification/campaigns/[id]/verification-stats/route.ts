import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { VerificationService } from '@/lib/stock-verification/verification-service';
import { redis } from '@/lib/redis';

// =============================================================================
// GET /api/stock-verification/campaigns/[id]/verification-stats
// Get verification statistics for a campaign
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

    // Initialize service
    const verificationService = new VerificationService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Per-IP rate limiting for verification stats (respect feature flag)
    try {
      const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';
      if (enabled) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_CAMPAIGN_VERIFICATION_STATS_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:campaign:${campaignId}:verification-stats:get:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      }
    } catch (_) { /* skip if redis unavailable */ }

    const stats = await verificationService.getVerificationStats(campaignId, userId);

    return Response.json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('Error fetching verification statistics:', error);

    if (error.message?.includes('Insufficient permissions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.message?.includes('not found')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch verification statistics' },
      { status: 500 }
    );
  }
}