// =============================================================================
// STOCK VERIFICATION MODULE - MAIN EXPORTS
// =============================================================================

// Base service and utilities
export { BaseService } from './base-service';
export type { 
  PaginatedResponse, 
  ServiceResponse, 
  BulkResponse 
} from './base-service';

// Services
export { CampaignService } from './campaign-service';
export type { VerificationCampaignWithStats, CampaignDetailResponse, CampaignStatistics, ProductivityMetrics, ActivityLog } from './campaign-service';

export { AssignmentService } from './assignment-service';
export type { VerificationAssignmentWithUser, UserAssignmentSummary, TeamPerformanceMetrics } from './assignment-service';

export { VerificationService } from './verification-service';
export type { AssetVerificationWithDetails, AssetScanResult, VerificationStats } from './verification-service';

export { BulkVerificationService } from './bulk-verification-service';
export type { BulkOperationResult, AssetAssignmentPreview, VerificationImportRow, ImportResult } from './bulk-verification-service';

export { DiscrepancyService } from './discrepancy-service';
export type { DiscrepancyWithDetails, DiscrepancyStats, DiscrepancyReport } from './discrepancy-service';

export { ReportingService } from './reporting-service';
export type { ComprehensiveCampaignReport, ExecutiveDashboard, PerformanceReport, AssetBreakdown, TrendData, DiscrepancyBreakdown, TopPerformer, VerificationAnalytics, DiscrepancyPatterns, ProductivityTrend } from './reporting-service';

export { AssetAssignmentService } from './asset-assignment-service';
export type { AssignmentCriteria, AssignmentResult, AssetEligibilityCheck, BulkAssignmentRequest, AssignedAsset, PriorityRule } from './asset-assignment-service';

export { CampaignAnalyticsService } from './campaign-analytics-service';
export type { CampaignAnalytics, BasicCampaignMetrics, ProgressMetrics, TeamPerformanceMetrics as AnalyticsTeamPerformance, QualityMetrics, TimeMetrics, CostMetrics, GeographicBreakdown, CategoryBreakdown, TrendDataPoint, AnalyticsAlert, CampaignPredictions } from './campaign-analytics-service';

export {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  BusinessLogicError,
  createSuccessResponse,
  createErrorResponse,
  createBulkResponse,
} from './base-service';

// Validation schemas and types
export {
  createCampaignSchema,
  updateCampaignSchema,
  campaignQuerySchema,
  createVerificationsSchema,
  updateVerificationSchema,
  verificationQuerySchema,
  createDiscrepancySchema,
  updateDiscrepancySchema,
  discrepancyQuerySchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  createTemplateSchema,
  photoUploadSchema,
  reportQuerySchema,
  validateCampaignDates,
  validateCoordinates,
  sanitizeFileName,
  validateFileSize,
  validateImageType,
} from './validation';

export type {
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignQueryParams,
  CreateVerificationsRequest,
  UpdateVerificationRequest,
  VerificationQueryParams,
  CreateDiscrepancyRequest,
  UpdateDiscrepancyRequest,
  DiscrepancyQueryParams,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  CreateTemplateRequest,
  PhotoUploadRequest,
  ReportQueryParams,
} from './validation';

// Utility functions
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  calculateDaysBetween,
  addBusinessDays,
  calculateVerificationProgress,
  calculateCompletionRate,
  calculateEfficiency,
  getStatusColor,
  getSeverityColor,
  getConditionColor,
  getStatusPriority,
  generateUniqueFileName,
  formatFileSize,
  validateImageDimensions,
  normalizeSearchTerm,
  createSearchTerms,
  highlightSearchTerm,
  formatCoordinates,
  calculateDistance,
  extractAssetIdFromQR,
  generateAssetQRData,
  calculateTrends,
  generateReportSummary,
  checkCampaignAccess,
  getUserAccessLevel,
} from './utils';

// Re-export Prisma types for convenience
export type {
  VerificationCampaign,
  AssetVerification,
  VerificationDiscrepancy,
  VerificationAssignment,
  VerificationTemplate,
  VerificationSchedule,
  VerificationAnalytics as VerificationAnalyticsRecord,
  VerificationCampaignStatus,
  AssetVerificationStatus,
  PhysicalCondition,
  DiscrepancyType,
  DiscrepancySeverity,
  DiscrepancyStatus,
  VerificationRole,
  AssignmentStatus,
  VerificationTemplateType,
  ScheduleType,
  ScheduleStatus,
} from '@prisma/client';