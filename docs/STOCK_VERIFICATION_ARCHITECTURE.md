# Stock Verification Module - System Architecture Design

## Executive Summary

The Stock Verification module is designed to provide comprehensive physical verification capabilities for the NPC Asset Management System. This module enables systematic verification of assets, tracking discrepancies, generating verification reports, and maintaining audit trails for compliance purposes.

## 1. System Architecture Overview

### 1.1 Module Integration Points
- **Database Layer**: Extends existing Prisma schema with verification-specific tables
- **API Layer**: RESTful endpoints following existing patterns in `/app/api/`
- **UI Layer**: React components integrated with existing dashboard structure
- **Authentication**: Leverages existing NextAuth.js role-based access control
- **Real-time Updates**: WebSocket integration for live verification status

### 1.2 Core Components
```
Stock Verification Module
├── Data Models (Prisma Schema Extensions)
├── API Services (/app/api/stock-verification/)
├── Business Logic Layer (/lib/stock-verification/)
├── UI Components (/components/stock-verification/)
├── Pages & Routing (/app/stock-verification/)
└── Real-time Services (WebSocket events)
```

## 2. Business Requirements & Workflows

### 2.1 Core Workflows
1. **Verification Campaign Creation**
   - Define verification scope (location, category, date range)
   - Assign verification teams and responsibilities
   - Set verification schedules and deadlines

2. **Asset Verification Process**
   - Physical asset identification and scanning
   - Condition assessment and documentation
   - Photo capture and documentation
   - Discrepancy identification and reporting

3. **Discrepancy Management**
   - Missing asset reporting
   - Condition discrepancy logging
   - Location mismatch identification
   - Unauthorized asset discovery

4. **Reporting & Analytics**
   - Verification progress tracking
   - Discrepancy analysis and trends
   - Compliance reporting
   - Executive dashboards

### 2.2 User Roles & Permissions
- **Verification Manager**: Create campaigns, assign teams, view all reports
- **Verification Officer**: Conduct verifications, submit findings
- **Field Supervisor**: Review team submissions, approve discrepancies
- **Auditor**: Read-only access to all verification data
- **Asset Administrator**: Resolve discrepancies, update asset records

## 3. Technical Architecture

### 3.1 Data Architecture
The Stock Verification module extends the existing database schema with the following entities:

