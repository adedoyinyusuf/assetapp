import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { VerificationService } from '@/lib/stock-verification/verification-service';
import { createVerificationsSchema, verificationQuerySchema } from '@/lib/stock-verification/validation';
import { redis } from '@/lib/redis';
const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// GET /api/stock-verification/verifications
// Get paginated list of asset verifications
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validationResult = verificationQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    // Per-IP rate limiting for verifications list
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_VERIFICATIONS_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:verifications:get:${ip}`;
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
    const verificationService = new VerificationService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get verifications
    const result = await verificationService.getVerifications(validationResult.data, userId);

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

  } catch (error: any) {
    console.error('Error fetching verifications:', error);

    if (error.message?.includes('Insufficient permissions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/stock-verification/verifications
// Create new asset verifications
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createVerificationsSchema.safeParse(body);

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

    // Per-IP rate limiting for verification creation
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_VERIFICATIONS_POST_RATE_LIMIT_PER_MINUTE || '60');
        const key = `sv:verifications:post:${ip}`;
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

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Initialize service
    const verificationService = new VerificationService();

    // Create verifications
    const verifications = await verificationService.createVerifications(
      validationResult.data,
      userId,
      ipAddress,
      userAgent
    );

    return Response.json({
      success: true,
      data: verifications,
      message: `${verifications.length} verification(s) created successfully`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating verifications:', error);

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

    if (error.message?.includes('already verified') || 
        error.message?.includes('Cannot create verifications') ||
        error.message?.includes('not assigned')) {
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
      { success: false, error: 'Failed to create verifications' },
      { status: 500 }
    );
  }
}