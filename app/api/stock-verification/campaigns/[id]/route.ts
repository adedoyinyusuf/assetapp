import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { CampaignService } from '@/lib/stock-verification/campaign-service';
import { updateCampaignSchema } from '@/lib/stock-verification/validation';
import { ZodError } from 'zod';

// Initialize campaign service
const campaignService = new CampaignService();

// =============================================================================
// GET /api/stock-verification/campaigns/[id]
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate campaign ID
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      )
    }

    // Initialize service
    const campaignService = new CampaignService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get campaign details
    const campaign = await campaignService.getCampaignById(campaignId, userId);

    return Response.json({
      success: true,
      data: campaign,
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (error.code === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/stock-verification/campaigns/[id]
// =============================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate campaign ID
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = updateCampaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    // Get client info for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize service
    const campaignService = new CampaignService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Update campaign
    const result = await campaignService.updateCampaign(
      campaignId,
      validationResult.data,
      userId,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Campaign updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating campaign:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      );
    }

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (error.code === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error.code === 'CONFLICT') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/stock-verification/campaigns/[id]
// =============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate campaign ID
    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Initialize service
    const campaignService = new CampaignService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Delete campaign
    const result = await campaignService.deleteCampaign(campaignId, userId);

    return NextResponse.json({
      success: true,
      message: 'Campaign cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (error.code === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.code === 'CONFLICT') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}