import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { DiscrepancyService } from '@/lib/stock-verification/discrepancy-service';
import { z } from 'zod';

// =============================================================================
// DISCREPANCY ACTION SCHEMAS
// =============================================================================

const assignDiscrepancySchema = z.object({
  action: z.literal('assign'),
  assigneeId: z.number().int().positive(),
  notes: z.string().optional(),
});

const resolveDiscrepancySchema = z.object({
  action: z.literal('resolve'),
  resolutionNotes: z.string().min(1, 'Resolution notes are required'),
});

const closeDiscrepancySchema = z.object({
  action: z.literal('close'),
  closureNotes: z.string().optional(),
});

const discrepancyActionSchema = z.discriminatedUnion('action', [
  assignDiscrepancySchema,
  resolveDiscrepancySchema,
  closeDiscrepancySchema,
]);

// =============================================================================
// POST /api/stock-verification/discrepancies/[id]/actions
// Perform actions on discrepancies (assign, resolve, close)
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

    const discrepancyId = parseInt(params.id);
    if (isNaN(discrepancyId)) {
      return Response.json(
        { success: false, error: 'Invalid discrepancy ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = discrepancyActionSchema.safeParse(body);

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

    const { action } = validationResult.data;

    // Get IP and User-Agent for audit log
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Initialize service
    const discrepancyService = new DiscrepancyService();

    let discrepancy;
    let message = '';
    const userId = parseInt(String(session.user.id), 10);

    // Execute the requested action
    switch (action) {
      case 'assign':
        const assignData = validationResult.data as z.infer<typeof assignDiscrepancySchema>;
        discrepancy = await discrepancyService.assignDiscrepancy(
          discrepancyId,
          assignData.assigneeId,
          userId,
          assignData.notes,
          ipAddress,
          userAgent
        );
        message = 'Discrepancy assigned successfully';
        break;

      case 'resolve':
        const resolveData = validationResult.data as z.infer<typeof resolveDiscrepancySchema>;
        discrepancy = await discrepancyService.resolveDiscrepancy(
          discrepancyId,
          resolveData.resolutionNotes,
          userId,
          ipAddress,
          userAgent
        );
        message = 'Discrepancy resolved successfully';
        break;

      case 'close':
        const closeData = validationResult.data as z.infer<typeof closeDiscrepancySchema>;
        discrepancy = await discrepancyService.closeDiscrepancy(
          discrepancyId,
          userId,
          closeData.closureNotes,
          ipAddress,
          userAgent
        );
        message = 'Discrepancy closed successfully';
        break;

      default:
        return Response.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return Response.json({
      success: true,
      data: discrepancy,
      message,
    });

  } catch (error: any) {
    console.error('Error performing discrepancy action:', error);

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
      { success: false, error: 'Failed to perform discrepancy action' },
      { status: 500 }
    );
  }
}