-- =============================================================================
-- Stock Verification Module Database Rollback Script
-- Version: 1.0.0
-- Created: 2024-01-13
-- Description: Complete rollback script for Stock Verification Module
-- WARNING: This will permanently delete all stock verification data!
-- =============================================================================

-- Start transaction to ensure atomic rollback
BEGIN;

-- =============================================================================
-- CONFIRMATION PROMPT
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STOCK VERIFICATION MODULE ROLLBACK';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'WARNING: This script will permanently delete:';
    RAISE NOTICE '- All verification campaigns and their data';
    RAISE NOTICE '- All asset verifications and photos';
    RAISE NOTICE '- All verification discrepancies';
    RAISE NOTICE '- All verification assignments and analytics';
    RAISE NOTICE '- All verification templates and schedules';
    RAISE NOTICE '- All related database objects (tables, views, functions)';
    RAISE NOTICE '';
    RAISE NOTICE 'This action cannot be undone!';
    RAISE NOTICE 'Make sure you have a backup before proceeding.';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- 1. DROP VIEWS
-- =============================================================================

-- Drop reporting views
DROP VIEW IF EXISTS "CampaignOverview" CASCADE;

-- =============================================================================
-- 2. DROP TRIGGERS
-- =============================================================================

-- Drop update triggers
DROP TRIGGER IF EXISTS update_verification_campaign_updated_at ON "VerificationCampaign";
DROP TRIGGER IF EXISTS update_asset_verification_updated_at ON "AssetVerification";
DROP TRIGGER IF EXISTS update_verification_discrepancy_updated_at ON "VerificationDiscrepancy";
DROP TRIGGER IF EXISTS update_verification_assignment_updated_at ON "VerificationAssignment";
DROP TRIGGER IF EXISTS update_verification_template_updated_at ON "VerificationTemplate";
DROP TRIGGER IF EXISTS update_verification_schedule_updated_at ON "VerificationSchedule";
DROP TRIGGER IF EXISTS update_verification_analytics_updated_at ON "VerificationAnalytics";

-- Drop business logic triggers
DROP TRIGGER IF EXISTS update_campaign_target_count_trigger ON "VerificationCampaign";

-- =============================================================================
-- 3. DROP FUNCTIONS
-- =============================================================================

-- Drop custom functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_campaign_target_count() CASCADE;

-- =============================================================================
-- 4. DROP INDEXES (explicit cleanup)
-- =============================================================================

-- Campaign indexes
DROP INDEX IF EXISTS "VerificationCampaign_status_idx";
DROP INDEX IF EXISTS "VerificationCampaign_priority_idx";
DROP INDEX IF EXISTS "VerificationCampaign_createdBy_idx";
DROP INDEX IF EXISTS "VerificationCampaign_dates_idx";
DROP INDEX IF EXISTS "VerificationCampaign_stateIds_idx";
DROP INDEX IF EXISTS "VerificationCampaign_name_unique";

-- Verification indexes
DROP INDEX IF EXISTS "AssetVerification_campaign_asset_idx";
DROP INDEX IF EXISTS "AssetVerification_verifier_idx";
DROP INDEX IF EXISTS "AssetVerification_status_idx";
DROP INDEX IF EXISTS "AssetVerification_dates_idx";
DROP INDEX IF EXISTS "AssetVerification_assignment_idx";

-- Discrepancy indexes
DROP INDEX IF EXISTS "VerificationDiscrepancy_campaign_idx";
DROP INDEX IF EXISTS "VerificationDiscrepancy_verification_idx";
DROP INDEX IF EXISTS "VerificationDiscrepancy_status_severity_idx";
DROP INDEX IF EXISTS "VerificationDiscrepancy_reporter_idx";
DROP INDEX IF EXISTS "VerificationDiscrepancy_assignee_idx";
DROP INDEX IF EXISTS "VerificationDiscrepancy_reference_idx";

-- Assignment indexes
DROP INDEX IF EXISTS "VerificationAssignment_campaign_user_idx";
DROP INDEX IF EXISTS "VerificationAssignment_role_idx";
DROP INDEX IF EXISTS "VerificationAssignment_status_idx";
DROP INDEX IF EXISTS "VerificationAssignment_stateIds_idx";
DROP INDEX IF EXISTS "VerificationAssignment_campaign_user_unique";

-- Template indexes
DROP INDEX IF EXISTS "VerificationTemplate_type_idx";
DROP INDEX IF EXISTS "VerificationTemplate_active_idx";
DROP INDEX IF EXISTS "VerificationTemplate_categoryIds_idx";

-- Schedule indexes
DROP INDEX IF EXISTS "VerificationSchedule_status_idx";
DROP INDEX IF EXISTS "VerificationSchedule_next_run_idx";
DROP INDEX IF EXISTS "VerificationSchedule_active_idx";

-- Photo indexes
-- Skipped: No VerificationPhoto indexes in current design.

-- Analytics indexes
DROP INDEX IF EXISTS "VerificationAnalytics_campaign_date_idx";
DROP INDEX IF EXISTS "VerificationAnalytics_campaign_date_unique";

-- =============================================================================
-- 5. DROP TABLES (in reverse dependency order)
-- =============================================================================

-- Analytics and reporting tables (no dependencies)
DROP TABLE IF EXISTS "VerificationAnalytics" CASCADE;

-- Photo table
-- Skipped: No dedicated VerificationPhoto table; photos stored on filesystem and referenced via AssetVerification.photoUrls.

-- Schedule table (depends on VerificationTemplate)
DROP TABLE IF EXISTS "VerificationSchedule" CASCADE;

