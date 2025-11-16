import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { AssignmentService } from '@/lib/stock-verification/assignment-service';
import { updateAssignmentSchema } from '@/lib/stock-verification/validation';
import { redis } from '@/lib/redis';
const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// GET /api/stock-verification/assignments/[id]
// Get a specific assignment by ID
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

    const assignmentId = parseInt(params.id);
    if (isNaN(assignmentId)) {
      return Response.json(
        { success: false, error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Per-IP rate limiting for assignment details GET
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_ASSIGNMENT_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:assignment:${assignmentId}:get:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) { /* skip if redis unavailable */ }
    }

    // Initialize service
    const assignmentService = new AssignmentService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get assignment details
    const assignment = await assignmentService.getAssignmentById(assignmentId, userId);

    return Response.json({
      success: true,
      data: assignment,
    });

  } catch (error: any) {
    console.error('Error fetching assignment:', error);

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
      { success: false, error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/stock-verification/assignments/[id]
// Update an assignment
// =============================================================================

export async function PUT(
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

    const assignmentId = parseInt(params.id);
    if (isNaN(assignmentId)) {
      return Response.json(
        { success: false, error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateAssignmentSchema.safeParse(body);

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

    // Per-IP rate limiting for assignment update PUT
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_ASSIGNMENT_PUT_RATE_LIMIT_PER_MINUTE || '60');
        const key = `sv:assignment:${assignmentId}:put:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) { /* skip if redis unavailable */ }
    }

    // Get IP and User-Agent for audit log
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize service
    const assignmentService = new AssignmentService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Update assignment
    const result = await assignmentService.updateAssignment(
      assignmentId,
      validationResult.data,
      userId
    );

    return Response.json({
      success: true,
      data: result,
      message: 'Assignment updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating assignment:', error);

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

    if (error.message?.includes('Cannot update assignments')) {
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
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/stock-verification/assignments/[id]
// Delete an assignment
// =============================================================================

export async function DELETE(
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

    const assignmentId = parseInt(params.id);
    if (isNaN(assignmentId)) {
      return Response.json(
        { success: false, error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    // Get IP and User-Agent for audit log
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize service
    const assignmentService = new AssignmentService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Delete assignment
    const result = await assignmentService.deleteAssignment(assignmentId, userId);

    return Response.json({
      success: true,
      message: 'Assignment deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting assignment:', error);

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

    if (error.message?.includes('Cannot delete assignment') || 
        error.message?.includes('active verifications')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}