import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { VerificationService } from '@/lib/stock-verification/verification-service';
import { z } from 'zod';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// QR SCAN REQUEST SCHEMA
// =============================================================================

const qrScanSchema = z.object({
  qrData: z.string().min(1, 'QR data is required'),
  campaignId: z.number().int().positive('Valid campaign ID is required'),
});

// =============================================================================
// POST /api/stock-verification/scan-qr
// Scan asset QR code and get asset details
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
    const validationResult = qrScanSchema.safeParse(body);

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

    const { qrData, campaignId } = validationResult.data;

    // Per-IP rate limiting for scan-qr POST
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.SV_SCAN_QR_POST_RATE_LIMIT_PER_MINUTE || '60');
        const key = `sv:scanqr:post:${ip}`;
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

    // Scan QR code and get asset info
    const scanResult = await verificationService.scanAssetQR(qrData, campaignId, userId);

    return Response.json({
      success: true,
      data: scanResult,
      message: scanResult.isAlreadyVerified 
        ? 'Asset already verified in this campaign'
        : 'Asset found and ready for verification',
    });

  } catch (error: any) {
    console.error('Error scanning QR code:', error);

    if (error.message?.includes('Insufficient permissions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error.message?.includes('Asset not found')) {
      return Response.json(
        { success: false, error: 'Asset not found. Please check the QR code.' },
        { status: 404 }
      );
    }

    if (error.message?.includes('Invalid QR code')) {
      return Response.json(
        { success: false, error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    if (error.message?.includes('Validation failed')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to scan QR code' },
      { status: 500 }
    );
  }
}