```prisma
// Verification Campaigns
model VerificationCampaign {
  id               Int                    @id @default(autoincrement())
  name             String
  description      String?
  startDate        DateTime               @map("start_date")
  endDate          DateTime               @map("end_date")
  status           VerificationCampaignStatus @default(PLANNED)
  createdBy        Int                    @map("created_by")
  assignedStates   Int[]                  @map("assigned_states")
  assignedLgas     Int[]                  @map("assigned_lgas")
  assignedCategories Int[]               @map("assigned_categories")
  createdAt        DateTime               @default(now()) @map("created_at")
  updatedAt        DateTime               @updatedAt @map("updated_at")
  
  creator          User                   @relation(fields: [createdBy], references: [id])
  verifications    AssetVerification[]
  assignments      VerificationAssignment[]
  
  @@map("verification_campaigns")
}

// Individual Asset Verifications
model AssetVerification {
  id                 Int                    @id @default(autoincrement())
  campaignId         Int                    @map("campaign_id")
  assetId            Int                    @map("asset_id")
  verifierId         Int                    @map("verifier_id")
  verificationDate   DateTime               @map("verification_date")
  status             AssetVerificationStatus @default(PENDING)
  physicalCondition  PhysicalCondition      @map("physical_condition")
  locationAccurate   Boolean                @map("location_accurate")
  actualStateId      Int?                   @map("actual_state_id")
  actualLgaId        Int?                   @map("actual_lga_id")
  actualLocation     String?                @map("actual_location")
  notes              String?
  photoUrls          String[]               @map("photo_urls")
  qrCodeScanned      Boolean                @default(false) @map("qr_code_scanned")
  createdAt          DateTime               @default(now()) @map("created_at")
  updatedAt          DateTime               @updatedAt @map("updated_at")
  
  campaign           VerificationCampaign   @relation(fields: [campaignId], references: [id])
  asset              Asset                  @relation(fields: [assetId], references: [id])
  verifier           User                   @relation(fields: [verifierId], references: [id])
  actualState        State?                 @relation("ActualState", fields: [actualStateId], references: [id])
  actualLga          LGA?                   @relation("ActualLGA", fields: [actualLgaId], references: [id])
  discrepancies      VerificationDiscrepancy[]
  
  @@unique([campaignId, assetId])
  @@map("asset_verifications")
}

// Discrepancy Tracking
model VerificationDiscrepancy {
  id               Int                    @id @default(autoincrement())
  verificationId   Int                    @map("verification_id")
  discrepancyType  DiscrepancyType
  description      String
  severity         DiscrepancySeverity    @default(MEDIUM)
  status           DiscrepancyStatus      @default(REPORTED)
  reportedBy       Int                    @map("reported_by")
  assignedTo       Int?                   @map("assigned_to")
  resolvedBy       Int?                   @map("resolved_by")
  resolutionNotes  String?                @map("resolution_notes")
  resolutionDate   DateTime?              @map("resolution_date")
  createdAt        DateTime               @default(now()) @map("created_at")
  updatedAt        DateTime               @updatedAt @map("updated_at")
  
  verification     AssetVerification      @relation(fields: [verificationId], references: [id])
  reporter         User                   @relation("ReportedDiscrepancies", fields: [reportedBy], references: [id])
  assignee         User?                  @relation("AssignedDiscrepancies", fields: [assignedTo], references: [id])
  resolver         User?                  @relation("ResolvedDiscrepancies", fields: [resolvedBy], references: [id])
  
  @@map("verification_discrepancies")
}

// Team Assignments
model VerificationAssignment {
  id           Int                  @id @default(autoincrement())
  campaignId   Int                  @map("campaign_id")
  userId       Int                  @map("user_id")
  role         VerificationRole
  stateIds     Int[]                @map("state_ids")
  lgaIds       Int[]                @map("lga_ids")
  createdAt    DateTime             @default(now()) @map("created_at")
  
  campaign     VerificationCampaign @relation(fields: [campaignId], references: [id])
  user         User                 @relation(fields: [userId], references: [id])
  
  @@unique([campaignId, userId])
  @@map("verification_assignments")
}

// Enums
enum VerificationCampaignStatus {
  PLANNED
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum AssetVerificationStatus {
  PENDING
  IN_PROGRESS
  VERIFIED
  DISCREPANCY_FOUND
  MISSING
  DAMAGED
  REQUIRES_REVIEW
}

enum PhysicalCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
  DAMAGED
  MISSING
}

enum DiscrepancyType {
  MISSING_ASSET
  LOCATION_MISMATCH
  CONDITION_DISCREPANCY
  UNAUTHORIZED_ASSET
  DATA_MISMATCH
  QUANTITY_VARIANCE
}

enum DiscrepancySeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum DiscrepancyStatus {
  REPORTED
  ACKNOWLEDGED
  INVESTIGATING
  RESOLVED
  CLOSED
}

enum VerificationRole {
  TEAM_LEADER
  VERIFIER
  SUPERVISOR
  OBSERVER
}
```

### 3.2 API Architecture
RESTful endpoints following the existing pattern:

```typescript
// Campaign Management
GET    /api/stock-verification/campaigns
POST   /api/stock-verification/campaigns
GET    /api/stock-verification/campaigns/[id]
PUT    /api/stock-verification/campaigns/[id]
DELETE /api/stock-verification/campaigns/[id]

// Asset Verification
GET    /api/stock-verification/campaigns/[id]/verifications
POST   /api/stock-verification/campaigns/[id]/verifications
GET    /api/stock-verification/verifications/[id]
PUT    /api/stock-verification/verifications/[id]

// Discrepancy Management
GET    /api/stock-verification/discrepancies
POST   /api/stock-verification/discrepancies
GET    /api/stock-verification/discrepancies/[id]
PUT    /api/stock-verification/discrepancies/[id]

// Team Management
GET    /api/stock-verification/campaigns/[id]/assignments
POST   /api/stock-verification/campaigns/[id]/assignments
PUT    /api/stock-verification/assignments/[id]
DELETE /api/stock-verification/assignments/[id]

// Reporting
GET    /api/stock-verification/reports/campaign/[id]
GET    /api/stock-verification/reports/discrepancies
GET    /api/stock-verification/reports/analytics

// File Upload
POST   /api/stock-verification/upload/photos
GET    /api/stock-verification/photos/[id]
```

