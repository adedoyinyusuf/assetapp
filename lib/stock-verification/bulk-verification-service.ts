import { AssetVerification, AssetVerificationStatus } from '@prisma/client';
import { BaseService, ValidationError, UnauthorizedError, NotFoundError } from './base-service';
import { VerificationService } from './verification-service';
import { z } from 'zod';

// =============================================================================
// BULK VERIFICATION SERVICE CLASS
// =============================================================================

export class BulkVerificationService extends BaseService {
  
  private verificationService: VerificationService;

  constructor() {
    super();
    this.verificationService = new VerificationService();
  }

  /**
   * Bulk create verifications for multiple assets
   */
  async bulkCreateVerifications(
    campaignId: number,
    assetIds: number[],
    userId: number,
    options?: {
      batchSize?: number;
      scheduledDate?: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<BulkOperationResult> {
    try {
      // Check permissions
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'create');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to create verifications');
      }

      const batchSize = options?.batchSize || 50;
      const results: BulkOperationResult = {
        total: assetIds.length,
        successful: 0,
        failed: 0,
        errors: [],
        successfulIds: [],
        failedIds: [],
      };

      // Process in batches to avoid overwhelming the system
      for (let i = 0; i < assetIds.length; i += batchSize) {
        const batch = assetIds.slice(i, i + batchSize);
        
        try {
          const verifications = await this.verificationService.createVerifications(
            {
              campaignId,
              assetIds: batch,
              scheduledDate: options?.scheduledDate,
              notes: options?.notes,
              metadata: options?.metadata,
            },
            userId,
            ipAddress,
            userAgent
          );

          results.successful += verifications.length;
          results.successfulIds.push(...verifications.map(v => v.assetId));
          
        } catch (error: any) {
          // Handle batch failures by trying individual assets
          for (const assetId of batch) {
            try {
              const verification = await this.verificationService.createVerifications(
                {
                  campaignId,
                  assetIds: [assetId],
                  scheduledDate: options?.scheduledDate,
                  notes: options?.notes,
                  metadata: options?.metadata,
                },
                userId,
                ipAddress,
                userAgent
              );
              results.successful += 1;
              results.successfulIds.push(assetId);
            } catch (individualError: any) {
              results.failed += 1;
              results.failedIds.push(assetId);
              results.errors.push({
                assetId,
                error: individualError.message,
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      this.handleError(error, 'BulkVerificationService.bulkCreateVerifications');
    }
  }

  /**
   * Bulk update verification status
   */
  async bulkUpdateStatus(
    verificationIds: number[],
    status: AssetVerificationStatus,
    userId: number,
    options?: {
      notes?: string;
      reviewNotes?: string;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<BulkOperationResult> {
    try {
      // Check permissions
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'update');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to update verifications');
      }

      const results: BulkOperationResult = {
        total: verificationIds.length,
        successful: 0,
        failed: 0,
        errors: [],
        successfulIds: [],
        failedIds: [],
      };

      // Process each verification individually to handle errors gracefully
      for (const verificationId of verificationIds) {
        try {
          await this.verificationService.updateVerification(
            verificationId,
            {
              status,
              notes: options?.notes,
              reviewNotes: options?.reviewNotes,
            },
            userId,
            ipAddress,
            userAgent
          );
          
          results.successful += 1;
          results.successfulIds.push(verificationId);
          
        } catch (error: any) {
          results.failed += 1;
          results.failedIds.push(verificationId);
          results.errors.push({
            verificationId,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      this.handleError(error, 'BulkVerificationService.bulkUpdateStatus');
    }
  }

  /**
   * Bulk approve verifications
   */
  async bulkApprove(
    verificationIds: number[],
    userId: number,
    reviewNotes?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<BulkOperationResult> {
    return this.bulkUpdateStatus(
      verificationIds,
      'APPROVED',
      userId,
      { reviewNotes },
      ipAddress,
      userAgent
    );
  }

  /**
   * Bulk reject verifications
   */
  async bulkReject(
    verificationIds: number[],
    userId: number,
    reviewNotes: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<BulkOperationResult> {
    return this.bulkUpdateStatus(
      verificationIds,
      'REJECTED',
      userId,
      { reviewNotes },
      ipAddress,
      userAgent
    );
  }

  /**
   * Generate verification assignments from asset list
   */
  async generateAssignmentsFromAssets(
    campaignId: number,
    assetFilters: {
      stateIds?: number[];
      lgaIds?: number[];
      categoryIds?: number[];
      search?: string;
    },
    userId: number
  ): Promise<AssetAssignmentPreview> {
    try {
      // Check permissions
      const hasPermission = await this.checkUserAccess(userId, 'campaign', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to access campaign assets');
      }

      // Build asset query
      const where: any = {};
      
      if (assetFilters.stateIds?.length) {
        where.stateId = { in: assetFilters.stateIds };
      }
      
      if (assetFilters.lgaIds?.length) {
        where.lgaId = { in: assetFilters.lgaIds };
      }
      
      if (assetFilters.categoryIds?.length) {
        where.categoryId = { in: assetFilters.categoryIds };
      }
      
      if (assetFilters.search) {
        where.OR = [
          { name: { contains: assetFilters.search, mode: 'insensitive' } },
          { description: { contains: assetFilters.search, mode: 'insensitive' } },
        ];
      }

      // Exclude assets already verified in this campaign
      where.verifications = {
        none: {
          campaignId,
          status: { in: ['VERIFIED', 'APPROVED'] },
        },
      };

      // Get matching assets
      const assets = await this.db.asset.findMany({
        where,
        include: {
          state: true,
          lga: true,
          category: true,
        },
        orderBy: [
          { stateId: 'asc' },
          { lgaId: 'asc' },
          { categoryId: 'asc' },
          { name: 'asc' },
        ],
      });

      // Group assets by location and category for assignment suggestions
      const byState = assets.reduce((acc, asset) => {
        const stateId = asset.stateId || 0;
        if (!acc[stateId]) {
          acc[stateId] = {
            state: asset.state,
            count: 0,
            assets: [],
            byLga: {},
          };
        }
        acc[stateId].count++;
        acc[stateId].assets.push(asset);
        
        const lgaId = asset.lgaId || 0;
        if (!acc[stateId].byLga[lgaId]) {
          acc[stateId].byLga[lgaId] = {
            lga: asset.lga,
            count: 0,
            assets: [],
          };
        }
        acc[stateId].byLga[lgaId].count++;
        acc[stateId].byLga[lgaId].assets.push(asset);
        
        return acc;
      }, {} as Record<number, any>);

      return {
        totalAssets: assets.length,
        byState,
        suggestedBatchSize: Math.min(Math.ceil(assets.length / 10), 100),
        assetIds: assets.map(a => a.id),
      };
    } catch (error) {
      this.handleError(error, 'BulkVerificationService.generateAssignmentsFromAssets');
    }
  }

  /**
   * Import verifications from CSV/Excel data
   */
  async importVerifications(
    campaignId: number,
    data: VerificationImportRow[],
    userId: number,
    options?: {
      skipDuplicates?: boolean;
      validateOnly?: boolean;
    },
    ipAddress?: string,
    userAgent?: string
  ): Promise<ImportResult> {
    try {
      // Check permissions
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'create');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to import verifications');
      }

      const results: ImportResult = {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0,
        importedRows: 0,
        errors: [],
        successful: [],
        skipped: [],
      };

      // Validate campaign exists
      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowIndex = i + 1;

        try {
          // Validate required fields
          if (!row.assetTag) {
            results.invalidRows++;
            results.errors.push({
              row: rowIndex,
              field: 'assetTag',
              error: 'Asset tag is required',
            });
            continue;
          }

          // Find asset by tag
          const asset = await this.db.asset.findFirst({
            where: { name: row.assetTag },
          });

          if (!asset) {
            results.invalidRows++;
            results.errors.push({
              row: rowIndex,
              field: 'assetTag',
              error: `Asset not found: ${row.assetTag}`,
            });
            continue;
          }

          // Check for existing verification
          if (options?.skipDuplicates) {
            const existing = await this.db.assetVerification.findFirst({
              where: {
                campaignId,
                assetId: asset.id,
                status: { in: ['VERIFIED', 'APPROVED'] },
              },
            });

            if (existing) {
              results.skippedRows++;
              results.skipped.push({
                row: rowIndex,
                assetTag: row.assetTag,
                reason: 'Asset already verified',
              });
              continue;
            }
          }

          results.validRows++;

          // If validation only, skip actual import
          if (options?.validateOnly) {
            continue;
          }

          // Create verification
          const verification = await this.verificationService.createVerifications(
            {
              campaignId,
              assetIds: [asset.id],
              notes: row.notes,
              scheduledDate: row.scheduledDate,
              metadata: {
                importedRow: rowIndex,
                originalData: row,
              },
            },
            userId,
            ipAddress,
            userAgent
          );

          results.importedRows++;
          results.successful.push({
            row: rowIndex,
            assetTag: row.assetTag,
            verificationId: verification[0].id,
          });

        } catch (error: any) {
          results.invalidRows++;
          results.errors.push({
            row: rowIndex,
            field: 'general',
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      this.handleError(error, 'BulkVerificationService.importVerifications');
    }
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    assetId?: number;
    verificationId?: number;
    error: string;
  }>;
  successfulIds: number[];
  failedIds: number[];
}

export interface AssetAssignmentPreview {
  totalAssets: number;
  byState: Record<number, {
    state: any;
    count: number;
    assets: any[];
    byLga: Record<number, {
      lga: any;
      count: number;
      assets: any[];
    }>;
  }>;
  suggestedBatchSize: number;
  assetIds: number[];
}

export interface VerificationImportRow {
  assetTag: string;
  notes?: string;
  scheduledDate?: string;
  physicalCondition?: string;
  functionalStatus?: string;
  location?: string;
  coordinates?: any;
}

export interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  importedRows: number;
  errors: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  successful: Array<{
    row: number;
    assetTag: string;
    verificationId: number;
  }>;
  skipped: Array<{
    row: number;
    assetTag: string;
    reason: string;
  }>;
}