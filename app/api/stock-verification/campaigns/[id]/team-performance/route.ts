import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { AssignmentService } from '@/lib/stock-verification/assignment-service';
import { redis } from '@/lib/redis';

// =============================================================================
// GET /api/stock-verification/campaigns/[id]/team-performance
// Get team performance metrics for a campaign
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
    const assignmentService = new AssignmentService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Per-IP rate limiting for team performance (respect feature flag)
    try {
      const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';
      if (enabled) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_CAMPAIGN_TEAM_PERFORMANCE_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:campaign:${campaignId}:team-performance:get:${ip}`;
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

    const performanceMetrics = await assignmentService.getTeamPerformance(campaignId, userId);

    return Response.json({
      success: true,
      data: performanceMetrics,
    });

  } catch (error: any) {
    console.error('Error fetching team performance:', error);

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
      { success: false, error: 'Failed to fetch team performance' },
      { status: 500 }
    );
  }
}