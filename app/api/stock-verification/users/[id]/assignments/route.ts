import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { AssignmentService } from '@/lib/stock-verification/assignment-service';
import { redis } from '@/lib/redis';
const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// GET /api/stock-verification/users/[id]/assignments
// Get all assignments for a specific user
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

    const targetUserId = parseInt(params.id);
    if (isNaN(targetUserId)) {
      return Response.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Per-IP rate limiting for user assignments list
    if (enabled) {
      try {
        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown';
        const limit = Number(process.env.SV_USER_ASSIGNMENTS_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:user:${targetUserId}:assignments:get:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) {
        // skip if redis unavailable
      }
    }

    // Initialize service
    const assignmentService = new AssignmentService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get user assignments
    const assignments = await assignmentService.getUserAssignments(targetUserId, userId);

    return Response.json({
      success: true,
      data: assignments,
    });

  } catch (error: any) {
    console.error('Error fetching user assignments:', error);

    if (error.message?.includes('Insufficient permissions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch user assignments' },
      { status: 500 }
    );
  }
}