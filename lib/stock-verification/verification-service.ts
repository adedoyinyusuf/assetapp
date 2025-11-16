import { AssetVerification, AssetVerificationStatus, PhysicalCondition, Prisma } from '@prisma/client';
import { BaseService, PaginatedResponse, NotFoundError, UnauthorizedError, ValidationError, ConflictError } from './base-service';
import { CreateVerificationsRequest, UpdateVerificationRequest, VerificationQueryParams, PhotoUploadRequest, validateFileSize, validateImageType } from './validation';
import { generateUniqueFileName, formatFileSize, validateImageDimensions } from './utils';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// =============================================================================
// ASSET VERIFICATION SERVICE CLASS
// =============================================================================

export class VerificationService extends BaseService {

  private readonly uploadPath = join(process.cwd(), 'uploads', 'verifications');

  constructor() {
    super();
    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    if (!existsSync(this.uploadPath)) {
      await mkdir(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Create asset verifications
   */
  async createVerifications(
    data: CreateVerificationsRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AssetVerificationWithDetails[]> {
    try {
      // Check if user has permission to create verifications
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'create');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to create verifications');
      }

      // Validate campaign exists and is active
      const campaign = await this.db.verificationCampaign.findUnique({
        where: { id: data.campaignId },
        include: { assignments: { where: { userId } } },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      if (campaign.status !== 'ACTIVE') {
        throw new ValidationError('Cannot create verifications for inactive campaigns');
      }

      // Check if user is assigned to this campaign
      const userAssignment = campaign.assignments[0];
      if (!userAssignment) {
        throw new UnauthorizedError('User not assigned to this campaign');
      }

      // Validate assets exist and are not already verified in this campaign
      const assets = await this.db.asset.findMany({
        where: { id: { in: data.assetIds } },
        include: {
          verifications: {
            where: { campaignId: data.campaignId },
          },
        },
      });

      if (assets.length !== data.assetIds.length) {
        throw new ValidationError('One or more assets not found');
      }

      const alreadyVerified = assets.filter(asset => 
        asset.verifications.some(v => ['VERIFIED', 'APPROVED'].includes(v.status))
      );

      if (alreadyVerified.length > 0) {
        throw new ConflictError(
          `Assets already verified: ${alreadyVerified.map(a => a.name).join(', ')}`
        );
      }

      // Create verifications
      const verifications = await this.db.$transaction(async (tx) => {
        const createdVerifications = await Promise.all(
          data.assetIds.map(async (assetId) => {
            const verification = await tx.assetVerification.create({
              data: {
                campaignId: data.campaignId,
                assetId,
                verifierId: userId,
                status: 'PENDING',
                verificationDate: data.scheduledDate ? new Date(data.scheduledDate) : new Date(),
                notes: data.notes,
              },
              include: {
                asset: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    state: true,
                    lga: true,
                  },
                },
                verifier: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                campaign: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            });

            return verification;
          })
        );

        // Update assignment completed count
        await tx.verificationAssignment.update({
          where: { id: userAssignment.id },
          data: {
            completedCount: {
              increment: createdVerifications.length,
            },
          },
        });

        return createdVerifications;
      });

      // Create audit logs
      await Promise.all(
        verifications.map(verification =>
          this.createAuditLog(
            userId,
            'CREATE_VERIFICATION',
            'AssetVerification',
            verification.id,
            null,
            verification,
            ipAddress,
            userAgent
          )
        )
      );

      return verifications;
    } catch (error) {
      this.handleError(error, 'VerificationService.createVerifications');
    }
  }

  /**
   * Get paginated verifications
   */
  async getVerifications(
    params: VerificationQueryParams,
    userId: number
  ): Promise<PaginatedResponse<AssetVerificationWithDetails>> {
    try {
      // Check if user has permission to read verifications
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view verifications');
      }

      const { page = 1, limit = 20, ...filters } = params;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.AssetVerificationWhereInput = {
        ...(filters.campaignId && { campaignId: filters.campaignId }),
        ...(filters.assetId && { assetId: filters.assetId }),
        ...(filters.verifierId && { verifierId: filters.verifierId }),
        ...(filters.status && { status: { in: filters.status } }),
        ...(filters.condition && { physicalCondition: filters.condition }),
        ...(filters.dateFrom && {
          verificationDate: { gte: new Date(filters.dateFrom) },
        }),
        ...(filters.dateTo && {
          verificationDate: { lte: new Date(filters.dateTo) },
        }),
        ...(filters.search && {
          OR: [
            { asset: { name: { contains: filters.search, mode: 'insensitive' } } },
            { notes: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      };

      // Apply user access restrictions
      const userAccessWhere = await this.buildUserAccessFilter(userId, 'verification');
      const finalWhere = { ...where, ...userAccessWhere };

      const [verifications, total] = await Promise.all([
        this.db.assetVerification.findMany({
          where: finalWhere,
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                category: true,
                state: true,
                lga: true,
              },
            },
            verifier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },

            discrepancies: {
              select: {
                id: true,
                discrepancyType: true,
                severity: true,
                status: true,
              },
            },
          },
          orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
          skip,
          take: limit,
        }),
        this.db.assetVerification.count({ where: finalWhere }),
      ]);

      return this.createPaginatedResponse(verifications, total, page, limit);
    } catch (error) {
      this.handleError(error, 'VerificationService.getVerifications');
    }
  }

  /**
   * Get verification by ID
   */
  async getVerificationById(
    verificationId: number,
    userId: number
  ): Promise<AssetVerificationWithDetails> {
    try {
      // Check if user has permission to read verifications
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'read');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view verification');
      }

      const verification = await this.db.assetVerification.findUnique({
        where: { id: verificationId },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              category: true,
              state: true,
              lga: true,
            },
          },
          verifier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },

          discrepancies: {
            select: {
              id: true,
              discrepancyType: true,
              severity: true,
              status: true,
            },
          },
        },
      });

      if (!verification) {
        throw new NotFoundError('Verification not found');
      }

      return verification;
    } catch (error) {
      this.handleError(error, 'VerificationService.getVerificationById');
    }
  }

  /**
   * Update verification
   */
  async updateVerification(
    verificationId: number,
    data: UpdateVerificationRequest,
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AssetVerificationWithDetails> {
    try {
      // Check if user has permission to update verifications
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'update');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to update verification');
      }

      // Get existing verification
      const existingVerification = await this.db.assetVerification.findUnique({
        where: { id: verificationId },
        include: { campaign: true },
      });

      if (!existingVerification) {
        throw new NotFoundError('Verification not found');
      }

      // Validate status transitions
      if (data.status && !this.isValidStatusTransition(existingVerification.status, data.status)) {
        throw new ValidationError(`Invalid status transition from ${existingVerification.status} to ${data.status}`);
      }

      // Update verification
      const updatedVerification = await this.db.assetVerification.update({
        where: { id: verificationId },
        data: {
          status: data.status,
          physicalCondition: data.physicalCondition,
          locationAccurate: data.locationAccurate,
          actualStateId: data.actualStateId,
          actualLgaId: data.actualLgaId,
          actualLocation: data.actualLocation,
          coordinates: data.coordinates,
          notes: data.notes,
          reviewNotes: data.reviewNotes,
          verificationDate: data.status === 'VERIFIED' ? new Date() : undefined,
          reviewedAt: data.status === 'APPROVED' ? new Date() : undefined,
          reviewedBy: data.status === 'APPROVED' ? userId : undefined,
          verificationDuration: data.verificationDuration,
          estimatedValue: data.estimatedValue,
          witnessName: data.witnessName,
          deviceInfo: data.deviceInfo,
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              category: true,
              state: true,
              lga: true,
            },
          },
          verifier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      // Create audit log
      await this.createAuditLog(
        userId,
        'UPDATE_VERIFICATION',
        'AssetVerification',
        verificationId,
        existingVerification,
        updatedVerification,
        ipAddress,
        userAgent
      );

      return updatedVerification;
    } catch (error) {
      this.handleError(error, 'VerificationService.updateVerification');
    }
  }

  /**
   * Upload verification photos
   */
  async uploadPhotos(
    verificationId: number,
    files: PhotoUploadRequest[],
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string[]> {
    try {
      // Check if user has permission to upload photos
      const hasPermission = await this.checkUserAccess(userId, 'photo', 'upload');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to upload photos');
      }

      // Validate verification exists
      const verification = await this.db.assetVerification.findUnique({
        where: { id: verificationId },
        include: { asset: true },
      });

      if (!verification) {
        throw new NotFoundError('Verification not found');
      }

      const uploadedFiles: string[] = [];
      const photoRecords: Array<{
        verificationId: number;
        fileName: string;
        originalName: string;
        fileSize: number;
        mimeType: string;
        photoType: string;
        uploadedBy: number;
      }> = [];

      try {
        // Process each file
        for (const file of files) {
          const fileName = generateUniqueFileName(file.originalName);
          const filePath = join(this.uploadPath, fileName);

          // Convert base64 to buffer if needed
          const buffer = typeof file.data === 'string' 
            ? Buffer.from(file.data, 'base64')
            : file.data;

          // Validate image type and size
          if (!validateImageType(file.mimeType)) {
            throw new ValidationError('Unsupported image type');
          }
          if (!validateFileSize(buffer.length)) {
            throw new ValidationError('File size exceeds the maximum allowed (5MB)');
          }

          // Save file
          await writeFile(filePath, buffer);

          uploadedFiles.push(fileName);
          // removed photoRecords push since we no longer have a verificationPhoto model
        }

        // Update verification with photo urls
        await this.db.assetVerification.update({
          where: { id: verificationId },
          data: {
            photoUrls: {
              set: [...(verification.photoUrls || []), ...uploadedFiles],
            },
          },
        });

        // Create audit log
        await this.createAuditLog(
          userId,
          'UPLOAD_PHOTOS',
          'AssetVerification',
          verificationId,
          null,
          { photoCount: uploadedFiles.length, fileNames: uploadedFiles },
          ipAddress,
          userAgent
        );

        return uploadedFiles;

      } catch (uploadError) {
        // Clean up any uploaded files on error
        await Promise.all(
          uploadedFiles.map(async (fileName) => {
            try {
              await unlink(join(this.uploadPath, fileName));
            } catch (cleanupError) {
              console.error(`Failed to clean up file ${fileName}:`, cleanupError);
            }
          })
        );
        throw uploadError;
      }
    } catch (error) {
      this.handleError(error, 'VerificationService.uploadPhotos');
    }
  }

  /**
   * Get verification photos
   */
  async getVerificationPhotos(
    verificationId: number,
    userId: number
  ): Promise<VerificationPhoto[]> {
    try {
      // Check if user has permission to view photos
      const hasPermission = await this.checkUserAccess(userId, 'photo', 'view');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view photos');
      }

      const verification = await this.db.assetVerification.findUnique({
        where: { id: verificationId },
        select: { photoUrls: true },
      });

      if (!verification) {
        throw new NotFoundError('Verification not found');
      }

      const photos: VerificationPhoto[] = (verification.photoUrls || []).map((fileName) => ({
        fileName,
      }));

      return photos;
    } catch (error) {
      this.handleError(error, 'VerificationService.getVerificationPhotos');
    }
  }

  /**
   * Scan asset QR code
   */
  async scanAssetQR(
    qrData: string,
    campaignId: number,
    userId: number
  ): Promise<AssetScanResult> {
    try {
      // Check if user has permission to scan assets
      const hasPermission = await this.checkUserAccess(userId, 'verification', 'create');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to scan assets');
      }

      // Extract asset ID from QR data
      const assetId = this.extractAssetIdFromQR(qrData);
      if (!assetId) {
        throw new ValidationError('Invalid QR code format');
      }

      // Get asset details
      const asset = await this.db.asset.findUnique({
        where: { id: assetId },
        include: {
          category: true,
          state: true,
          lga: true,
          verifications: {
            where: { campaignId },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!asset) {
        throw new NotFoundError('Asset not found');
      }

      // Check if asset is already verified in this campaign
      const existingVerification = asset.verifications[0];
      const isAlreadyVerified = existingVerification && 
        ['VERIFIED', 'APPROVED'].includes(existingVerification.status);

      return {
        asset: {
          id: asset.id,
          name: asset.name,
          category: asset.category?.name || 'Unknown',
          state: asset.state,
          lga: asset.lga,
        },
        verification: existingVerification || null,
        isAlreadyVerified,
        canVerify: !isAlreadyVerified,
      };
    } catch (error) {
      this.handleError(error, 'VerificationService.scanAssetQR');
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(
    campaignId: number,
    userId: number
  ): Promise<VerificationStats> {
    try {
      // Check if user has permission to view analytics
      const hasPermission = await this.checkUserAccess(userId, 'analytics', 'view');
      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions to view statistics');
      }

      const stats = await this.db.assetVerification.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: { status: true },
      });

      const conditionStats = await this.db.assetVerification.groupBy({
        by: ['physicalCondition'],
        where: { 
          campaignId,
          physicalCondition: { not: null },
        },
        _count: { physicalCondition: true },
      });

      const total = stats.reduce((sum, stat) => sum + stat._count.status, 0);
      const completed = stats
        .filter(stat => ['VERIFIED', 'APPROVED'].includes(stat.status))
        .reduce((sum, stat) => sum + stat._count.status, 0);

      return {
        total,
        completed,
        pending: stats.find(s => s.status === 'PENDING')?._count.status || 0,
        inProgress: stats.find(s => s.status === 'IN_PROGRESS')?._count.status || 0,
        verified: stats.find(s => s.status === 'VERIFIED')?._count.status || 0,
        approved: stats.find(s => s.status === 'APPROVED')?._count.status || 0,
        rejected: stats.find(s => s.status === 'REJECTED')?._count.status || 0,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        conditionBreakdown: conditionStats.map(stat => ({
          condition: stat.physicalCondition!,
          count: stat._count.physicalCondition,
        })),
      };
    } catch (error) {
      this.handleError(error, 'VerificationService.getVerificationStats');
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private isValidStatusTransition(
    currentStatus: AssetVerificationStatus,
    newStatus: AssetVerificationStatus
  ): boolean {
    const validTransitions: Record<AssetVerificationStatus, AssetVerificationStatus[]> = {
      PENDING: ['IN_PROGRESS'],
      IN_PROGRESS: ['VERIFIED', 'PENDING', 'DISCREPANCY_FOUND', 'MISSING', 'DAMAGED', 'REQUIRES_REVIEW'],
      VERIFIED: ['APPROVED', 'REJECTED'],
      APPROVED: ['REJECTED'],
      REJECTED: ['PENDING', 'IN_PROGRESS'],
      DISCREPANCY_FOUND: ['REQUIRES_REVIEW', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'],
      MISSING: ['IN_PROGRESS', 'REQUIRES_REVIEW', 'REJECTED'],
      DAMAGED: ['IN_PROGRESS', 'REQUIRES_REVIEW', 'REJECTED'],
      REQUIRES_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'VERIFIED'],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private extractAssetIdFromQR(qrData: string): number | null {
    try {
      // Expected format: "ASSET:12345" or JSON with asset ID
      if (qrData.startsWith('ASSET:')) {
        return parseInt(qrData.split(':')[1]);
      }
      
      const parsed = JSON.parse(qrData);
      return parsed.assetId || parsed.id || null;
    } catch {
      return null;
    }
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface AssetVerificationWithDetails extends AssetVerification {
  asset: {
    id: number;
    name: string;
    category: any;
    state: any;
    lga: any;
  };
  verifier: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  reviewer?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  campaign: {
    id: number;
    name: string;
    status: string;
  };
  // removed assignment
  discrepancies?: Array<{
    id: number;
    discrepancyType: string;
    severity: string;
    status: string;
    reporter?: {
      id: number;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
}

export interface VerificationPhoto {
  fileName: string;
  // Optional fields for future expansion when a dedicated photo model exists
  id?: number;
  verificationId?: number;
  originalName?: string;
  fileSize?: number;
  mimeType?: string;
  photoType?: string;
  createdAt?: Date;
  uploader?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface AssetScanResult {
  asset: {
    id: number;
    name: string;
    category: string;
    state: any;
    lga: any;
  };
  verification: AssetVerification | null;
  isAlreadyVerified: boolean;
  canVerify: boolean;
}

export interface VerificationStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  verified: number;
  approved: number;
  rejected: number;
  completionRate: number;
  conditionBreakdown: Array<{
    condition: PhysicalCondition;
    count: number;
  }>;
}