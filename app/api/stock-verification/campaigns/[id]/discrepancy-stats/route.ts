import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { DiscrepancyService } from '@/lib/stock-verification/discrepancy-service';

// =============================================================================
// GET /api/stock-verification/campaigns/[id]/discrepancy-stats
// Get discrepancy statistics for a campaign
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
    const discrepancyService = new DiscrepancyService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    const stats = await discrepancyService.getDiscrepancyStats(campaignId, userId);

    return Response.json({
      success: true,
      data: stats,
    });

  } catch (error: any) {
    console.error('Error fetching discrepancy statistics:', error);

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
      { success: false, error: 'Failed to fetch discrepancy statistics' },
      { status: 500 }
    );
  }
}