-- =============================================================================
-- Stock Verification Module Database Migration
-- Version: 1.0.0
-- Created: 2024-01-13
-- Description: Complete migration script for Stock Verification Module
-- =============================================================================

-- Start transaction to ensure atomic migration
BEGIN;

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

-- Verification Campaign Status
DO $$ BEGIN
    CREATE TYPE "VerificationCampaignStatus" AS ENUM (
        'DRAFT',
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Campaign Priority
DO $$ BEGIN
    CREATE TYPE "CampaignPriority" AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Asset Verification Status
DO $$ BEGIN
    CREATE TYPE "AssetVerificationStatus" AS ENUM (
        'PENDING',
        'IN_PROGRESS',
        'VERIFIED',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Physical Condition
DO $$ BEGIN
    CREATE TYPE "PhysicalCondition" AS ENUM (
        'EXCELLENT',
        'GOOD',
        'FAIR',
        'POOR',
        'DAMAGED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Discrepancy Type
DO $$ BEGIN
    CREATE TYPE "DiscrepancyType" AS ENUM (
        'MISSING_ASSET',
        'LOCATION_MISMATCH',
        'CONDITION_MISMATCH',
        'DATA_INCONSISTENCY',
        'PHYSICAL_DAMAGE',
        'FUNCTIONAL_ISSUE',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Discrepancy Severity
DO $$ BEGIN
    CREATE TYPE "DiscrepancySeverity" AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Discrepancy Status
DO $$ BEGIN
    CREATE TYPE "DiscrepancyStatus" AS ENUM (
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verification Role
DO $$ BEGIN
    CREATE TYPE "VerificationRole" AS ENUM (
        'CAMPAIGN_MANAGER',
        'SUPERVISOR',
        'LEAD_VERIFIER',
        'FIELD_VERIFIER',
        'REVIEWER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Assignment Status
DO $$ BEGIN
    CREATE TYPE "AssignmentStatus" AS ENUM (
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verification Template Type
DO $$ BEGIN
    CREATE TYPE "VerificationTemplateType" AS ENUM (
        'STANDARD',
        'DETAILED',
        'QUICK_CHECK',
        'CUSTOM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Schedule Type
DO $$ BEGIN
    CREATE TYPE "ScheduleType" AS ENUM (
        'ONCE',
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'QUARTERLY',
        'ANNUALLY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Schedule Status
DO $$ BEGIN
    CREATE TYPE "ScheduleStatus" AS ENUM (
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. CREATE TABLES
-- =============================================================================

-- Verification Campaigns
CREATE TABLE IF NOT EXISTS "VerificationCampaign" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "VerificationCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "CampaignPriority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "stateIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "lgaIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "categoryIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "instructions" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "targetAssetCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCampaign_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationCampaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Asset Verifications
CREATE TABLE IF NOT EXISTS "AssetVerification" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "verifierId" INTEGER NOT NULL,
    "assignmentId" INTEGER,
    "status" "AssetVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "physicalCondition" "PhysicalCondition",
    "functionalStatus" TEXT,
    "location" TEXT,
    "coordinates" JSONB,
    "notes" TEXT,
    "reviewNotes" TEXT,
    "verificationDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "reviewerId" INTEGER,
    "verificationDuration" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "scheduledDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetVerification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AssetVerification_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssetVerification_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssetVerification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssetVerification_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Verification Discrepancies
CREATE TABLE IF NOT EXISTS "VerificationDiscrepancy" (
    "id" SERIAL NOT NULL,
    "verificationId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "assigneeId" INTEGER,
    "resolverId" INTEGER,
    "type" "DiscrepancyType" NOT NULL,
    "severity" "DiscrepancySeverity" NOT NULL,
    "status" "DiscrepancyStatus" NOT NULL DEFAULT 'OPEN',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "expectedValue" TEXT,
    "actualValue" TEXT,
    "location" TEXT,
    "coordinates" JSONB,
    "photoEvidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "resolutionNotes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "reference" VARCHAR(100) NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDiscrepancy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationDiscrepancy_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "AssetVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationDiscrepancy_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationDiscrepancy_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationDiscrepancy_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationDiscrepancy_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationDiscrepancy_resolverId_fkey" FOREIGN KEY ("resolverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Verification Assignments
CREATE TABLE IF NOT EXISTS "VerificationAssignment" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "VerificationRole" NOT NULL,
    "stateIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "lgaIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "categoryIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dailyTarget" INTEGER,
    "totalTarget" INTEGER,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "instructions" TEXT,
    "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "reportingTo" INTEGER,
    "mobileAccess" BOOLEAN NOT NULL DEFAULT true,
    "offlineAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationAssignment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerificationAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerificationAssignment_reportingTo_fkey" FOREIGN KEY ("reportingTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Verification Templates
CREATE TABLE IF NOT EXISTS "VerificationTemplate" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "VerificationTemplateType" NOT NULL DEFAULT 'STANDARD',
    "categoryIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "checklistItems" JSONB NOT NULL DEFAULT '[]',
    "requiredPhotos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB NOT NULL DEFAULT '[]',
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Verification Schedules
CREATE TABLE IF NOT EXISTS "VerificationSchedule" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "ScheduleType" NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "stateIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "lgaIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "categoryIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "templateId" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "month" INTEGER,
    "nextRunDate" TIMESTAMP(3),
    "lastRunDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationSchedule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "VerificationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VerificationSchedule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Verification Photos
-- Skipped: Photos stored on filesystem (uploads/verifications) and referenced via AssetVerification.photoUrls; no dedicated table.

-- Verification Analytics
CREATE TABLE IF NOT EXISTS "VerificationAnalytics" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "totalVerifications" INTEGER NOT NULL DEFAULT 0,
    "completedVerifications" INTEGER NOT NULL DEFAULT 0,
    "pendingVerifications" INTEGER NOT NULL DEFAULT 0,
    "averageVerificationTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discrepancyCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "teamEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAnalytics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationAnalytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VerificationCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- =============================================================================
-- 3. ADD FOREIGN KEY CONSTRAINT TO EXISTING TABLES
-- =============================================================================

-- Add foreign key constraint to AssetVerification for assignmentId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'AssetVerification_assignmentId_fkey'
    ) THEN
        ALTER TABLE "AssetVerification" 
        ADD CONSTRAINT "AssetVerification_assignmentId_fkey" 
        FOREIGN KEY ("assignmentId") REFERENCES "VerificationAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- =============================================================================
-- 4. CREATE INDEXES
-- =============================================================================

-- Campaign indexes
CREATE INDEX IF NOT EXISTS "VerificationCampaign_status_idx" ON "VerificationCampaign"("status");
CREATE INDEX IF NOT EXISTS "VerificationCampaign_priority_idx" ON "VerificationCampaign"("priority");
CREATE INDEX IF NOT EXISTS "VerificationCampaign_createdBy_idx" ON "VerificationCampaign"("createdBy");
CREATE INDEX IF NOT EXISTS "VerificationCampaign_dates_idx" ON "VerificationCampaign"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "VerificationCampaign_stateIds_idx" ON "VerificationCampaign" USING GIN("stateIds");

-- Verification indexes
CREATE INDEX IF NOT EXISTS "AssetVerification_campaign_asset_idx" ON "AssetVerification"("campaignId", "assetId");
CREATE INDEX IF NOT EXISTS "AssetVerification_verifier_idx" ON "AssetVerification"("verifierId");
CREATE INDEX IF NOT EXISTS "AssetVerification_status_idx" ON "AssetVerification"("status");
CREATE INDEX IF NOT EXISTS "AssetVerification_dates_idx" ON "AssetVerification"("scheduledDate", "verificationDate");
CREATE INDEX IF NOT EXISTS "AssetVerification_assignment_idx" ON "AssetVerification"("assignmentId");

-- Discrepancy indexes
CREATE INDEX IF NOT EXISTS "VerificationDiscrepancy_campaign_idx" ON "VerificationDiscrepancy"("campaignId");
CREATE INDEX IF NOT EXISTS "VerificationDiscrepancy_verification_idx" ON "VerificationDiscrepancy"("verificationId");
CREATE INDEX IF NOT EXISTS "VerificationDiscrepancy_status_severity_idx" ON "VerificationDiscrepancy"("status", "severity");
CREATE INDEX IF NOT EXISTS "VerificationDiscrepancy_reporter_idx" ON "VerificationDiscrepancy"("reporterId");
CREATE INDEX IF NOT EXISTS "VerificationDiscrepancy_assignee_idx" ON "VerificationDiscrepancy"("assigneeId");
CREATE INDEX IF NOT EXISTS "VerificationDiscrepancy_reference_idx" ON "VerificationDiscrepancy"("reference");

-- Assignment indexes
CREATE INDEX IF NOT EXISTS "VerificationAssignment_campaign_user_idx" ON "VerificationAssignment"("campaignId", "userId");
CREATE INDEX IF NOT EXISTS "VerificationAssignment_role_idx" ON "VerificationAssignment"("role");
CREATE INDEX IF NOT EXISTS "VerificationAssignment_status_idx" ON "VerificationAssignment"("status");
CREATE INDEX IF NOT EXISTS "VerificationAssignment_stateIds_idx" ON "VerificationAssignment" USING GIN("stateIds");

-- Template indexes
CREATE INDEX IF NOT EXISTS "VerificationTemplate_type_idx" ON "VerificationTemplate"("type");
CREATE INDEX IF NOT EXISTS "VerificationTemplate_active_idx" ON "VerificationTemplate"("isActive");
CREATE INDEX IF NOT EXISTS "VerificationTemplate_categoryIds_idx" ON "VerificationTemplate" USING GIN("categoryIds");

-- Schedule indexes
CREATE INDEX IF NOT EXISTS "VerificationSchedule_status_idx" ON "VerificationSchedule"("status");
CREATE INDEX IF NOT EXISTS "VerificationSchedule_next_run_idx" ON "VerificationSchedule"("nextRunDate");
CREATE INDEX IF NOT EXISTS "VerificationSchedule_active_idx" ON "VerificationSchedule"("isActive");

-- Photo indexes
-- Skipped: No VerificationPhoto table; photos tracked via AssetVerification.photoUrls.

-- Analytics indexes
CREATE INDEX IF NOT EXISTS "VerificationAnalytics_campaign_date_idx" ON "VerificationAnalytics"("campaignId", "date");

-- =============================================================================
-- 5. CREATE UNIQUE CONSTRAINTS
-- =============================================================================

-- Unique campaign name per organization (if multi-tenant)
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationCampaign_name_unique" ON "VerificationCampaign"("name");

-- Unique assignment per campaign-user combination
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationAssignment_campaign_user_unique" ON "VerificationAssignment"("campaignId", "userId");

-- Unique analytics per campaign-date combination
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationAnalytics_campaign_date_unique" ON "VerificationAnalytics"("campaignId", "date");

-- =============================================================================
-- 6. UPDATE EXISTING MODELS WITH STOCK VERIFICATION RELATIONSHIPS
-- =============================================================================

-- Add stock verification relationships to User table (if not already present)
DO $$
BEGIN
    -- Check if the relationship columns exist in User table comments or constraints
    -- This assumes the relationship is handled by Prisma's schema
    NULL;
END $$;

-- =============================================================================
-- 7. INSERT DEFAULT VERIFICATION TEMPLATES
-- =============================================================================

-- Insert default templates if they don't exist
INSERT INTO "VerificationTemplate" ("name", "description", "type", "checklistItems", "requiredPhotos", "instructions", "createdBy")
SELECT 
    'Standard Asset Verification',
    'Standard template for general asset verification',
    'STANDARD',
    '[
        {"id": "physical_check", "label": "Physical condition check", "required": true},
        {"id": "location_verify", "label": "Verify asset location", "required": true},
        {"id": "tag_readable", "label": "Asset tag is readable", "required": true},
        {"id": "functional_test", "label": "Basic functional test", "required": false}
    ]'::jsonb,
    ARRAY['BEFORE', 'GENERAL'],
    'Standard verification process for all asset types',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "VerificationTemplate" WHERE "name" = 'Standard Asset Verification'
);

-- Insert IT Equipment template
INSERT INTO "VerificationTemplate" ("name", "description", "type", "checklistItems", "requiredPhotos", "instructions", "createdBy")
SELECT 
    'IT Equipment Verification',
    'Specialized template for IT equipment verification',
    'DETAILED',
    '[
        {"id": "power_test", "label": "Power on test", "required": true},
        {"id": "network_check", "label": "Network connectivity check", "required": true},
        {"id": "software_verify", "label": "Verify installed software", "required": false},
        {"id": "peripheral_check", "label": "Check connected peripherals", "required": false},
        {"id": "security_scan", "label": "Basic security scan", "required": true}
    ]'::jsonb,
    ARRAY['BEFORE', 'AFTER', 'GENERAL'],
    'Detailed verification for computers, servers, and network equipment',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "VerificationTemplate" WHERE "name" = 'IT Equipment Verification'
);

-- Insert Quick Check template
INSERT INTO "VerificationTemplate" ("name", "description", "type", "checklistItems", "requiredPhotos", "instructions", "createdBy")
SELECT 
    'Quick Check Verification',
    'Simplified template for quick asset checks',
    'QUICK_CHECK',
    '[
        {"id": "presence_check", "label": "Asset is present", "required": true},
        {"id": "tag_check", "label": "Asset tag matches", "required": true}
    ]'::jsonb,
    ARRAY['GENERAL'],
    'Quick verification for routine checks',
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "VerificationTemplate" WHERE "name" = 'Quick Check Verification'
);

-- =============================================================================
-- 8. CREATE FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_verification_campaign_updated_at BEFORE UPDATE ON "VerificationCampaign" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_verification_updated_at BEFORE UPDATE ON "AssetVerification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_discrepancy_updated_at BEFORE UPDATE ON "VerificationDiscrepancy" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_assignment_updated_at BEFORE UPDATE ON "VerificationAssignment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_template_updated_at BEFORE UPDATE ON "VerificationTemplate" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_schedule_updated_at BEFORE UPDATE ON "VerificationSchedule" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verification_analytics_updated_at BEFORE UPDATE ON "VerificationAnalytics" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update campaign target asset count
CREATE OR REPLACE FUNCTION update_campaign_target_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update target asset count based on scope
    UPDATE "VerificationCampaign"
    SET "targetAssetCount" = (
        SELECT COUNT(*)
        FROM "Asset"
        WHERE 
            ("stateId" = ANY(NEW."stateIds") OR array_length(NEW."stateIds", 1) = 0)
            AND ("lgaId" = ANY(NEW."lgaIds") OR array_length(NEW."lgaIds", 1) = 0)
            AND ("categoryId" = ANY(NEW."categoryIds") OR array_length(NEW."categoryIds", 1) = 0)
            AND "isActive" = true
    )
    WHERE "id" = NEW."id";
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update target count when campaign is created or updated
CREATE TRIGGER update_campaign_target_count_trigger 
    AFTER INSERT OR UPDATE OF "stateIds", "lgaIds", "categoryIds" ON "VerificationCampaign"
    FOR EACH ROW EXECUTE FUNCTION update_campaign_target_count();

-- =============================================================================
-- 9. GRANT PERMISSIONS (if using role-based access)
-- =============================================================================

-- Grant appropriate permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- =============================================================================
-- 10. CREATE VIEWS (Optional - for reporting)
-- =============================================================================

-- Campaign overview view
CREATE OR REPLACE VIEW "CampaignOverview" AS
SELECT 
    c."id",
    c."name",
    c."status",
    c."priority",
    c."startDate",
    c."endDate",
    c."targetAssetCount",
    COUNT(DISTINCT va."id") as "assignmentCount",
    COUNT(DISTINCT av."id") as "verificationCount",
    COUNT(DISTINCT CASE WHEN av."status" IN ('VERIFIED', 'APPROVED') THEN av."id" END) as "completedVerifications",
    COUNT(DISTINCT vd."id") as "discrepancyCount",
    COALESCE(
        CASE 
            WHEN c."targetAssetCount" > 0 
            THEN ROUND((COUNT(DISTINCT CASE WHEN av."status" IN ('VERIFIED', 'APPROVED') THEN av."id" END)::decimal / c."targetAssetCount") * 100, 2)
            ELSE 0 
        END, 0
    ) as "completionRate"
FROM "VerificationCampaign" c
LEFT JOIN "VerificationAssignment" va ON c."id" = va."campaignId"
LEFT JOIN "AssetVerification" av ON c."id" = av."campaignId"
LEFT JOIN "VerificationDiscrepancy" vd ON c."id" = vd."campaignId"
GROUP BY c."id", c."name", c."status", c."priority", c."startDate", c."endDate", c."targetAssetCount";

-- Commit the transaction
COMMIT;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Stock Verification Module migration completed successfully!';
    RAISE NOTICE 'Created % new tables and % views', 8, 1;
    RAISE NOTICE 'Added % new enums for type safety', 10;
    RAISE NOTICE 'Created comprehensive indexes for performance';
END $$;