import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { VerificationService } from '@/lib/stock-verification/verification-service';
import { photoUploadSchema } from '@/lib/stock-verification/validation';
import { redis } from '@/lib/redis';
const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

// =============================================================================
// GET /api/stock-verification/verifications/[id]/photos
// Get all photos for a verification
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

    // Per-IP rate limiting for photos GET
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
        const limit = Number(process.env.VERIFICATION_PHOTOS_GET_RATE_LIMIT_PER_MINUTE || '120');
        const key = `sv:photos:get:${ip}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) {
        // If Redis unavailable, skip rate limiting
      }
    }

    // Initialize service
    const verificationService = new VerificationService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Get verification photos
    const photos = await verificationService.getVerificationPhotos(verificationId, userId);

    return Response.json({
      success: true,
      data: photos,
    });

  } catch (error: any) {
    console.error('Error fetching verification photos:', error);

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
      { success: false, error: 'Failed to fetch verification photos' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/stock-verification/verifications/[id]/photos
// Upload photos for a verification
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

    const verificationId = parseInt(params.id);
    if (isNaN(verificationId)) {
      return Response.json(
        { success: false, error: 'Invalid verification ID' },
        { status: 400 }
      );
    }

    // Extract IP/User-Agent and apply per-IP rate limiting for uploads
    const ipAddressRL = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
    const userAgentRL = request.headers.get('user-agent') || 'unknown';

    // ... existing code ...
    if (enabled) {
      try {
        const limit = Number(process.env.VERIFICATION_PHOTOS_POST_RATE_LIMIT_PER_MINUTE || '30');
        const key = `sv:photos:post:${ipAddressRL}`;
        const count = await redis.incr(key);
        await redis.expire(key, 60);
        if (count > limit) {
          return Response.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          );
        }
      } catch (_) {
        // If Redis unavailable, skip rate limiting
      }
    }

    // Parse request - support both JSON and FormData
    let files: any[] = [];
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      // JSON upload with base64 encoded files
      const body = await request.json();
      
      // Validate each file in the array
      if (!Array.isArray(body.files)) {
        return Response.json(
          { success: false, error: 'Files must be provided as an array' },
          { status: 400 }
        );
      }

      for (const file of body.files) {
        const validationResult = photoUploadSchema.safeParse(file);
        if (!validationResult.success) {
          return Response.json(
            { 
              success: false, 
              error: 'File validation failed',
              details: validationResult.error.errors 
            },
            { status: 400 }
          );
        }
      }

      files = body.files;
    } else if (contentType?.includes('multipart/form-data')) {
      // FormData upload
      const formData = await request.formData();
      const uploadedFiles = formData.getAll('files') as File[];

      if (uploadedFiles.length === 0) {
        return Response.json(
          { success: false, error: 'No files provided' },
          { status: 400 }
        );
      }

      // Convert File objects to our format
      files = await Promise.all(
        uploadedFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          // Derive photoType from formData; default to 'asset' if missing/invalid
          const rawType = String(formData.get(`photoType_${file.name}`) || '').toLowerCase();
          const allowed = new Set(['asset', 'condition', 'location', 'damage', 'other']);
          const photoType = allowed.has(rawType) ? rawType : 'asset';
          return {
            originalName: file.name,
            mimeType: file.type,
            data: Buffer.from(buffer),
            photoType,
          };
        })
      );
    } else {
      return Response.json(
        { success: false, error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return Response.json(
        { success: false, error: 'No valid files provided' },
        { status: 400 }
      );
    }

    // Check file limits
    if (files.length > 10) {
      return Response.json(
        { success: false, error: 'Maximum 10 files allowed per upload' },
        { status: 400 }
      );
    }

    // Get IP and User-Agent for audit log
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize service
    const verificationService = new VerificationService();

    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10);

    // Upload photos
    const uploadedFileNames = await verificationService.uploadPhotos(
      verificationId,
      files,
      userId,
      ipAddress,
      userAgent
    );

    return Response.json({
      success: true,
      data: {
        uploadedFiles: uploadedFileNames,
        count: uploadedFileNames.length,
      },
      message: `${uploadedFileNames.length} photo(s) uploaded successfully`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error uploading verification photos:', error);

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

    if (error.message?.includes('File too large') || 
        error.message?.includes('Invalid file type') ||
        error.message?.includes('dimensions')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error.message?.includes('Storage full') || 
        error.message?.includes('disk space')) {
      return Response.json(
        { success: false, error: 'Insufficient storage space' },
        { status: 507 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}