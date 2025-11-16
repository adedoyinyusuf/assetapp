import { NextRequest, NextResponse } from 'next/server';
import { stockVerificationConfig } from '@/config/stock-verification';
import prisma from '@/lib/prisma';

/**
 * Simple Stock Verification API Test Endpoint
 * GET /api/stock-verification - Returns module status and basic info
 */
export async function GET(request: NextRequest) {
  try {
    // Test database connection with a simple count query
    const campaignCount = await prisma.verificationCampaign.count();
    const userCount = await prisma.user.count();
    
    const response = {
      success: true,
      message: 'Stock Verification Module is active',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        campaigns: campaignCount,
        totalUsers: userCount,
      },
      features: {
        photoUpload: stockVerificationConfig.features.photoUpload,
        autoAssignment: stockVerificationConfig.features.autoAssignment,
        caching: stockVerificationConfig.performance.caching.enabled,
        notifications: stockVerificationConfig.notifications.enabled,
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
  } catch (error) {
    console.error('Stock Verification API Error:', error);
    
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