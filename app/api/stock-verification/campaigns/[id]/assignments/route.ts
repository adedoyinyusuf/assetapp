import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { AssignmentService } from '@/lib/stock-verification/assignment-service';
import { createAssignmentSchema } from '@/lib/stock-verification/validation';
// import { redis } from '@/lib/redis';
const enabled = false; // process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// GET /api/stock-verification/campaigns/[id]/assignments
// Get all assignments for a campaign
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

    // Per-IP rate limiting for campaign assignments list
    // Per-IP rate limiting for campaign assignments list
    /*
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown';
        const limit = Number(process.env.SV_CAMPAIGN_ASSIGNMENTS_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:campaign:${campaignId}:assignments:get:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) { // skip if redis unavailable }
    }
    */

    // Initialize service
    const assignmentService = new AssignmentService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get assignments for campaign
    const assignments = await assignmentService.getAssignments(campaignId, userId);

    return Response.json({
      success: true,
      data: assignments,
    });

  } catch (error: any) {
    console.error('Error fetching assignments:', error);

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
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/stock-verification/campaigns/[id]/assignments
// Create a new assignment for a campaign
// =============================================================================

export async function POST(
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAssignmentSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // Per-IP rate limiting for assignment creation
    // Per-IP rate limiting for assignment creation
    /*
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown';
        const limit = Number(process.env.SV_CAMPAIGN_ASSIGNMENTS_POST_RATE_LIMIT_PER_MINUTE || '60');
        const key = `sv:campaign:${campaignId}:assignments:post:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) { // skip if redis unavailable }
    }
    */

    // Get IP and User-Agent for audit log
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize service
    const assignmentService = new AssignmentService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Create assignment
    const result = await assignmentService.createAssignment(
      campaignId,
      validationResult.data,
      userId,
      ipAddress,
      userAgent
    );

    return Response.json({
      success: true,
      data: result,
      message: 'Assignment created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating assignment:', error);

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

    if (error.message?.includes('already assigned') ||
      error.message?.includes('Cannot assign users')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    if (error.message?.includes('Validation failed')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to create assignment', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}