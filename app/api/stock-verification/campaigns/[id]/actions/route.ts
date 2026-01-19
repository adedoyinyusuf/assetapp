import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { CampaignService } from '@/lib/stock-verification/campaign-service'
import { z } from 'zod'
// import { redis } from '@/lib/redis'
const enabled = false // process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false'

// Initialize campaign service
const campaignService = new CampaignService()

// Action validation schema
const actionSchema = z.object({
  action: z.enum(['start', 'complete', 'pause', 'resume', 'cancel']),
})

// =============================================================================
// POST /api/stock-verification/campaigns/[id]/actions
// =============================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate campaign ID
    const campaignId = parseInt(params.id)
    if (isNaN(campaignId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid campaign ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate action
    const validationResult = actionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { action } = validationResult.data

    // Per-IP rate limiting for campaign actions
    /*
    if (enabled) {
      try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown'
        const limit = Number(process.env.SV_CAMPAIGN_ACTIONS_POST_RATE_LIMIT_PER_MINUTE || '60')
        const key = `sv:campaign:${campaignId}:actions:post:${ip}`
        const count = await redis.incr(key)
        await redis.expire(key, 60)
        if (count > limit) {
          return NextResponse.json(
            { success: false, error: 'Rate limit exceeded' },
            { status: 429 }
          )
        }
      } catch (_) { // skip if redis unavailable }
    }
    */

    // Get client info for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Execute the action
    let message = ''
    // Ensure numeric userId for service calls
    const userId = parseInt(String(session.user.id), 10)

    switch (action) {
      case 'start':
        await campaignService.startCampaign(campaignId, userId, ipAddress, userAgent)
        message = 'Campaign started successfully'
        break

      case 'complete':
        await campaignService.completeCampaign(campaignId, userId, ipAddress, userAgent)
        message = 'Campaign completed successfully'
        break

      case 'pause':
        await campaignService.pauseCampaign(campaignId, userId, ipAddress, userAgent)
        message = 'Campaign paused successfully'
        break

      case 'resume':
        await campaignService.resumeCampaign(campaignId, userId, ipAddress, userAgent)
        message = 'Campaign resumed successfully'
        break

      case 'cancel':
        await campaignService.deleteCampaign(campaignId, userId, ipAddress, userAgent)
        message = 'Campaign cancelled successfully'
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Validation failed' },
          { status: 400 }
        )
    }

    // Return latest campaign data in response
    const campaign = await campaignService.getCampaignById(campaignId, userId)
    return NextResponse.json({ success: true, message, data: campaign })
  } catch (error: any) {
    console.error(`Error executing campaign action:`, error)

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (error.code === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }

    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    if (error.code === 'CONFLICT') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to execute campaign action' },
      { status: 500 }
    )
  }
}