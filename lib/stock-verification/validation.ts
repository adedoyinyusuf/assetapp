import { z } from 'zod';
import {
  VerificationCampaignStatus,
  AssetVerificationStatus,
  PhysicalCondition,
  DiscrepancyType,
  DiscrepancySeverity,
  DiscrepancyStatus,
  VerificationRole,
  AssignmentStatus,
  VerificationTemplateType
} from '@prisma/client';

// =============================================================================
// CAMPAIGN VALIDATION SCHEMAS
// =============================================================================

const baseCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  assignedStates: z.array(z.number().int().positive()).min(1, 'At least one state must be assigned'),
  assignedLgas: z.array(z.number().int().positive()).optional().default([]),
  assignedCategories: z.array(z.number().int().positive()).optional().default([]),
  budget: z.number().positive().optional(),
  instructions: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
});

export const createCampaignSchema = baseCampaignSchema.refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

export const updateCampaignSchema = baseCampaignSchema.partial().extend({
  status: z.nativeEnum(VerificationCampaignStatus).optional(),
  targetAssetCount: z.number().int().positive().optional(),
  verificationProgress: z.number().min(0).max(100).optional(),
});

export const campaignQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.union([z.nativeEnum(VerificationCampaignStatus), z.array(z.nativeEnum(VerificationCampaignStatus))])
    .optional()
    .transform(val => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  createdBy: z.string().regex(/^\d+$/).transform(Number).optional(),
  stateIds: z.array(z.string().regex(/^\d+$/).transform(Number)).optional(),
  lgaIds: z.array(z.string().regex(/^\d+$/).transform(Number)).optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['name', 'startDate', 'endDate', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// VERIFICATION VALIDATION SCHEMAS
// =============================================================================

export const createVerificationsSchema = z.object({
  campaignId: z.number().int().positive(),
  assetIds: z.array(z.number().int().positive()).min(1, 'At least one asset must be selected'),
  verifierId: z.number().int().positive().optional(),
  scheduledDate: z.string().datetime().optional(),
  templateId: z.number().int().positive().optional(),
  instructions: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
});

export const submitVerificationSchema = z.object({
  campaignId: z.number().int().positive(),
  assetId: z.number().int().positive().optional(),
  qrCode: z.string().optional(),
  physicalCondition: z.nativeEnum(PhysicalCondition),
  locationAccurate: z.boolean(),
  notes: z.string().max(2000).optional(),
  createDiscrepancy: z.boolean().optional(),
  createMaintenance: z.boolean().optional(),
  photoUrls: z.array(z.string()).optional(),
  coordinates: z.string().max(100).optional(),
}).refine(data => data.assetId || data.qrCode, {
  message: "Either Asset ID or QR Code must be provided",
  path: ["assetId"]
});

export const updateVerificationSchema = z.object({
  status: z.nativeEnum(AssetVerificationStatus).optional(),
  physicalCondition: z.nativeEnum(PhysicalCondition).optional(),
  locationAccurate: z.boolean().optional(),
  actualStateId: z.number().int().positive().optional(),
  actualLgaId: z.number().int().positive().optional(),
  actualLocation: z.string().max(500).optional(),
  coordinates: z.string().max(100).regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, 'Invalid coordinates format').optional(),
  notes: z.string().max(2000).optional(),
  estimatedValue: z.number().positive().optional(),
  verificationDuration: z.number().int().positive().optional(),
  witnessName: z.string().max(255).optional(),
  reviewNotes: z.string().max(2000).optional(),
  deviceInfo: z.string().max(255).optional(),
});

export const verificationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  campaignId: z.string().regex(/^\d+$/).transform(Number).optional(),
  assetId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.array(z.nativeEnum(AssetVerificationStatus)).optional(),
  verifierId: z.string().regex(/^\d+$/).transform(Number).optional(),
  stateId: z.string().regex(/^\d+$/).transform(Number).optional(),
  lgaId: z.string().regex(/^\d+$/).transform(Number).optional(),
  categoryId: z.string().regex(/^\d+$/).transform(Number).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasDiscrepancies: z.string().transform(val => val === 'true').optional(),
  condition: z.nativeEnum(PhysicalCondition).optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['verificationDate', 'status', 'assetName', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// DISCREPANCY VALIDATION SCHEMAS
// =============================================================================

export const createDiscrepancySchema = z.object({
  verificationId: z.number().int().positive(),
  discrepancyType: z.nativeEnum(DiscrepancyType),
  description: z.string().min(1, 'Description is required').max(2000),
  severity: z.nativeEnum(DiscrepancySeverity).default('MEDIUM'),
  expectedValue: z.string().max(2000).optional(),
  actualValue: z.string().max(2000).optional(),
  financialImpact: z.number().optional(),
  actionRequired: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.number().int().positive().optional(),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  priority: z.number().int().min(1).max(5).default(3),
});

export const updateDiscrepancySchema = z.object({
  status: z.nativeEnum(DiscrepancyStatus).optional(),
  assignedTo: z.number().int().positive().optional(),
  resolutionNotes: z.string().max(2000).optional(),
  actionRequired: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  financialImpact: z.number().optional(),
  resolutionAction: z.enum(['UPDATE_ASSET_LOCATION', 'UPDATE_ASSET_STATUS', 'MARK_AS_DAMAGED', 'DISPOSE_ASSET', 'IGNORE']).optional(),
  newLocation: z.string().optional(),
  newStateId: z.number().int().positive().optional(),
  newLgaId: z.number().int().positive().optional(),
});

export const discrepancyQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  campaignId: z.string().regex(/^\d+$/).transform(Number).optional(),
  verificationId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.array(z.nativeEnum(DiscrepancyStatus)).optional(),
  severity: z.array(z.nativeEnum(DiscrepancySeverity)).optional(),
  type: z.array(z.nativeEnum(DiscrepancyType)).optional(),
  assignedTo: z.string().regex(/^\d+$/).transform(Number).optional(),
  reportedBy: z.string().regex(/^\d+$/).transform(Number).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'severity', 'dueDate', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// ASSIGNMENT VALIDATION SCHEMAS
// =============================================================================

export const createAssignmentSchema = z.object({
  userId: z.number().int().positive(),
  role: z.nativeEnum(VerificationRole),
  stateIds: z.array(z.number().int().positive()).min(1, 'At least one state must be assigned'),
  lgaIds: z.array(z.number().int().positive()).optional().default([]),
  categoryIds: z.array(z.number().int().positive()).optional().default([]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  dailyTarget: z.number().int().positive().optional(),
  totalTarget: z.number().int().positive().optional(),
  instructions: z.string().max(2000).optional(),
  permissions: z.array(z.string()).optional().default([]),
  reportingTo: z.number().int().positive().optional(),
  mobileAccess: z.boolean().default(true),
  offlineAccess: z.boolean().default(false),
});

export const updateAssignmentSchema = createAssignmentSchema.extend({
  status: z.nativeEnum(AssignmentStatus).optional(),
  completedCount: z.number().int().min(0).optional(),
});

// =============================================================================
// TEMPLATE VALIDATION SCHEMAS
// =============================================================================

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(2000).optional(),
  templateType: z.nativeEnum(VerificationTemplateType),
  categoryIds: z.array(z.number().int().positive()).optional().default([]),
  checklistItems: z.array(z.object({
    id: z.string(),
    label: z.string(),
    required: z.boolean().default(false),
    type: z.enum(['text', 'number', 'boolean', 'select', 'photo']).default('text'),
    options: z.array(z.string()).optional(),
  })).optional().default([]),
  requiredPhotos: z.array(z.string()).optional().default([]),
  requiredFields: z.array(z.string()).optional().default([]),
  estimatedTime: z.number().int().positive().optional(),
  instructions: z.string().max(2000).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  version: z.string().max(20).default('1.0'),
});

// =============================================================================
// FILE UPLOAD VALIDATION SCHEMAS
// =============================================================================

export const photoUploadSchema = z.object({
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  data: z.custom<Buffer | string>(),
  photoType: z.enum(['asset', 'condition', 'location', 'damage', 'other']).default('asset'),
  verificationId: z.number().int().positive().optional(),
});

// =============================================================================
// REPORT VALIDATION SCHEMAS
// =============================================================================

export const reportQuerySchema = z.object({
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  sections: z.array(z.enum(['summary', 'verifications', 'discrepancies', 'analytics'])).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includePhotos: z.boolean().default(false),
  includeCharts: z.boolean().default(true),
});

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type CreateCampaignRequest = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignRequest = z.infer<typeof updateCampaignSchema>;
export type CampaignQueryParams = z.infer<typeof campaignQuerySchema>;

export type CreateVerificationsRequest = z.infer<typeof createVerificationsSchema>;
export type SubmitVerificationRequest = z.infer<typeof submitVerificationSchema>;
export type UpdateVerificationRequest = z.infer<typeof updateVerificationSchema>;
export type VerificationQueryParams = z.infer<typeof verificationQuerySchema>;

export type CreateDiscrepancyRequest = z.infer<typeof createDiscrepancySchema>;
export type UpdateDiscrepancyRequest = z.infer<typeof updateDiscrepancySchema>;
export type DiscrepancyQueryParams = z.infer<typeof discrepancyQuerySchema>;

export type CreateAssignmentRequest = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentRequest = z.infer<typeof updateAssignmentSchema>;

export type CreateTemplateRequest = z.infer<typeof createTemplateSchema>;
export type PhotoUploadRequest = z.infer<typeof photoUploadSchema>;
export type ReportQueryParams = z.infer<typeof reportQuerySchema>;

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function validateCampaignDates(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  return start >= now && end > start;
}

export function validateCoordinates(coordinates: string): boolean {
  const coordRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
  return coordRegex.test(coordinates);
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
}

export function validateFileSize(fileSize: number, maxSizeInMB: number = 5): boolean {
  return fileSize <= maxSizeInMB * 1024 * 1024;
}

export function validateImageType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimeType);
}