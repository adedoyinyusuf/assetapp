import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { stockVerificationConfig } from '../../../config/stock-verification';
import prisma from '@/lib/prisma';

/**
 * Simple Stock Verification API Test Endpoint
 * GET /api/stock-verification - Returns module status and basic info
 */

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[API stock-verification] Request received');
  try {
    // Timeout Promise
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms));

    // Test database connection with a simple count query
    console.log('[API stock-verification] Checking DB connection...');
    const dbCheckPromise = Promise.all([
      prisma.verificationCampaign.count(),
      prisma.user.count()
    ]);

    // Race DB check against 5s timeout
    const [campaignCount, userCount] = await Promise.race([
      dbCheckPromise,
      timeout(5000)
    ]) as [number, number];

    console.log('[API stock-verification] DB Connected. Campaigns:', campaignCount, 'Users:', userCount);

    // Get current user session for context
    const session = await getServerSession(authOptions);
    let userContext = null;

    if (session?.user?.email) {
      try {
        console.log('[API stock-verification] Fetching user context for:', session.user.email);
        const userPromise = prisma.user.findUnique({
          where: { email: session.user.email },
          include: { state: true, lga: true, role: true } as any
        });

        const user = await Promise.race([userPromise, timeout(5000)]) as any;

        if (user) {
          const userAny = user as any;
          userContext = {
            role: userAny.role.name,
            firstName: userAny.firstName,
            lastName: userAny.lastName,
            scope: userAny.lgaId ? 'LGA' : (userAny.stateId ? 'STATE' : 'NATIONAL'),
            location: userAny.lga ? `${userAny.lga.name}, ${userAny.state?.name}` : (userAny.state ? userAny.state.name : 'National HQ'),
            stateId: userAny.stateId,
            lgaId: userAny.lgaId
          };
        }
      } catch (err) {
        console.warn('[API stock-verification] Failed to fetch user context details:', err);
        // Continue without userContext if fetch fails (e.g. schema mismatch)
      }
    }

    const response = {
      success: true,
      message: 'Stock Verification Module is active',
      timestamp: new Date().toISOString(),
      userContext,
      version: '1.1.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        campaigns: campaignCount,
        totalUsers: userCount,
      },
      features: {
        photoUpload: stockVerificationConfig?.features?.photoUpload ?? false,
        autoAssignment: stockVerificationConfig?.features?.autoAssignment ?? false,
        caching: stockVerificationConfig?.performance?.caching?.enabled ?? false,
        notifications: stockVerificationConfig?.notifications?.enabled ?? false,
      },
      endpoints: {
        health: '/api/stock-verification/health',
        campaigns: '/api/stock-verification/campaigns',
        verifications: '/api/stock-verification/verifications',
        discrepancies: '/api/stock-verification/discrepancies',
        reports: '/api/stock-verification/reports',
      },
      ui: {
        dashboard: '/stock-verification',
        campaigns: '/stock-verification/campaigns',
        verifications: '/stock-verification/verifications',
        reports: '/stock-verification/reports',
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[API stock-verification] Fatal Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Stock Verification Module encountered an error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
        }
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}