### 3.3 Component Architecture
React components following existing patterns:

```typescript
// Main Pages
/app/stock-verification/
├── page.tsx                 // Dashboard overview
├── campaigns/
│   ├── page.tsx            // Campaign list
│   ├── new/page.tsx        // Create campaign
│   └── [id]/
│       ├── page.tsx        // Campaign details
│       ├── verify/page.tsx // Verification interface
│       └── reports/page.tsx // Campaign reports
├── discrepancies/
│   ├── page.tsx            // Discrepancy management
│   └── [id]/page.tsx       // Discrepancy details
└── reports/
    ├── page.tsx            // Reports dashboard
    └── analytics/page.tsx   // Advanced analytics

// Components
/components/stock-verification/
├── CampaignManager.tsx      // Campaign CRUD interface
├── VerificationForm.tsx     // Asset verification form
├── DiscrepancyTracker.tsx   // Discrepancy management
├── TeamAssignment.tsx       // Team assignment interface
├── PhotoCapture.tsx         // Photo capture component
├── QRScanner.tsx           // QR code scanning
├── VerificationDashboard.tsx // Progress tracking
├── ReportsGenerator.tsx     // Report generation
└── ui/
    ├── VerificationCard.tsx // Individual verification display
    ├── CampaignCard.tsx    // Campaign overview card
    └── DiscrepancyBadge.tsx // Discrepancy status indicator
```

## 4. Integration Points

### 4.1 Existing System Integration
- **Asset Management**: Seamless integration with existing asset records
- **User Management**: Leverages existing role-based access control
- **Location Services**: Uses existing State/LGA hierarchical structure
- **Audit Logging**: Extends existing audit trail system
- **Real-time Updates**: WebSocket integration for live updates

### 4.2 External Integrations (Future)
- **Mobile Apps**: REST API ready for mobile verification apps
- **QR Code Generation**: Integration with asset labeling systems
- **Photo Storage**: Cloud storage integration for verification photos
- **Notification Services**: Email/SMS notifications for discrepancies

## 5. Security & Compliance

### 5.1 Security Measures
- **Authentication**: NextAuth.js integration with existing user system
- **Authorization**: Role-based access control with granular permissions
- **Data Validation**: Zod schema validation for all inputs
- **File Upload Security**: Secure photo upload with file type validation
- **Audit Trail**: Complete audit logging for all verification activities

### 5.2 Compliance Features
- **Data Integrity**: Immutable verification records with timestamps
- **Audit Reports**: Comprehensive audit trails for regulatory compliance
- **Access Logging**: Complete user activity tracking
- **Data Retention**: Configurable data retention policies

## 6. Performance Considerations

### 6.1 Database Optimization
- **Indexing Strategy**: Optimized indexes for verification queries
- **Pagination**: Efficient pagination for large verification datasets
- **Caching**: Redis caching for frequently accessed verification data
- **Archive Strategy**: Automated archiving of completed campaigns

### 6.2 File Management
- **Photo Optimization**: Automatic image compression and resizing
- **CDN Integration**: Content delivery network for photo assets
- **Storage Management**: Efficient file storage and retrieval

## 7. Monitoring & Analytics

### 7.1 Key Performance Indicators
- **Verification Progress**: Real-time campaign completion tracking
- **Discrepancy Rates**: Asset discrepancy trends and patterns
- **Team Performance**: Individual and team verification metrics
- **System Usage**: Module adoption and usage analytics

### 7.2 Reporting Capabilities
- **Executive Dashboards**: High-level verification status overview
- **Operational Reports**: Detailed verification and discrepancy reports
- **Compliance Reports**: Audit-ready compliance documentation
- **Trend Analysis**: Historical data analysis and forecasting

---

*This architecture design provides a comprehensive foundation for implementing a robust Stock Verification module that seamlessly integrates with the existing NPC Asset Management System while maintaining scalability, security, and compliance requirements.*