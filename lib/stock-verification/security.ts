import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// import { stockVerificationConfig } from '@/lib/config/stock-verification'; // Temporarily disabled
import { stockVerificationLogger } from './logging';
import { redis } from '@/lib/redis';
import crypto from 'crypto';

/**
 * Security utilities and middleware for Stock Verification Module
 * Handles authentication, authorization, rate limiting, and security logging
 */

// Permission levels for Stock Verification
export enum StockVerificationPermission {
  READ = 'stock_verification:read',
  WRITE = 'stock_verification:write',
  ADMIN = 'stock_verification:admin',

  // Campaign specific permissions
  CAMPAIGN_CREATE = 'stock_verification:campaign:create',
  CAMPAIGN_MANAGE = 'stock_verification:campaign:manage',
  CAMPAIGN_DELETE = 'stock_verification:campaign:delete',

  // Verification specific permissions
  VERIFICATION_PERFORM = 'stock_verification:verification:perform',
  VERIFICATION_REVIEW = 'stock_verification:verification:review',
  VERIFICATION_APPROVE = 'stock_verification:verification:approve',

  // Discrepancy specific permissions
  DISCREPANCY_VIEW = 'stock_verification:discrepancy:view',
  DISCREPANCY_MANAGE = 'stock_verification:discrepancy:manage',
  DISCREPANCY_RESOLVE = 'stock_verification:discrepancy:resolve',

  // Reporting permissions
  REPORTS_VIEW = 'stock_verification:reports:view',
  REPORTS_EXPORT = 'stock_verification:reports:export',

  // System permissions
  SYSTEM_SETTINGS = 'stock_verification:system:settings',
  USER_MANAGEMENT = 'stock_verification:users:manage',
}

// Role definitions
export const StockVerificationRoles = {
  VERIFIER: {
    name: 'Stock Verifier',
    permissions: [
      StockVerificationPermission.READ,
      StockVerificationPermission.VERIFICATION_PERFORM,
      StockVerificationPermission.DISCREPANCY_VIEW,
    ]
  },
  SUPERVISOR: {
    name: 'Verification Supervisor',
    permissions: [
      StockVerificationPermission.READ,
      StockVerificationPermission.WRITE,
      StockVerificationPermission.VERIFICATION_PERFORM,
      StockVerificationPermission.VERIFICATION_REVIEW,
      StockVerificationPermission.DISCREPANCY_VIEW,
      StockVerificationPermission.DISCREPANCY_MANAGE,
      StockVerificationPermission.REPORTS_VIEW,
    ]
  },
  MANAGER: {
    name: 'Verification Manager',
    permissions: [
      StockVerificationPermission.READ,
      StockVerificationPermission.WRITE,
      StockVerificationPermission.CAMPAIGN_CREATE,
      StockVerificationPermission.CAMPAIGN_MANAGE,
      StockVerificationPermission.VERIFICATION_PERFORM,
      StockVerificationPermission.VERIFICATION_REVIEW,
      StockVerificationPermission.VERIFICATION_APPROVE,
      StockVerificationPermission.DISCREPANCY_VIEW,
      StockVerificationPermission.DISCREPANCY_MANAGE,
      StockVerificationPermission.DISCREPANCY_RESOLVE,
      StockVerificationPermission.REPORTS_VIEW,
      StockVerificationPermission.REPORTS_EXPORT,
    ]
  },
  ADMIN: {
    name: 'Stock Verification Admin',
    permissions: [
      ...Object.values(StockVerificationPermission)
    ]
  }
};

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5, skipSuccessfulRequests: true },
  upload: { windowMs: 60 * 1000, maxRequests: 10 },
  campaign: { windowMs: 60 * 1000, maxRequests: 20 },
  verification: { windowMs: 60 * 1000, maxRequests: 50 },
  reports: { windowMs: 60 * 1000, maxRequests: 10 },
};

// Security context for requests
export interface SecurityContext {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: StockVerificationPermission[];
  ipAddress: string;
  userAgent: string;
  requestId: string;
}

/**
 * Authentication middleware
 */
export async function requireAuthentication(request: NextRequest): Promise<SecurityContext | null> {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      await stockVerificationLogger.logSecurityEvent(
        'authentication_failed',
        'medium',
        {
          requestId: request.headers.get('x-request-id') || generateRequestId(),
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      );
      return null;
    }

    // Get user roles and permissions
    const userRoles = await getUserRoles(session.user.id);
    const permissions = getUserPermissions(userRoles);

    const securityContext: SecurityContext = {
      userId: session.user.id,
      sessionId: session.user.id, // In a real app, this would be a session ID
      roles: userRoles,
      permissions,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      requestId: request.headers.get('x-request-id') || generateRequestId(),
    };

    await stockVerificationLogger.logSecurityEvent(
      'authentication_success',
      'low',
      {
        userId: securityContext.userId,
        requestId: securityContext.requestId,
        ipAddress: securityContext.ipAddress,
      }
    );

    return securityContext;
  } catch (error) {
    await stockVerificationLogger.logSecurityEvent(
      'authentication_error',
      'high',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: request.headers.get('x-request-id') || generateRequestId(),
        ipAddress: getClientIP(request),
      }
    );
    return null;
  }
}

/**
 * Authorization middleware
 */
