import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { CampaignService } from '@/lib/stock-verification/campaign-service';
import { 
  createCampaignSchema, 
  campaignQuerySchema,
  CreateCampaignRequest 
} from '@/lib/stock-verification/validation';
import { ZodError } from 'zod';
import { redis } from '@/lib/redis';
const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// Initialize campaign service
const campaignService = new CampaignService();

// =============================================================================
// GET /api/stock-verification/campaigns
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validationResult = campaignQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    // Per-IP rate limiting for campaigns list
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_CAMPAIGNS_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:campaigns:get:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) { /* skip if redis unavailable */ }
    }

    // Initialize service
    const campaignService = new CampaignService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get campaigns
    const result = await campaignService.getCampaigns(validationResult.data, userId);

    return Response.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        hasNext: result.pagination.hasNextPage,
        hasPrev: result.pagination.hasPrevPage,
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    
    if (error.code === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/stock-verification/campaigns
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Normalize aliases from tests (stateIds/lgaIds/categoryIds) to schema fields
    const assignedStates = Array.isArray(body.assignedStates)
      ? body.assignedStates
      : (Array.isArray(body.stateIds) ? body.stateIds : []);
    const assignedLgas = Array.isArray(body.assignedLgas)
      ? body.assignedLgas
      : (Array.isArray(body.lgaIds) ? body.lgaIds : []);
    const assignedCategories = Array.isArray(body.assignedCategories)
      ? body.assignedCategories
      : (Array.isArray(body.categoryIds) ? body.categoryIds : []);

    // Ensure arrays are numeric
    const toNumArray = (arr: any[]) => (arr || []).map((v) => typeof v === 'string' ? parseInt(v, 10) : v);

    // Normalize date inputs (accept 'YYYY-MM-DD' or ISO) and set defaults if missing
    const normalizeDate = (d: any) => {
      if (!d) return undefined;
      try {
        const iso = new Date(String(d)).toISOString();
        return iso;
      } catch {
        return undefined;
      }
    };
    const nowIso = new Date().toISOString();
    const plus30Iso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const normalizedBody = {
      ...body,
      startDate: normalizeDate(body.startDate) || nowIso,
      endDate: normalizeDate(body.endDate) || plus30Iso,
      assignedStates: toNumArray(assignedStates),
      assignedLgas: toNumArray(assignedLgas),
      assignedCategories: toNumArray(assignedCategories),
    };
    
    // Validate request data
    const validationResult = createCampaignSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    // Per-IP rate limiting for campaign creation
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_CAMPAIGNS_POST_RATE_LIMIT_PER_MINUTE || '30');
        const key = `sv:campaigns:post:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return NextResponse.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) { /* skip if redis unavailable */ }
    }

    // Get client info for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('Creating campaign with data:', {
      ...validationResult.data,
      userId: parseInt(session.user.id),
      ipAddress,
      userAgent
    });

    // Initialize service
    const campaignService = new CampaignService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Create campaign
    const campaign = await campaignService.createCampaign(
      validationResult.data,
      userId,
      ipAddress,
      userAgent
    );

    console.log('Campaign created successfully:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status
    });

    return NextResponse.json(
      {
        success: true,
        data: campaign,
        message: 'Campaign created successfully'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating campaign:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
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
    
    if (error.code === 'UNAUTHORIZED') {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 403 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create campaign' 
      },
      { status: 500 }
    );
  }
}