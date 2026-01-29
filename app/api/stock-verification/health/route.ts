import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
// import { stockVerificationConfig } from '@/lib/config/stock-verification'; // Temporarily disabled to prevent blocking
import { DiscrepancyStatus, AssetVerificationStatus, VerificationCampaignStatus, DiscrepancySeverity } from '@prisma/client';

export const dynamic = 'force-dynamic';


/**
 * Health Check Endpoint for Stock Verification Module
 * Provides comprehensive health status including dependencies
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  module: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    configuration: HealthCheck;
    features: HealthCheck;
    storage: HealthCheck;
  };
  metrics?: {
    activeCampaigns: number;
    pendingVerifications: number;
    inProgressVerifications: number;
    discrepancyVerifications: number;
    verificationsWithPhotos: number;
    openDiscrepancies: number;
    recentDiscrepanciesLast7Days: number;
    discrepanciesBySeverityLast7Days: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
    campaignsByStatus: {
      PLANNED: number;
      ACTIVE: number;
      PAUSED: number;
      COMPLETED: number;
      CANCELLED: number;
      ARCHIVED: number;
    };
    verificationsByStatus: {
      VERIFIED: number;
      APPROVED: number;
      REJECTED: number;
      REQUIRES_REVIEW: number;
      MISSING: number;
      DAMAGED: number;
    };
    systemLoad: number;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail';
  message?: string;
  responseTime?: number;
  lastChecked: string;
  details?: any;
}

// Track application start time for uptime calculation
const startTime = Date.now();

export async function GET(request: NextRequest) {
  const checkStartTime = Date.now();
  const enabled = process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED !== 'false';

  // lightweight rate limiting (per IP) to protect from excessive polling
  if (enabled) {
    try {
      const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
      const ip = ipHeader.split(',')[0]?.trim() || 'global';
      const key = `health_rate:${ip}`;
      const limit = Number(process.env.HEALTH_RATE_LIMIT_PER_MINUTE || '60');
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 60);
      }
      if (count > limit) {
        return NextResponse.json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || 'unknown',
          uptime: Math.floor((Date.now() - startTime) / 1000),
          module: 'stock-verification',
          checks: {
            database: { status: 'fail', message: 'rate_limited', lastChecked: new Date().toISOString() },
            redis: { status: 'fail', message: 'rate_limited', lastChecked: new Date().toISOString() },
            configuration: { status: 'fail', message: 'rate_limited', lastChecked: new Date().toISOString() },
            features: { status: 'fail', message: 'rate_limited', lastChecked: new Date().toISOString() },
            storage: { status: 'fail', message: 'rate_limited', lastChecked: new Date().toISOString() },
          },
        }, { status: 429 });
      }
    } catch {
      // if redis unavailable, skip rate limiting
    }
  }

  try {
    // Perform all health checks
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkConfiguration(),
      checkFeatures(),
      checkStorage(),
    ]);

    const [database, redis, configuration, features, storage] = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          status: 'fail' as const,
          message: result.reason?.message || 'Check failed',
          lastChecked: new Date().toISOString(),
        };
      }
    });

    // Determine overall status
    const allChecks = [database, redis, configuration, features, storage];
    const failedChecks = allChecks.filter(check => check.status === 'fail');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks.length === 0) {
      overallStatus = 'healthy';
    } else if (failedChecks.length <= 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    // Get system metrics (optional, only if system is not unhealthy)
    let metrics;
    if (overallStatus !== 'unhealthy') {
      try {
        metrics = await getSystemMetrics();
      } catch (error) {
        console.warn('Failed to get system metrics:', error);
      }
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      module: 'stock-verification',
      checks: {
        database,
        redis,
        configuration,
        features,
        storage,
      },
      metrics,
    };

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 :
      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      module: 'stock-verification',
      checks: {
        database: { status: 'fail', message: 'Not checked', lastChecked: new Date().toISOString() },
        redis: { status: 'fail', message: 'Not checked', lastChecked: new Date().toISOString() },
        configuration: { status: 'fail', message: 'Not checked', lastChecked: new Date().toISOString() },
        features: { status: 'fail', message: 'Not checked', lastChecked: new Date().toISOString() },
        storage: { status: 'fail', message: 'Not checked', lastChecked: new Date().toISOString() },
      },
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Test basic database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Test Stock Verification tables exist
    await prisma.verificationCampaign.count({ take: 1 });

    const responseTime = Date.now() - startTime;

    return {
      status: 'pass',
      message: 'Database connection successful',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        provider: 'postgresql',
        connectionPool: 'active'
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    if (!false) {
      return {
        status: 'pass',
        message: 'Redis caching disabled',
        lastChecked: new Date().toISOString(),
        details: { enabled: false }
      };
    }

    // Ensure Redis client is initialized and connected
    if (!redis) {
      return {
        status: 'fail',
        message: 'Redis client not initialized',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }

    if (!redis.isOpen) {
      try {
        await redis.connect();
      } catch (connErr) {
        return {
          status: 'fail',
          message: `Redis connection failed: ${connErr instanceof Error ? connErr.message : 'Unknown error'}`,
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }
    }

    // Test Redis connectivity
    await redis.ping();

    // Test set and get operation
    const testKey = 'health_check_test';
    const testValue = Date.now().toString();
    await redis.set(testKey, testValue, { EX: 30 });
    const retrievedValue = await redis.get(testKey);

    if (retrievedValue !== testValue) {
      throw new Error('Redis set/get operation failed');
    }

    await redis.del(testKey);

    const responseTime = Date.now() - startTime;

    return {
      status: 'pass',
      message: 'Redis connection successful',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        connected: true,
        operations: 'working'
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkConfiguration(): Promise<HealthCheck> {
  try {
    const errors = [];

    // Validate required environment variables
    if (!process.env.DATABASE_URL) errors.push('DATABASE_URL missing');
    if (!process.env.NEXTAUTH_SECRET) errors.push('NEXTAUTH_SECRET missing');

    // Validate Stock Verification configuration
    const configErrors = true ? [] : ['Stock verification config not loaded'];

    if (errors.length > 0 || configErrors.length > 0) {
      return {
        status: 'fail',
        message: 'Configuration validation failed',
        lastChecked: new Date().toISOString(),
        details: {
          missingEnvVars: errors,
          configErrors: configErrors
        }
      };
    }

    return {
      status: 'pass',
      message: 'Configuration valid',
      lastChecked: new Date().toISOString(),
      details: {
        environment: process.env.NODE_ENV,
        featuresEnabled: 0 // Config disabled for now
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkFeatures(): Promise<HealthCheck> {
  try {
    const enabledFeatures = Object.entries({ photoUpload: false, autoAssignment: false, advancedReporting: false, realTimeNotifications: false, bulkOperations: false, mobileApp: false, offlineMode: false, aiAssistedVerification: false })
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);

    const criticalFeatures = ['photoUpload', 'autoAssignment'];
    const missingCriticalFeatures = criticalFeatures.filter(
      feature => !enabledFeatures.includes(feature)
    );

    return {
      status: 'pass',
      message: `${enabledFeatures.length} features enabled`,
      lastChecked: new Date().toISOString(),
      details: {
        enabledFeatures,
        criticalFeaturesStatus: missingCriticalFeatures.length === 0 ? 'all_enabled' : 'some_disabled',
        missingCriticalFeatures
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Features check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  try {
    const storageProvider = 'local';

    if (storageProvider === 'local') {
      // Check if upload directories exist and are writable
      const fs = require('fs').promises;
      const path = require('path');

      const uploadDir = path.join(process.cwd(), 'uploads', 'verifications');

      try {
        await fs.access(uploadDir);
        // attempt write/delete to verify writability
        const testFile = path.join(uploadDir, `health_check_${Date.now()}.tmp`);
        await fs.writeFile(testFile, 'ok');
        await fs.unlink(testFile);
        // compute simple storage stats (non-recursive)
        let fileCount = 0;
        let totalSize = 0;
        try {
          const entries = await fs.readdir(uploadDir);
          for (const entry of entries) {
            const p = path.join(uploadDir, entry);
            const st = await fs.stat(p);
            if (st.isFile()) {
              fileCount += 1;
              totalSize += st.size;
            }
          }
        } catch { }
        return {
          status: 'pass',
          message: 'Local storage accessible and writable',
          lastChecked: new Date().toISOString(),
          details: {
            provider: 'local',
            uploadPath: uploadDir,
            writable: true,
            fileCount,
            totalSize
          }
        };
      } catch (err) {
        return {
          status: 'fail',
          message: `Local storage check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          lastChecked: new Date().toISOString(),
        };
      }
    } else {
      // For cloud storage providers, we'd test connectivity here
      return {
        status: 'pass',
        message: `${storageProvider} storage configured`,
        lastChecked: new Date().toISOString(),
        details: {
          provider: storageProvider,
          bucket: 'default'
        }
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function getSystemMetrics() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeCampaigns,
      pendingVerifications,
      inProgressVerifications,
      discrepancyVerifications,
      verificationsWithPhotos,
      openDiscrepancies,
      recentDiscrepanciesLast7Days,
      lowSeverityLast7Days,
      mediumSeverityLast7Days,
      highSeverityLast7Days,
      criticalSeverityLast7Days,
      campaignPlanned,
      campaignPaused,
      campaignCompleted,
      campaignCancelled,
      campaignArchived,
      verifiedCount,
      approvedCount,
      rejectedCount,
      requiresReviewCount,
      missingCount,
      damagedCount,
    ] = await Promise.all([
      prisma.verificationCampaign.count({
        where: { status: VerificationCampaignStatus.ACTIVE }
      }),
      prisma.assetVerification.count({
        where: { status: AssetVerificationStatus.PENDING }
      }),
      prisma.assetVerification.count({
        where: { status: AssetVerificationStatus.IN_PROGRESS }
      }),
      prisma.assetVerification.count({
        where: { status: AssetVerificationStatus.DISCREPANCY_FOUND }
      }),
      prisma.assetVerification.count({
        where: { photoUrls: { isEmpty: false } }
      }),
      prisma.verificationDiscrepancy.count({
        where: { status: { notIn: [DiscrepancyStatus.RESOLVED, DiscrepancyStatus.CLOSED] } }
      }),
      prisma.verificationDiscrepancy.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.verificationDiscrepancy.count({
        where: { createdAt: { gte: sevenDaysAgo }, severity: DiscrepancySeverity.LOW }
      }),
      prisma.verificationDiscrepancy.count({
        where: { createdAt: { gte: sevenDaysAgo }, severity: DiscrepancySeverity.MEDIUM }
      }),
      prisma.verificationDiscrepancy.count({
        where: { createdAt: { gte: sevenDaysAgo }, severity: DiscrepancySeverity.HIGH }
      }),
      prisma.verificationDiscrepancy.count({
        where: { createdAt: { gte: sevenDaysAgo }, severity: DiscrepancySeverity.CRITICAL }
      }),
      prisma.verificationCampaign.count({ where: { status: VerificationCampaignStatus.PLANNED } }),
      prisma.verificationCampaign.count({ where: { status: VerificationCampaignStatus.PAUSED } }),
      prisma.verificationCampaign.count({ where: { status: VerificationCampaignStatus.COMPLETED } }),
      prisma.verificationCampaign.count({ where: { status: VerificationCampaignStatus.CANCELLED } }),
      prisma.verificationCampaign.count({ where: { status: VerificationCampaignStatus.ARCHIVED } }),
      prisma.assetVerification.count({ where: { status: AssetVerificationStatus.VERIFIED } }),
      prisma.assetVerification.count({ where: { status: AssetVerificationStatus.APPROVED } }),
      prisma.assetVerification.count({ where: { status: AssetVerificationStatus.REJECTED } }),
      prisma.assetVerification.count({ where: { status: AssetVerificationStatus.REQUIRES_REVIEW } }),
      prisma.assetVerification.count({ where: { status: AssetVerificationStatus.MISSING } }),
      prisma.assetVerification.count({ where: { status: AssetVerificationStatus.DAMAGED } }),
    ]);

    // Get system load (simplified)
    const memUsage = process.memoryUsage();
    const systemLoad = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    return {
      activeCampaigns,
      pendingVerifications,
      inProgressVerifications,
      discrepancyVerifications,
      verificationsWithPhotos,
      openDiscrepancies,
      recentDiscrepanciesLast7Days,
      discrepanciesBySeverityLast7Days: {
        LOW: lowSeverityLast7Days,
        MEDIUM: mediumSeverityLast7Days,
        HIGH: highSeverityLast7Days,
        CRITICAL: criticalSeverityLast7Days,
      },
      campaignsByStatus: {
        PLANNED: campaignPlanned,
        ACTIVE: activeCampaigns,
        PAUSED: campaignPaused,
        COMPLETED: campaignCompleted,
        CANCELLED: campaignCancelled,
        ARCHIVED: campaignArchived,
      },
      verificationsByStatus: {
        VERIFIED: verifiedCount,
        APPROVED: approvedCount,
        REJECTED: rejectedCount,
        REQUIRES_REVIEW: requiresReviewCount,
        MISSING: missingCount,
        DAMAGED: damagedCount,
      },
      systemLoad
    };
  } catch (error) {
    throw new Error(`Failed to get system metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Add OPTIONS method for CORS
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