export function requirePermission(permission: StockVerificationPermission) {
  return (context: SecurityContext): boolean => {
    const hasPermission = context.permissions.includes(permission);

    if (!hasPermission) {
      stockVerificationLogger.logSecurityEvent(
        'authorization_failed',
        'medium',
        {
          userId: context.userId,
          requestId: context.requestId,
          requiredPermission: permission,
          userPermissions: context.permissions,
        }
      );
    }

    return hasPermission;
  };
}

/**
 * Rate limiting middleware
 */
export async function applyRateLimit(
  request: NextRequest,
  context: SecurityContext,
  limitType: string = 'default'
): Promise<boolean> {
  // if (stockVerificationConfig.security.rateLimiting.enabled === false) { 
  if (false) { // Rate limiting temporarily disabled
    return true;
  }

  const config = RATE_LIMITS[limitType] || RATE_LIMITS.default;
  const key = `rate_limit:${limitType}:${context.userId}:${context.ipAddress}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
    }

    if (current > config.maxRequests) {
      await stockVerificationLogger.logSecurityEvent(
        'rate_limit_exceeded',
        'high',
        {
          userId: context.userId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          limitType,
          currentCount: current,
          maxRequests: config.maxRequests,
        }
      );
      return false;
    }

    return true;
  } catch (error) {
    // If Redis is down, allow the request but log the error
    await stockVerificationLogger.error(
      'Rate limiting failed - allowing request',
      error as Error,
      { userId: context.userId, requestId: context.requestId }
    );
    return true;
  }
}

/**
 * Input validation and sanitization
 */
export class InputValidator {
  // Validate campaign data
  static validateCampaignInput(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
      errors.push('Campaign name is required and must be a string');
    } else if (data.name.length > 255) {
      errors.push('Campaign name must be less than 255 characters');
    }

    if (data.description && data.description.length > 2000) {
      errors.push('Campaign description must be less than 2000 characters');
    }

    if (!data.startDate || !isValidDate(data.startDate)) {
      errors.push('Valid start date is required');
    }

    if (!data.endDate || !isValidDate(data.endDate)) {
      errors.push('Valid end date is required');
    } else if (new Date(data.endDate) <= new Date(data.startDate)) {
      errors.push('End date must be after start date');
    }

    return { valid: errors.length === 0, errors };
  }

  // Validate verification data
  static validateVerificationInput(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.assetId || typeof data.assetId !== 'string') {
      errors.push('Asset ID is required');
    }

    if (!data.status || !['VERIFIED', 'NOT_FOUND', 'DAMAGED'].includes(data.status)) {
      errors.push('Valid status is required');
    }

    if (data.notes && data.notes.length > 1000) {
      errors.push('Notes must be less than 1000 characters');
    }

    return { valid: errors.length === 0, errors };
  }

  // Sanitize HTML content
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate file uploads
  static validateFileUpload(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = stockVerificationConfig.upload;

    if (file.size > config.maxFileSize) {
      errors.push(`File size must be less than ${config.maxFileSize} bytes`);
    }

    if (!config.allowedMimeTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }

    return { valid: errors.length === 0, errors };
  }
}

/**
 * Encryption utilities
 */
export class EncryptionUtil {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;
  private static readonly ivLength = 16;
  private static readonly tagLength = 16;

  static encrypt(text: string, key: string): string {
    const keyBuffer = crypto.scryptSync(key, 'salt', EncryptionUtil.keyLength);
    const iv = crypto.randomBytes(EncryptionUtil.ivLength);
    const cipher = crypto.createCipher(EncryptionUtil.algorithm, keyBuffer);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = (cipher as any).getAuthTag();

    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string, key: string): string {
    const keyBuffer = crypto.scryptSync(key, 'salt', EncryptionUtil.keyLength);
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(EncryptionUtil.algorithm, keyBuffer);
    (decipher as any).setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

/**
 * Security audit logging
 */
export async function logSecurityAudit(
  action: string,
  resourceType: string,
  resourceId: string,
  context: SecurityContext,
  changes?: Record<string, any>
): Promise<void> {
  await stockVerificationLogger.logAudit(
    action,
    resourceType,
    resourceId,
    context.userId,
    changes,
    {
      sessionId: context.sessionId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    }
  );
}

/**
 * Content Security Policy headers
 */
export function getCSPHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'self'",
      "worker-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

// Utility functions
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

async function getUserRoles(userId: string): Promise<string[]> {
  // This would typically fetch from database
  // For now, return default roles
  return ['VERIFIER'];
}

function getUserPermissions(roles: string[]): StockVerificationPermission[] {
  const permissions: StockVerificationPermission[] = [];

  roles.forEach(role => {
    const roleConfig = StockVerificationRoles[role as keyof typeof StockVerificationRoles];
    if (roleConfig) {
      permissions.push(...roleConfig.permissions);
    }
  });

  return [...new Set(permissions)];
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(
  requiredPermission?: StockVerificationPermission,
  rateLimitType?: string
) {
  return async (request: NextRequest) => {
    // Apply security headers
    const securityHeaders = getCSPHeaders();

    // Require authentication
    const context = await requireAuthentication(request);
    if (!context) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Check permissions if required
    if (requiredPermission && !requirePermission(requiredPermission)(context)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Apply rate limiting
    if (rateLimitType && !(await applyRateLimit(request, context, rateLimitType))) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders }
      );
    }

    // Add security context to request
    (request as any).securityContext = context;

    return NextResponse.next({
      headers: securityHeaders
    });
  };
}