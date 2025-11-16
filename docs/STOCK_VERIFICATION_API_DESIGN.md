# Stock Verification API Endpoints and Services Design

## Overview
This document defines the RESTful API endpoints, validation schemas, and service layer architecture for the Stock Verification module integration into the NPC Asset Management System.

## Table of Contents
1. [API Endpoint Structure](#api-endpoint-structure)
2. [Validation Schemas](#validation-schemas)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Error Handling](#error-handling)
5. [Authentication & Authorization](#authentication--authorization)
6. [Rate Limiting](#rate-limiting)
7. [WebSocket Events](#websocket-events)

---

## API Endpoint Structure

### 1. Campaign Management APIs

#### **GET /api/stock-verification/campaigns**
Retrieve verification campaigns with filtering and pagination.

**Query Parameters:**
```typescript
interface CampaignQueryParams {
  page?: number;
  limit?: number;
  status?: VerificationCampaignStatus[];
  startDate?: string;
  endDate?: string;
  createdBy?: number;
  stateIds?: number[];
  lgaIds?: number[];
  search?: string;
  sortBy?: 'name' | 'startDate' | 'endDate' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface CampaignListResponse {
  data: VerificationCampaignSummary[];
  pagination: PaginationInfo;
  filters: FilterSummary;
}

interface VerificationCampaignSummary {
  id: number;
  name: string;
  description?: string;
  status: VerificationCampaignStatus;
  startDate: string;
  endDate: string;
  targetAssetCount?: number;
  verificationProgress: number;
  assignedStates: number[];
  assignedLgas: number[];
  assignedCategories: number[];
  createdBy: number;
  createdAt: string;
  creator: UserSummary;
  stats: {
    totalVerifications: number;
    completedVerifications: number;
    pendingVerifications: number;
    discrepancyCount: number;
  };
}
```

---

#### **POST /api/stock-verification/campaigns**
Create a new verification campaign.

**Request Body:**
```typescript
interface CreateCampaignRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  assignedStates: number[];
  assignedLgas: number[];
  assignedCategories: number[];
  budget?: number;
  instructions?: string;
  metadata?: Record<string, any>;
}
```

**Validation Schema:**
```typescript
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  description: z.string().optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  assignedStates: z.array(z.number().int().positive()).min(1, 'At least one state must be assigned'),
  assignedLgas: z.array(z.number().int().positive()).optional(),
  assignedCategories: z.array(z.number().int().positive()).optional(),
  budget: z.number().positive().optional(),
  instructions: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});
```

---

#### **GET /api/stock-verification/campaigns/[id]**
Get detailed campaign information.

**Response:**
```typescript
interface CampaignDetailResponse {
  id: number;
  name: string;
  description?: string;
  status: VerificationCampaignStatus;
  startDate: string;
  endDate: string;
  targetAssetCount?: number;
  actualAssetCount: number;
  verificationProgress: number;
  budget?: number;
  instructions?: string;
  metadata?: Record<string, any>;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: UserSummary;
  assignments: VerificationAssignmentSummary[];
  stats: CampaignStatistics;
  recentActivity: ActivityLog[];
}

interface CampaignStatistics {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  missingAssets: number;
  damagedAssets: number;
  discrepancyCount: number;
  totalValue: number;
  verifiedValue: number;
  averageVerificationTime: number;
  teamProductivity: Record<number, ProductivityMetrics>;
}
```

---

#### **PUT /api/stock-verification/campaigns/[id]**
Update campaign information.

**Request Body:** Same as create, plus:
```typescript
interface UpdateCampaignRequest extends CreateCampaignRequest {
  status?: VerificationCampaignStatus;
}
```

---

#### **DELETE /api/stock-verification/campaigns/[id]**
Soft delete a campaign (changes status to CANCELLED).

---

### 2. Asset Verification APIs

#### **GET /api/stock-verification/campaigns/[id]/verifications**
Get verifications for a specific campaign.

**Query Parameters:**
```typescript
interface VerificationQueryParams {
  page?: number;
  limit?: number;
  status?: AssetVerificationStatus[];
  verifierId?: number;
  stateId?: number;
  lgaId?: number;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  hasDiscrepancies?: boolean;
  sortBy?: 'verificationDate' | 'status' | 'assetName';
  sortOrder?: 'asc' | 'desc';
}
```

---

#### **POST /api/stock-verification/campaigns/[id]/verifications**
Create asset verification records (bulk operation).

**Request Body:**
```typescript
interface CreateVerificationsRequest {
  assetIds: number[];
  verifierId?: number; // If not provided, uses current user
  scheduledDate?: string;
  templateId?: number;
  instructions?: string;
}
```

---

#### **GET /api/stock-verification/verifications/[id]**
Get detailed verification information.

**Response:**
```typescript
interface VerificationDetailResponse {
  id: number;
  campaignId: number;
  assetId: number;
  verifierId: number;
  verificationDate: string;
  status: AssetVerificationStatus;
  physicalCondition?: PhysicalCondition;
  locationAccurate: boolean;
  actualStateId?: number;
  actualLgaId?: number;
  actualLocation?: string;
  coordinates?: string;
  notes?: string;
  photoUrls: string[];
  qrCodeScanned: boolean;
  barcodeScanData?: string;
  estimatedValue?: number;
  verificationDuration?: number;
  deviceInfo?: string;
  signatureUrl?: string;
  witnessName?: string;
  witnessSignature?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  asset: AssetSummary;
  verifier: UserSummary;
  reviewer?: UserSummary;
  actualState?: StateSummary;
  actualLga?: LGASummary;
  discrepancies: DiscrepancySummary[];
}
```

---

#### **PUT /api/stock-verification/verifications/[id]**
Update verification record.

**Request Body:**
```typescript
interface UpdateVerificationRequest {
  status?: AssetVerificationStatus;
  physicalCondition?: PhysicalCondition;
  locationAccurate?: boolean;
  actualStateId?: number;
  actualLgaId?: number;
  actualLocation?: string;
  coordinates?: string;
  notes?: string;
  estimatedValue?: number;
  verificationDuration?: number;
  witnessName?: string;
  reviewNotes?: string;
}
```

**Validation Schema:**
```typescript
const updateVerificationSchema = z.object({
  status: z.nativeEnum(AssetVerificationStatus).optional(),
  physicalCondition: z.nativeEnum(PhysicalCondition).optional(),
  locationAccurate: z.boolean().optional(),
  actualStateId: z.number().int().positive().optional(),
  actualLgaId: z.number().int().positive().optional(),
  actualLocation: z.string().max(500).optional(),
  coordinates: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  estimatedValue: z.number().positive().optional(),
  verificationDuration: z.number().int().positive().optional(),
  witnessName: z.string().max(255).optional(),
  reviewNotes: z.string().max(2000).optional(),
});
```

---

### 3. Discrepancy Management APIs

#### **GET /api/stock-verification/discrepancies**
Get discrepancies with filtering.

**Query Parameters:**
```typescript
interface DiscrepancyQueryParams {
  page?: number;
  limit?: number;
  campaignId?: number;
  verificationId?: number;
  status?: DiscrepancyStatus[];
  severity?: DiscrepancySeverity[];
  type?: DiscrepancyType[];
  assignedTo?: number;
  reportedBy?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'severity' | 'dueDate' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

---

#### **POST /api/stock-verification/discrepancies**
Create a new discrepancy.

**Request Body:**
```typescript
interface CreateDiscrepancyRequest {
  verificationId: number;
  discrepancyType: DiscrepancyType;
  description: string;
  severity?: DiscrepancySeverity;
  expectedValue?: string;
  actualValue?: string;
  financialImpact?: number;
  actionRequired?: string;
  dueDate?: string;
  assignedTo?: number;
  tags?: string[];
  priority?: number;
}
```

---

#### **PUT /api/stock-verification/discrepancies/[id]**
Update discrepancy information.

**Request Body:**
```typescript
interface UpdateDiscrepancyRequest {
  status?: DiscrepancyStatus;
  assignedTo?: number;
  resolutionNotes?: string;
  actionRequired?: string;
  dueDate?: string;
  priority?: number;
  tags?: string[];
}
```

---

### 4. Team Management APIs

#### **GET /api/stock-verification/campaigns/[id]/assignments**
Get team assignments for a campaign.

---

#### **POST /api/stock-verification/campaigns/[id]/assignments**
Create team assignments.

**Request Body:**
```typescript
interface CreateAssignmentRequest {
  userId: number;
  role: VerificationRole;
  stateIds: number[];
  lgaIds: number[];
  categoryIds?: number[];
  startDate?: string;
  endDate?: string;
  dailyTarget?: number;
  totalTarget?: number;
  instructions?: string;
  permissions?: string[];
  reportingTo?: number;
  mobileAccess?: boolean;
  offlineAccess?: boolean;
}
```

---

### 5. File Upload APIs

#### **POST /api/stock-verification/upload/photos**
Upload verification photos.

**Request:** Multipart form data
- `files`: File array (max 10 files, 5MB each)
- `verificationId`: number
- `photoType`: string (e.g., 'asset', 'condition', 'location', 'damage')

**Response:**
```typescript
interface PhotoUploadResponse {
  uploadedFiles: {
    originalName: string;
    fileName: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  verificationId: number;
}
```

---

#### **GET /api/stock-verification/photos/[id]**
Serve verification photos with proper security headers.

---

### 6. Reporting APIs

#### **GET /api/stock-verification/reports/campaign/[id]**
Generate campaign reports.

**Query Parameters:**
```typescript
interface ReportQueryParams {
  format?: 'json' | 'csv' | 'pdf';
  sections?: ('summary' | 'verifications' | 'discrepancies' | 'analytics')[];
  dateFrom?: string;
  dateTo?: string;
}
```

---

#### **GET /api/stock-verification/reports/discrepancies**
Generate discrepancy reports.

---

#### **GET /api/stock-verification/reports/analytics**
Get analytics data for dashboards.

**Response:**
```typescript
interface AnalyticsResponse {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalVerifications: number;
    pendingVerifications: number;
    totalDiscrepancies: number;
    openDiscrepancies: number;
  };
  trends: {
    verificationRate: TimeSeriesData[];
    discrepancyRate: TimeSeriesData[];
    completionRate: TimeSeriesData[];
  };
  breakdown: {
    byState: StateBreakdown[];
    byCategory: CategoryBreakdown[];
    byTeam: TeamBreakdown[];
  };
  performance: {
    averageVerificationTime: number;
    teamProductivity: TeamProductivity[];
    topDiscrepancyTypes: DiscrepancyTypeStats[];
  };
}
```

---

## Service Layer Architecture

### 1. Campaign Service (`/lib/stock-verification/campaign-service.ts`)

```typescript
export class CampaignService {
  // Campaign CRUD operations
  async createCampaign(data: CreateCampaignRequest, userId: number): Promise<VerificationCampaign>
  async getCampaigns(params: CampaignQueryParams): Promise<PaginatedResponse<VerificationCampaignSummary>>
  async getCampaignById(id: number): Promise<CampaignDetailResponse>
  async updateCampaign(id: number, data: UpdateCampaignRequest, userId: number): Promise<VerificationCampaign>
  async deleteCampaign(id: number, userId: number): Promise<void>
  
  // Campaign management
  async startCampaign(id: number, userId: number): Promise<void>
  async pauseCampaign(id: number, userId: number): Promise<void>
  async completeCampaign(id: number, userId: number): Promise<void>
  async generateCampaignAssets(id: number): Promise<number[]>
  async calculateProgress(id: number): Promise<number>
  
  // Analytics
  async getCampaignStats(id: number): Promise<CampaignStatistics>
  async getCampaignAnalytics(id: number, dateRange?: DateRange): Promise<VerificationAnalytics[]>
}
```

### 2. Verification Service (`/lib/stock-verification/verification-service.ts`)

```typescript
export class VerificationService {
  // Verification CRUD
  async createVerifications(campaignId: number, data: CreateVerificationsRequest, userId: number): Promise<AssetVerification[]>
  async getVerifications(campaignId: number, params: VerificationQueryParams): Promise<PaginatedResponse<AssetVerificationSummary>>
  async getVerificationById(id: number): Promise<VerificationDetailResponse>
  async updateVerification(id: number, data: UpdateVerificationRequest, userId: number): Promise<AssetVerification>
  
  // Verification workflow
  async startVerification(id: number, userId: number): Promise<void>
  async submitVerification(id: number, data: VerificationSubmissionData, userId: number): Promise<void>
  async reviewVerification(id: number, data: VerificationReviewData, userId: number): Promise<void>
  async approveVerification(id: number, userId: number): Promise<void>
  async rejectVerification(id: number, reason: string, userId: number): Promise<void>
  
  // Photo management
  async uploadPhotos(verificationId: number, files: File[], userId: number): Promise<string[]>
  async deletePhoto(verificationId: number, photoUrl: string, userId: number): Promise<void>
  
  // QR/Barcode scanning
  async processQRCode(verificationId: number, qrData: string, userId: number): Promise<void>
  async processBarcodeData(verificationId: number, barcodeData: string, userId: number): Promise<void>
}
```

### 3. Discrepancy Service (`/lib/stock-verification/discrepancy-service.ts`)

```typescript
export class DiscrepancyService {
  // Discrepancy CRUD
  async createDiscrepancy(data: CreateDiscrepancyRequest, userId: number): Promise<VerificationDiscrepancy>
  async getDiscrepancies(params: DiscrepancyQueryParams): Promise<PaginatedResponse<DiscrepancySummary>>
  async getDiscrepancyById(id: number): Promise<DiscrepancyDetailResponse>
  async updateDiscrepancy(id: number, data: UpdateDiscrepancyRequest, userId: number): Promise<VerificationDiscrepancy>
  
  // Discrepancy workflow
  async assignDiscrepancy(id: number, assigneeId: number, userId: number): Promise<void>
  async acknowledgeDiscrepancy(id: number, userId: number): Promise<void>
  async resolveDiscrepancy(id: number, resolutionNotes: string, userId: number): Promise<void>
  async escalateDiscrepancy(id: number, escalateToId: number, reason: string, userId: number): Promise<void>
  async closeDiscrepancy(id: number, userId: number): Promise<void>
  
  // Analytics
  async getDiscrepancyTrends(dateRange: DateRange): Promise<TrendData[]>
  async getTopDiscrepancyTypes(limit: number): Promise<DiscrepancyTypeStats[]>
}
```

### 4. Team Management Service (`/lib/stock-verification/team-service.ts`)

```typescript
export class TeamService {
  // Assignment CRUD
  async createAssignment(campaignId: number, data: CreateAssignmentRequest, userId: number): Promise<VerificationAssignment>
  async getAssignments(campaignId: number): Promise<VerificationAssignmentSummary[]>
  async updateAssignment(id: number, data: UpdateAssignmentRequest, userId: number): Promise<VerificationAssignment>
  async deleteAssignment(id: number, userId: number): Promise<void>
  
  // Team management
  async getTeamPerformance(campaignId: number): Promise<TeamPerformanceMetrics[]>
  async getWorkloadDistribution(campaignId: number): Promise<WorkloadDistribution[]>
  async reassignWork(fromUserId: number, toUserId: number, campaignId: number, userId: number): Promise<void>
  
  // Permissions
  async checkUserPermission(userId: number, campaignId: number, action: string): Promise<boolean>
  async getUserAssignments(userId: number): Promise<UserAssignmentSummary[]>
}
```

### 5. Analytics Service (`/lib/stock-verification/analytics-service.ts`)

```typescript
export class AnalyticsService {
  // Data aggregation
  async generateDailyAnalytics(campaignId: number, date: Date): Promise<VerificationAnalytics>
  async getOverviewMetrics(): Promise<OverviewMetrics>
  async getTrendAnalysis(dateRange: DateRange): Promise<TrendAnalysis>
  async getPerformanceMetrics(campaignId?: number): Promise<PerformanceMetrics>
  
  // Reports
  async generateCampaignReport(campaignId: number, options: ReportOptions): Promise<ReportData>
  async generateDiscrepancyReport(filters: DiscrepancyFilters): Promise<ReportData>
  async exportData(type: ExportType, filters: ExportFilters): Promise<ExportResult>
}
```

---

## Error Handling

### Standard Error Response Format
```typescript
interface ApiErrorResponse {
  error: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
  code?: string;
}
```

### Error Codes
- `CAMPAIGN_NOT_FOUND` - Campaign doesn't exist
- `VERIFICATION_NOT_FOUND` - Verification record doesn't exist
- `DISCREPANCY_NOT_FOUND` - Discrepancy doesn't exist
- `INVALID_CAMPAIGN_STATUS` - Cannot perform action in current campaign status
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Input validation failed
- `DUPLICATE_VERIFICATION` - Asset already has verification for campaign
- `FILE_UPLOAD_ERROR` - Photo upload failed
- `INVALID_DATE_RANGE` - Invalid date range provided

---

## Authentication & Authorization

### Permission Matrix
| Role | Create Campaign | Manage Teams | Verify Assets | Review Verifications | Manage Discrepancies | View Reports |
|------|----------------|--------------|---------------|-------------------|-------------------|--------------|
| Verification Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Field Supervisor | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Verification Officer | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Asset Administrator | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Auditor | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Endpoint Security
- All endpoints require authentication via NextAuth.js
- Role-based access control implemented at endpoint level
- Resource-level permissions checked for specific campaigns/verifications
- Rate limiting per user role

---

## Rate Limiting

### Limits by User Role
- **Verification Manager**: 1000 requests/hour
- **Field Supervisor**: 500 requests/hour
- **Verification Officer**: 300 requests/hour
- **Others**: 100 requests/hour

### Special Limits
- Photo uploads: 50 files/hour per user
- Bulk operations: 10 requests/hour per user
- Report generation: 20 requests/hour per user

---

## WebSocket Events

### Event Types
```typescript
interface WebSocketEvents {
  // Campaign events
  'campaign:created': CampaignEventData;
  'campaign:updated': CampaignEventData;
  'campaign:started': CampaignEventData;
  'campaign:completed': CampaignEventData;
  
  // Verification events
  'verification:created': VerificationEventData;
  'verification:updated': VerificationEventData;
  'verification:completed': VerificationEventData;
  'verification:reviewed': VerificationEventData;
  
  // Discrepancy events
  'discrepancy:created': DiscrepancyEventData;
  'discrepancy:assigned': DiscrepancyEventData;
  'discrepancy:resolved': DiscrepancyEventData;
  'discrepancy:escalated': DiscrepancyEventData;
  
  // Progress events
  'progress:updated': ProgressEventData;
  'analytics:updated': AnalyticsEventData;
}
```

### Room Management
- **campaign:[id]**: Campaign-specific updates
- **user:[id]**: User-specific notifications
- **discrepancy:[id]**: Discrepancy-specific updates
- **global**: System-wide announcements

---

*This API design provides a comprehensive, scalable foundation for the Stock Verification module, following RESTful principles and integrating seamlessly with the existing NPC Asset Management System architecture.*