import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { DiscrepancyService } from '@/lib/stock-verification/discrepancy-service';
import { createDiscrepancySchema, discrepancyQuerySchema } from '@/lib/stock-verification/validation';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// GET /api/stock-verification/discrepancies
// Get paginated list of discrepancies
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
    const validationResult = discrepancyQuerySchema.safeParse(queryParams);
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

    // Per-IP rate limiting for discrepancies list
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_DISCREPANCIES_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:discrepancies:get:${ip}`;
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
    const discrepancyService = new DiscrepancyService();

    // Get discrepancies
    const userId = parseInt(String(session.user.id), 10);
    const result = await discrepancyService.getDiscrepancies(validationResult.data, userId);

    return Response.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });

  } catch (error: any) {
    console.error('Error fetching discrepancies:', error);

    if (error.message?.includes('Insufficient permissions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to fetch discrepancies' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/stock-verification/discrepancies
// Create a new discrepancy
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
    const validationResult = createDiscrepancySchema.safeParse(body);

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

    // Per-IP rate limiting for discrepancy creation
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_DISCREPANCIES_POST_RATE_LIMIT_PER_MINUTE || '60');
        const key = `sv:discrepancies:post:${ip}`;
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
    const discrepancyService = new DiscrepancyService();

    // Create discrepancy
    const userId = parseInt(String(session.user.id), 10);
    const discrepancy = await discrepancyService.createDiscrepancy(
      validationResult.data,
      userId,
      ipAddress,
      userAgent
    );

    return Response.json({
      success: true,
      data: discrepancy,
      message: 'Discrepancy created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating discrepancy:', error);

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

    if (error.message?.includes('No access to this verification')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.message?.includes('Validation failed')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to create discrepancy' },
      { status: 500 }
    );
  }
}
