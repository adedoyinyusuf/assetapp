import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { DiscrepancyService } from '@/lib/stock-verification/discrepancy-service';
import { updateDiscrepancySchema } from '@/lib/stock-verification/validation';

// =============================================================================
// GET /api/stock-verification/discrepancies/[id]
// Get discrepancy by ID with full details
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

    const discrepancyId = parseInt(params.id);
    if (isNaN(discrepancyId)) {
      return Response.json(
        { success: false, error: 'Invalid discrepancy ID' },
        { status: 400 }
      );
    }

    // Initialize service
    const discrepancyService = new DiscrepancyService();

    // Get discrepancy details
    const userId = parseInt(String(session.user.id), 10);
    const discrepancy = await discrepancyService.getDiscrepancyById(discrepancyId, userId);

    return Response.json({
      success: true,
      data: discrepancy,
    });

  } catch (error: any) {
    console.error('Error fetching discrepancy:', error);

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
      { success: false, error: 'Failed to fetch discrepancy' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/stock-verification/discrepancies/[id]
// Update discrepancy details and status
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

    const discrepancyId = parseInt(params.id);
    if (isNaN(discrepancyId)) {
      return Response.json(
        { success: false, error: 'Invalid discrepancy ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateDiscrepancySchema.safeParse(body);

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

    // Get IP and User-Agent for audit log
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize service
    const discrepancyService = new DiscrepancyService();

    // Update discrepancy
    const userId = parseInt(String(session.user.id), 10);
    const discrepancy = await discrepancyService.updateDiscrepancy(
      discrepancyId,
      validationResult.data,
      userId,
      ipAddress,
      userAgent
    );

    return Response.json({
      success: true,
      data: discrepancy,
      message: 'Discrepancy updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating discrepancy:', error);

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

    if (error.message?.includes('Invalid status transition') || 
        error.message?.includes('does not have access to this campaign')) {
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
      { success: false, error: 'Failed to update discrepancy' },
      { status: 500 }
    );
  }
}