import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { VerificationService } from '@/lib/stock-verification/verification-service';
import { updateVerificationSchema } from '@/lib/stock-verification/validation';

// =============================================================================
// GET /api/stock-verification/verifications/[id]
// Get verification by ID with full details
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

    const verificationId = parseInt(params.id);
    if (isNaN(verificationId)) {
      return Response.json(
        { success: false, error: 'Invalid verification ID' },
        { status: 400 }
      );
    }

    // Initialize service
    const verificationService = new VerificationService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get verification details
    const verification = await verificationService.getVerificationById(verificationId, userId);

    return Response.json({
      success: true,
      data: verification,
    });

  } catch (error: any) {
    console.error('Error fetching verification:', error);

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
      { success: false, error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/stock-verification/verifications/[id]
// Update verification details and status
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

    const verificationId = parseInt(params.id);
    if (isNaN(verificationId)) {
      return Response.json(
        { success: false, error: 'Invalid verification ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateVerificationSchema.safeParse(body);

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

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Initialize service
    const verificationService = new VerificationService();

    // Update verification
    const verification = await verificationService.updateVerification(
      verificationId,
      validationResult.data,
      userId,
      ipAddress,
      userAgent
    );

    return Response.json({
      success: true,
      data: verification,
      message: 'Verification updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating verification:', error);

    if (error.message?.includes('Insufficient permissions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to update verification' },
      { status: 500 }
    );
  }
}