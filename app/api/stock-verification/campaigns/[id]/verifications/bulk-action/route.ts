import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['assign', 'unassign', 'approve', 'reject', 'start', 'complete']),
  verificationIds: z.array(z.number()),
  verifierId: z.number().optional(),
  reason: z.string().optional(),
});

// =============================================================================
// POST /api/stock-verification/campaigns/[id]/verifications/bulk-action
// Perform bulk actions on campaign verifications
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

    const campaignId = parseInt(params.id);
    if (isNaN(campaignId)) {
      return Response.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bulkActionSchema.safeParse(body);

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

    const { action, verificationIds, verifierId, reason } = validationResult.data;
    const userId = parseInt(String(session.user.id), 10);

    // Verify campaign exists
    const campaign = await prisma.verificationCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return Response.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify verifications exist and belong to this campaign
    const verifications = await prisma.assetVerification.findMany({
      where: {
        id: { in: verificationIds },
        campaignId,
      }
    });

    if (verifications.length !== verificationIds.length) {
      return Response.json(
        { success: false, error: 'Some verifications not found or not part of this campaign' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let successCount = 0;
    let errorMessages: string[] = [];

    // Build update data based on action
    switch (action) {
      case 'assign':
        if (!verifierId) {
          return Response.json(
            { success: false, error: 'Verifier ID required for assignment' },
            { status: 400 }
          );
        }
        
        // Verify verifier exists and is assigned to campaign
        const verifierAssignment = await prisma.verificationAssignment.findFirst({
          where: {
            campaignId,
            userId: verifierId,
            status: 'ACTIVE'
          }
        });

        if (!verifierAssignment) {
          return Response.json(
            { success: false, error: 'Verifier not assigned to this campaign' },
            { status: 400 }
          );
        }

        updateData = {
          verifierId: verifierId,
          status: 'PENDING',
        };
        break;

      case 'unassign':
        updateData = {
          verifierId: null,
          status: 'PENDING',
        };
        break;

      case 'approve':
        // Only approve verifications that are in VERIFIED or REQUIRES_REVIEW status
        const approvableVerifications = verifications.filter(v => 
          ['VERIFIED', 'REQUIRES_REVIEW'].includes(v.status)
        );

        if (approvableVerifications.length === 0) {
          return Response.json(
            { success: false, error: 'No verifications available for approval' },
            { status: 400 }
          );
        }

        // Update only approvable verifications
        await prisma.assetVerification.updateMany({
          where: {
            id: { in: approvableVerifications.map(v => v.id) },
            campaignId,
          },
          data: {
            status: 'APPROVED',
            reviewedBy: userId,
            reviewedAt: new Date(),
            reviewNotes: reason,
          }
        });

        successCount = approvableVerifications.length;
        break;

      case 'reject':
        // Only reject verifications that can be rejected
        const rejectableVerifications = verifications.filter(v => 
          ['VERIFIED', 'REQUIRES_REVIEW', 'DISCREPANCY_FOUND'].includes(v.status)
        );

        if (rejectableVerifications.length === 0) {
          return Response.json(
            { success: false, error: 'No verifications available for rejection' },
            { status: 400 }
          );
        }

        await prisma.assetVerification.updateMany({
          where: {
            id: { in: rejectableVerifications.map(v => v.id) },
            campaignId,
          },
          data: {
            status: 'REJECTED',
            reviewedBy: userId,
            reviewedAt: new Date(),
            reviewNotes: reason || 'Bulk rejection',
          }
        });

        successCount = rejectableVerifications.length;
        break;

      case 'start':
        // Only start pending verifications
        const startableVerifications = verifications.filter(v => v.status === 'PENDING');

        if (startableVerifications.length === 0) {
          return Response.json(
            { success: false, error: 'No pending verifications to start' },
            { status: 400 }
          );
        }

        await prisma.assetVerification.updateMany({
          where: {
            id: { in: startableVerifications.map(v => v.id) },
            campaignId,
          },
          data: {
            status: 'IN_PROGRESS',
          }
        });

        successCount = startableVerifications.length;
        break;

      case 'complete':
        // Only complete in-progress verifications
        const completableVerifications = verifications.filter(v => v.status === 'IN_PROGRESS');

        if (completableVerifications.length === 0) {
          return Response.json(
            { success: false, error: 'No in-progress verifications to complete' },
            { status: 400 }
          );
        }

        await prisma.assetVerification.updateMany({
          where: {
            id: { in: completableVerifications.map(v => v.id) },
            campaignId,
          },
          data: {
            status: 'VERIFIED',
            verificationDate: new Date(),
          }
        });

        successCount = completableVerifications.length;
        break;

      default:
        return Response.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // For assign and unassign actions, perform the update
    if (['assign', 'unassign'].includes(action) && Object.keys(updateData).length > 0) {
      const result = await prisma.assetVerification.updateMany({
        where: {
          id: { in: verificationIds },
          campaignId,
        },
        data: updateData
      });

      successCount = result.count;
    }

    // Update campaign statistics if needed
    if (successCount > 0) {
      const stats = await prisma.assetVerification.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: { _all: true }
      });

      const totalVerifications = stats.reduce((sum, stat) => sum + stat._count._all, 0);
      const verifiedCount = stats
        .filter(stat => ['VERIFIED', 'APPROVED'].includes(stat.status))
        .reduce((sum, stat) => sum + stat._count._all, 0);

      const verificationProgress = totalVerifications > 0 
        ? Math.round((verifiedCount / totalVerifications) * 100)
        : 0;

      await prisma.verificationCampaign.update({
        where: { id: campaignId },
        data: {
          actualAssetCount: totalVerifications,
          verificationProgress,
        }
      });
    }

    return Response.json({
      success: true,
      data: {
        action,
        processedCount: successCount,
        totalRequested: verificationIds.length,
        errors: errorMessages.length > 0 ? errorMessages : undefined,
      },
      message: `Successfully ${action}ed ${successCount} verification${successCount !== 1 ? 's' : ''}`
    });

  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    return Response.json(
      { success: false, error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}