-- Template table (no dependencies on other verification tables)
DROP TABLE IF EXISTS "VerificationTemplate" CASCADE;

-- Discrepancy table (depends on AssetVerification, VerificationCampaign)
DROP TABLE IF EXISTS "VerificationDiscrepancy" CASCADE;

-- Asset verification table (depends on VerificationCampaign, VerificationAssignment)
DROP TABLE IF EXISTS "AssetVerification" CASCADE;

-- Assignment table (depends on VerificationCampaign)
DROP TABLE IF EXISTS "VerificationAssignment" CASCADE;

-- Campaign table (root table)
DROP TABLE IF EXISTS "VerificationCampaign" CASCADE;

-- =============================================================================
-- 6. DROP ENUMS (in any order since no dependencies between them)
-- =============================================================================

-- Drop all verification-related enums
DROP TYPE IF EXISTS "VerificationCampaignStatus" CASCADE;
DROP TYPE IF EXISTS "CampaignPriority" CASCADE;
DROP TYPE IF EXISTS "AssetVerificationStatus" CASCADE;
DROP TYPE IF EXISTS "PhysicalCondition" CASCADE;
DROP TYPE IF EXISTS "DiscrepancyType" CASCADE;
DROP TYPE IF EXISTS "DiscrepancySeverity" CASCADE;
DROP TYPE IF EXISTS "DiscrepancyStatus" CASCADE;
DROP TYPE IF EXISTS "VerificationRole" CASCADE;
DROP TYPE IF EXISTS "AssignmentStatus" CASCADE;
DROP TYPE IF EXISTS "VerificationTemplateType" CASCADE;
DROP TYPE IF EXISTS "ScheduleType" CASCADE;
DROP TYPE IF EXISTS "ScheduleStatus" CASCADE;

-- =============================================================================
-- 7. CLEAN UP ORPHANED DATA (if any exists in related tables)
-- =============================================================================

-- Clean up any audit log entries related to verification
-- DELETE FROM "AuditLog" WHERE "tableName" IN (
--     'VerificationCampaign',
--     'AssetVerification', 
--     'VerificationDiscrepancy',
--     'VerificationAssignment',
--     'VerificationTemplate',
--     'VerificationSchedule',
--     'VerificationAnalytics'
-- );

-- Clean up any notification entries related to verification (if applicable)
-- DELETE FROM "Notification" WHERE "type" LIKE '%VERIFICATION%';

-- Clean up any permission entries related to verification (if applicable)
-- DELETE FROM "Permission" WHERE "resource" LIKE '%verification%';

-- =============================================================================
-- 8. VACUUM TABLES (Optional - for database cleanup)
-- =============================================================================

-- Vacuum analyze related tables to reclaim space and update statistics
-- VACUUM ANALYZE "User";
-- VACUUM ANALYZE "Asset";
-- VACUUM ANALYZE "AuditLog";

-- =============================================================================
-- 9. RESET SEQUENCES (if needed)
-- =============================================================================

-- Note: Sequences are automatically dropped when tables are dropped,
-- so no explicit cleanup is needed for sequences

-- =============================================================================
-- 10. VERIFICATION OF ROLLBACK
-- =============================================================================

-- Verify that all verification objects have been removed
DO $$
DECLARE
    table_count INTEGER;
    enum_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
BEGIN
    -- Count remaining verification tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name LIKE '%Verification%' 
    AND table_schema = 'public';
    
    -- Count remaining verification enums
    SELECT COUNT(*) INTO enum_count
    FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND t.typname LIKE '%Verification%' 
    OR t.typname IN ('CampaignPriority', 'PhysicalCondition', 'DiscrepancyType', 
                     'DiscrepancySeverity', 'DiscrepancyStatus', 'AssignmentStatus',
                     'ScheduleType', 'ScheduleStatus');
    
    -- Count remaining verification functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_name LIKE '%verification%' 
    AND routine_schema = 'public';
    
    -- Count remaining verification views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE (view_name LIKE '%Verification%' OR view_name LIKE '%Campaign%')
    AND table_schema = 'public';
    
    -- Report results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ROLLBACK VERIFICATION RESULTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Remaining verification tables: %', table_count;
    RAISE NOTICE 'Remaining verification enums: %', enum_count;
    RAISE NOTICE 'Remaining verification functions: %', function_count;
    RAISE NOTICE 'Remaining verification views: %', view_count;
    
    IF table_count = 0 AND enum_count = 0 AND function_count = 0 AND view_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All verification objects have been removed!';
    ELSE
        RAISE WARNING 'Some verification objects may still exist. Please check manually.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- 11. POST-ROLLBACK CLEANUP RECOMMENDATIONS
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'POST-ROLLBACK RECOMMENDATIONS:';
    RAISE NOTICE '1. Check application code for any references to removed objects';
    RAISE NOTICE '2. Update Prisma schema file to remove verification models';
    RAISE NOTICE '3. Run "npx prisma db pull" to sync the schema';
    RAISE NOTICE '4. Remove verification-related API routes and services';
    RAISE NOTICE '5. Clean up any verification-related files and tests';
    RAISE NOTICE '6. Update documentation to reflect the changes';
    RAISE NOTICE '7. Consider running VACUUM FULL if significant space reclaim is needed';
    RAISE NOTICE '';
END $$;

-- Commit the transaction
COMMIT;

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STOCK VERIFICATION MODULE ROLLBACK COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE 'All verification tables, types, functions, and views have been removed.';
    RAISE NOTICE 'Please follow the post-rollback recommendations above.';
    RAISE NOTICE '========================================';
END $$;