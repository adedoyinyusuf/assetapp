import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma.server';

// =============================================================================
// BASE SERVICE CLASS
// =============================================================================

export abstract class BaseService {
  protected db: PrismaClient;

  constructor(database?: PrismaClient) {
    this.db = database || prisma;
  }

  /**
   * Generic pagination helper
   */
  protected createPagination(page: number, limit: number, total: number) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }

  /**
   * Generic sorting helper
   */
  protected createOrderBy(sortBy: string, sortOrder: 'asc' | 'desc') {
    return {
      [sortBy]: sortOrder,
    };
  }

  /**
   * Generic date range filter
   */
  protected createDateRangeFilter(
    dateFrom?: string,
    dateTo?: string,
    fieldName: string = 'createdAt'
  ) {
    const filter: any = {};

    if (dateFrom || dateTo) {
      filter[fieldName] = {};
      if (dateFrom) filter[fieldName].gte = new Date(dateFrom);
      if (dateTo) filter[fieldName].lte = new Date(dateTo);
    }

    return filter;
  }

  /**
   * Generic search filter for text fields
   */
  protected createSearchFilter(search?: string, fields: string[] = ['name']) {
    if (!search) return {};

    return {
      OR: fields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive' as const,
        },
      })),
    };
  }

  /**
   * Generic array filter helper
   */
  protected createArrayFilter<T>(values?: T[], fieldName: string = 'id') {
    if (!values || values.length === 0) return {};

    return {
      [fieldName]: {
        in: values,
      },
    };
  }

  /**
   * Generic user access check
   */
  protected async checkUserAccess(userId: number, resource: string, action: string): Promise<boolean> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.isActive) return false;

      // Super Admin and Admin bypass - they have all permissions
      const roleName = user.role?.name?.toUpperCase();
      if (roleName && ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'].includes(roleName)) {
        return true;
      }

      // Check if user has the required permission
      const hasPermission = user.role?.permissions?.some(rp =>
        rp.permission.resource === resource &&
        rp.permission.action === action
      );

      return hasPermission || false;
    } catch (error) {
      console.error('checkUserAccess Error:', error);
      return false;
    }
  }

  /**
   * Build access filter for user based on campaign assignments
   */
  protected async buildUserAccessFilter(userId: number, resource: 'verification' | 'discrepancy'): Promise<any> {
    try {
      // Fetch user with role and geographic constraints
      // Using 'as any' casting to bypass Type error until restart
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          role: {
            select: {
              name: true,
            },
          },
          stateId: true,
          lgaId: true,
        },
      } as any) as any;

      if (!user) return { campaignId: { in: [] } }; // Fail closed

      const roleName = user.role.name.toUpperCase();

      // 1. SUPER_ADMIN is always global
      if (['SUPER_ADMIN', 'SUPERADMIN'].includes(roleName)) {
        return {};
      }

      // 2. Managerial/supervisory roles depend on Geographic Scope
      // Includes: ADMIN (National/State), MANAGER, TEAM_LEADER, SUPERVISOR, AUDITOR, OBSERVER
      const managerialRoles = [
        'ADMIN', 'MANAGER', 'TEAM_LEADER', 'SUPERVISOR', 'AUDITOR', 'OPERATOR',
        'QUALITY_CONTROLLER', 'OBSERVER'
      ];

      if (managerialRoles.includes(roleName)) {
        // Construct Geographic Filter based on User's scope
        let geoFilter: any = {};

        // Scope Priority: LGA > State > National (None)
        if (user.lgaId) {
          // Locked to LGA
          // For Verifications: asset.lgaId = user.lgaId
          // For Discrepancies: verification.asset.lgaId = user.lgaId
          geoFilter = resource === 'verification'
            ? { asset: { lgaId: user.lgaId } }
            : { verification: { asset: { lgaId: user.lgaId } } };

          return geoFilter;
        }
        else if (user.stateId) {
          // Locked to State
          geoFilter = resource === 'verification'
            ? { asset: { stateId: user.stateId } }
            : { verification: { asset: { stateId: user.stateId } } };

          return geoFilter;
        }
        else {
          // No State/LGA ID = National/Global View for these roles
          return {};
        }
      }

      // 3. For Field Roles (VERIFIERS, etc.), rely on Explicit Assignments
      // This ensures they only see what is specifically assigned to them in a campaign
      const assignments = await this.db.verificationAssignment.findMany({
        where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
        select: { campaignId: true },
        take: 1000,
      });

      const campaignIds = assignments.map(a => a.campaignId);

      if (campaignIds.length === 0) {
        return resource === 'verification'
          ? { campaignId: { in: [] } }
          : { verification: { campaignId: { in: [] } } };
      }

      return resource === 'verification'
        ? { campaignId: { in: campaignIds } }
        : { verification: { campaignId: { in: campaignIds } } };

    } catch (error) {
      console.error('Error building user access filter:', error);
      return resource === 'verification'
        ? { campaignId: { in: [] } }
        : { verification: { campaignId: { in: [] } } };
    }
  }

  /**
   * Generic audit log creation
   */
  protected async createAuditLog(
    userId: number,
    action: string,
    entityType: string,
    entityId: number,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await this.db.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          oldValues: oldValues !== undefined ? oldValues : undefined,
          newValues: newValues !== undefined ? newValues : undefined,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Generic error handler
   */
  protected handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error);

    // Preserve custom service errors with codes
    if (error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof ConflictError ||
      error instanceof BusinessLogicError) {
      throw error; // rethrow as-is to keep error.code and type
    }

    // Map common Prisma errors to readable messages
    if (error?.code === 'P2002') {
      throw new ConflictError('A record with this information already exists');
    }

    if (error?.code === 'P2025') {
      throw new NotFoundError('Record not found');
    }

    if (error?.code === 'P2003') {
      throw new ValidationError('Invalid reference to related record');
    }

    // Fallback generic error
    throw new Error(`Operation failed: ${error?.message || 'Unknown error'}`);
  }

  /**
   * Validate entity exists
   */
  protected async validateEntityExists(
    model: string,
    id: number,
    errorMessage: string = 'Record not found'
  ): Promise<void> {
    const record = await (this.db as any)[model].findUnique({
      where: { id },
    });

    if (!record) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate multiple entities exist
   */
  protected async validateEntitiesExist(
    model: string,
    ids: number[],
    errorMessage: string = 'One or more records not found'
  ): Promise<void> {
    if (ids.length === 0) return;

    const records = await (this.db as any)[model].findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (records.length !== ids.length) {
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a paginated response with data and pagination metadata
   */
  protected createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    return {
      data,
      pagination: this.createPagination(page, limit, total),
    };
  }

  /**
   * Build orderBy clause for common sort fields across services
   */
  protected buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): any | undefined {
    const order = sortOrder || 'desc';
    switch (sortBy) {
      // Discrepancy sorting
      case 'createdAt':
        return { createdAt: order };
      case 'severity':
        return { severity: order };
      case 'dueDate':
        return { dueDate: order };
      case 'status':
        return { status: order };

      // Verification sorting
      case 'verificationDate':
        return { verificationDate: order };
      case 'assetName':
        // Sort by related Asset.name
        return { asset: { name: order } } as any;

      default:
        return undefined;
    }
  }
}

// =============================================================================
// RESPONSE INTERFACES
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface BulkResponse<T> {
  success: boolean;
  data: T[];
  errors: Array<{
    index: number;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

// =============================================================================
// ERROR CLASSES
// =============================================================================

export class ValidationError extends Error {
  public code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  public code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  public code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized access', public details?: any) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends Error {
  public code = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class BusinessLogicError extends Error {
  public code = 'BUSINESS_LOGIC_ERROR';

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(error: string, code?: string): ServiceResponse<never> {
  return {
    success: false,
    error,
    code,
  };
}

export function createBulkResponse<T>(
  data: T[],
  errors: Array<{ index: number; error: string }>
): BulkResponse<T> {
  return {
    success: errors.length === 0,
    data,
    errors,
    totalProcessed: data.length + errors.length,
    successCount: data.length,
    errorCount: errors.length,
  };
}